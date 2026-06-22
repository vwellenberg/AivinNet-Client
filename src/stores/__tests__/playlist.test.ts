import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// --- mocks for the store's side-effecting deps ------------------------------
const getPlaylist = vi.fn()

vi.mock('@/requests/playlists', () => ({
    getPlaylist: (...args: any[]) => getPlaylist(...args),
    removeBannerImage: vi.fn(),
}))
vi.mock('@/utils/colortools/setColorsToStore', () => ({ default: vi.fn() }))
// Fixed, generous limit so small playlists are considered fully loaded.
vi.mock('@/stores/content-width', () => ({ track_limit: { value: 50 } }))
vi.mock('@/router', () => ({
    router: { currentRoute: { value: { name: 'other' } } },
    Routes: { playlist: 'playlist' },
}))

import usePlaylistStore from '../pages/playlist'

const mkTrack = (n: number) => ({
    trackhash: `h${n}`,
    filepath: `/music/${n}.mp3`,
    title: `Track ${n}`,
    album: 'Live Sesh and Xtra Songs',
    artists: [],
    albumartists: [],
    duration: 100,
})

const mkInfo = (count: number) => ({
    id: 59,
    name: 'Louis Cole',
    count,
    settings: { banner_pos: 50 },
    has_image: false,
    images: [],
    image: 'cover.webp',
})

describe('playlist store fetchAll', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        getPlaylist.mockReset()
    })

    it('fresh load sets allTracks and marks allLoaded when a page is shorter than the limit', async () => {
        // 8 trackhashes, only 7 resolve (one orphan) -> count 8, tracks 7
        const tracks = [1, 2, 3, 4, 5, 6, 7].map(mkTrack)
        getPlaylist.mockResolvedValue({ info: mkInfo(8), tracks })

        const store = usePlaylistStore()
        await store.fetchAll(59)

        expect(store.allTracks).toHaveLength(7)
        expect(store.allLoaded).toBe(true)
        expect(store.info.count).toBe(8)
    })

    it('does NOT trigger the play-path re-fetch once fully loaded (gate would be false)', async () => {
        const tracks = [1, 2, 3, 4, 5, 6, 7].map(mkTrack)
        getPlaylist.mockResolvedValue({ info: mkInfo(8), tracks })

        const store = usePlaylistStore()
        await store.fetchAll(59)

        // allLoaded short-circuits playFromPlaylistPage / usePlayFrom, so the
        // buggy re-fetch never runs for an orphan playlist.
        expect(store.allLoaded).toBe(true)
    })

    it('play-path fetchAll(true) REPLACES the list and never duplicates a track', async () => {
        const tracks = [1, 2, 3, 4, 5, 6, 7].map(mkTrack)
        getPlaylist.mockResolvedValue({ info: mkInfo(8), tracks })

        const store = usePlaylistStore()
        await store.fetchAll(59) // fresh load -> 7
        await store.fetchAll(59, false, true) // "load everything" pass

        expect(store.allTracks).toHaveLength(7)
        const hashes = store.allTracks.map(t => t.trackhash)
        expect(new Set(hashes).size).toBe(7) // no duplicates
        // Last call must paginate from 0 with -1, not from allTracks.length
        const lastArgs = getPlaylist.mock.calls.at(-1)
        expect(lastArgs?.[2]).toBe(0)
        expect(lastArgs?.[3]).toBe(-1)
    })

    it('incremental append dedupes by trackhash', async () => {
        const store = usePlaylistStore()

        getPlaylist.mockResolvedValueOnce({ info: mkInfo(6), tracks: [1, 2, 3].map(mkTrack) })
        await store.fetchAll(59) // fresh load -> [1,2,3]

        // Incremental page that overlaps (track 3 already present) + a new one
        getPlaylist.mockResolvedValueOnce({ info: mkInfo(6), tracks: [3, 4].map(mkTrack) })
        await store.fetchAll(59) // not fresh, not fetchAll -> append branch

        const hashes = store.allTracks.map(t => t.trackhash)
        expect(hashes).toEqual(['h1', 'h2', 'h3', 'h4'])
        expect(new Set(hashes).size).toBe(hashes.length)
    })

    it('tracks getter yields contiguous indices (no gap) for a deduped list', async () => {
        const tracks = [1, 2, 3, 4, 5, 6, 7].map(mkTrack)
        getPlaylist.mockResolvedValue({ info: mkInfo(8), tracks })

        const store = usePlaylistStore()
        await store.fetchAll(59)

        const indices = store.tracks.map(t => t.index)
        expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6])
        // The scroller keys by track.index -> all keys unique, no collision
        expect(new Set(indices).size).toBe(indices.length)
    })
})
