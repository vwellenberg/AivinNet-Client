import { createPinia, setActivePinia } from 'pinia'
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
    router: { currentRoute: { value: { name: 'SearchView' } }, push: vi.fn() },
    Routes: { search: 'SearchView' },
}))
vi.mock('@/requests/plugins', () => ({ pluginSetActive: vi.fn(), updatePluginSettings: vi.fn() }))
vi.mock('@/requests/settings', () => ({ updateConfig: vi.fn() }))
vi.mock('@/requests/useAxios', () => ({ default: vi.fn() }))
vi.mock('@/stores/devicesync', () => ({ default: () => ({ joined: false, applying: false, intercept: vi.fn() }) }))
vi.mock('@/stores/player', () => ({ usePlayer: () => ({ setVolume: vi.fn(), setMute: vi.fn() }) }))
vi.mock('@/context_menus/hashing', () => ({ getLastFmApiSig: vi.fn() }))
vi.mock('@/utils/recentSearches', () => ({ recordRecentSearch: vi.fn(), getRecentSearches: vi.fn(() => []) }))

import useSearchStore from '@/stores/search'

describe('search store: the query is always a string', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.useFakeTimers()
    })

    // The regression: SearchView assigned `route.query.q as string`, and on a
    // deep link / reload of /search/top there IS no `q`. The store then held
    // `undefined`, its watcher called .trim() on it, and the TypeError aborted
    // the render — the page came up without its search field.
    it('survives an empty query and clears the results (idle state)', async () => {
        const search = useSearchStore()
        search.top_results.tracks = [{ title: 'stale' } as any]
        search.tracks = [{ title: 'stale' } as any]

        search.query = ''
        // The watcher runs on the debounced value.
        vi.advanceTimersByTime(600)
        await Promise.resolve()

        expect(search.top_results.tracks).toEqual([])
        expect(search.tracks).toEqual([])
    })

    it('starts out empty rather than undefined', () => {
        expect(useSearchStore().query).toBe('')
    })
})
