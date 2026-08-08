import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import useBrowseStore, { LETTERS, OTHER, initialOf } from '../searchBrowse'

const get = vi.fn()
vi.mock('@/requests/useAxios', () => ({ default: (...args: unknown[]) => get(...args) }))

/** A page of the /getall/artists shape. */
const page = (names: string[], total = names.length) => ({
    data: { items: names.map(name => ({ name })), total },
})

describe('initialOf', () => {
    it.each([
        ['Weezer', 'W'],
        ['weezer', 'W'],
        ['  Vulfpeck', 'V'],
        ['01', OTHER],
        ['...Und Null Sekunden', OTHER],
        ['響', OTHER],
        ['', OTHER],
    ])('%s belongs under %s', (name, expected) => {
        expect(initialOf(name)).toBe(expected)
    })
})

describe('the letter band', () => {
    it('offers # plus every letter, in that order', () => {
        expect(LETTERS).toHaveLength(27)
        expect(LETTERS[0]).toBe(OTHER)
        expect(LETTERS[1]).toBe('A')
        expect(LETTERS[26]).toBe('Z')
    })
})

describe('searchBrowse store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        get.mockReset()
    })

    it('counts artists per key and leaves empty keys absent', async () => {
        get.mockResolvedValueOnce(page(['Air', 'Alt-J', 'Bite', '01']))

        const store = useBrowseStore()
        await store.fetchArtists()

        expect(store.counts).toEqual({ A: 2, B: 1, [OTHER]: 1 })
        expect(store.counts['Z']).toBeUndefined()
    })

    it('fetches every page until the total is reached', async () => {
        const first = Array.from({ length: 500 }, (_, i) => `A${i}`)
        get.mockResolvedValueOnce(page(first, 501)).mockResolvedValueOnce(page(['Bite'], 501))

        const store = useBrowseStore()
        await store.fetchArtists()

        expect(get).toHaveBeenCalledTimes(2)
        expect(store.artists).toHaveLength(501)
        expect(get.mock.calls[1][0].url).toContain('start=500')
    })

    // A total the pages never reach would otherwise spin here forever.
    it('stops when a page comes back empty, whatever the total claims', async () => {
        get.mockResolvedValueOnce(page(['Bite'], 9999)).mockResolvedValueOnce(page([], 9999))

        const store = useBrowseStore()
        await store.fetchArtists()

        expect(get).toHaveBeenCalledTimes(2)
        expect(store.artists).toHaveLength(1)
    })

    it('fetches once, however often it is asked', async () => {
        get.mockResolvedValue(page(['Bite']))

        const store = useBrowseStore()
        await store.fetchArtists()
        await store.fetchArtists()

        expect(get).toHaveBeenCalledTimes(1)
    })

    it('keeps the page usable when the request fails', async () => {
        get.mockRejectedValueOnce(new Error('offline'))

        const store = useBrowseStore()
        await store.fetchArtists()

        expect(store.failed).toBe(true)
        expect(store.loading).toBe(false)
        expect(store.artists).toEqual([])
        // Not marked loaded, so opening the page again retries.
        expect(store.loaded).toBe(false)
    })

    it('shows the whole list until a letter is picked', async () => {
        get.mockResolvedValueOnce(page(['Air', 'Bite', 'Cake']))

        const store = useBrowseStore()
        await store.fetchArtists()

        expect(store.shown).toHaveLength(3)

        store.selectLetter('B')
        expect(store.shown.map(a => a.name)).toEqual(['Bite'])
    })

    it('treats a second press of the same key as "all again"', async () => {
        get.mockResolvedValueOnce(page(['Air', 'Bite']))

        const store = useBrowseStore()
        await store.fetchArtists()

        store.selectLetter('A')
        expect(store.letter).toBe('A')

        store.selectLetter('A')
        expect(store.letter).toBeNull()
        expect(store.shown).toHaveLength(2)
    })
})
