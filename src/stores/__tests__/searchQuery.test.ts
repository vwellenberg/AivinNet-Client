import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The store pulls in requests, the router, settings and the playlists page.
// None of it matters for what an empty query does to the results.
vi.mock('@/requests/searchMusic', () => ({
    searchAlbums: vi.fn(() => Promise.resolve({ results: [], more: false })),
    searchArtists: vi.fn(() => Promise.resolve({ results: [], more: false })),
    searchFolders: vi.fn(() => Promise.resolve({ results: [], more: false })),
    searchTopResults: vi.fn(() => Promise.resolve({})),
    searchTracks: vi.fn(() => Promise.resolve({ tracks: [], more: false })),
}))
vi.mock('@/router', () => ({
    // A realistic search route: the store reads params.page when it pushes.
    router: {
        currentRoute: { value: { name: 'SearchView', params: { page: 'top' }, query: {} } },
        push: vi.fn(),
        replace: vi.fn(),
    },
    Routes: { search: 'SearchView' },
}))
vi.mock('@/requests/plugins', () => ({ pluginSetActive: vi.fn(), updatePluginSettings: vi.fn() }))
vi.mock('@/requests/settings', () => ({ updateConfig: vi.fn() }))
vi.mock('@/requests/useAxios', () => ({ default: vi.fn() }))
vi.mock('@/stores/devicesync', () => ({ default: () => ({ joined: false, applying: false, intercept: vi.fn() }) }))
vi.mock('@/stores/player', () => ({ usePlayer: () => ({ setVolume: vi.fn(), setMute: vi.fn() }) }))
vi.mock('@/context_menus/hashing', () => ({ getLastFmApiSig: vi.fn() }))
vi.mock('@/utils/recentSearches', () => ({ recordRecentSearch: vi.fn(), getRecentSearches: vi.fn(() => []) }))
// The store watches a DEBOUNCED copy of the query. Debounce timers do not
// advance reliably under fake timers here, and the debounce is not what these
// tests are about — pass the ref straight through. Partial mock: other parts
// of the app (useBreakpoints) pull real exports from the same module.
vi.mock('@vueuse/core', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('@vueuse/core')
    return { ...actual, useDebounce: (value: unknown) => value }
})

import useSearchStore from '@/stores/search'

describe('search store: an absent query is an empty one', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('clears the results when the query is emptied (idle state)', async () => {
        const search = useSearchStore()
        search.query = 'genesis'
        await nextTick()

        search.top_results.tracks = [{ title: 'stale' } as any]
        search.tracks = [{ title: 'stale' } as any]

        search.query = ''
        await nextTick()

        expect(search.top_results.tracks).toEqual([])
        expect(search.tracks).toEqual([])
    })

    // The regression: SearchView assigned `route.query.q as string`, and on a
    // deep link / reload of /search/top there IS no `q`. The store then held
    // `undefined`, the watcher called .trim() on it, and the TypeError aborted
    // the render — the page came up without its search field, unusable.
    it('does not throw when the query goes missing entirely', async () => {
        const search = useSearchStore()
        search.query = 'genesis'
        await nextTick()

        search.top_results.tracks = [{ title: 'stale' } as any]

        search.query = undefined as unknown as string
        await expect(nextTick()).resolves.not.toThrow()

        expect(search.top_results.tracks).toEqual([])
    })

    it('starts out empty rather than undefined', () => {
        expect(useSearchStore().query).toBe('')
    })
})
