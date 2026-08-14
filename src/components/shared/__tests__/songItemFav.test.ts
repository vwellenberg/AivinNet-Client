import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

// The row pulls in the queue store (audio elements, the router and every view
// behind it) and the context-menu helper (the router again). Neither has
// anything to do with the favourite marker, so both are stubbed to keep this
// mount light in jsdom.
vi.mock('@/stores/queue', () => ({
    default: () => ({ currentindex: -1, currenttrackhash: '', playing: false }),
}))
vi.mock('@/helpers/contextMenuHandler', () => ({
    showTrackContextMenu: () => {},
}))
// Partial, not wholesale: `src/router` calls `createRouter` at module load and
// sits somewhere in this import chain, so a mock that drops it takes the whole
// suite file down with it.
vi.mock('vue-router', async () => {
    const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
    return { ...actual, useRoute: () => ({ path: '/folder' }) }
})

import SongItem from '../SongItem.vue'

import { dropSources, favType } from '@/enums'
import { Track } from '@/interfaces'
import useFavorites from '@/stores/favorites'

const track = (over: Partial<Track> = {}) =>
    ({
        trackhash: 'abc',
        title: 'A track',
        album: 'An album',
        albumhash: 'alb',
        artists: [],
        albumartists: [],
        duration: 120,
        is_favorite: false,
        ...over,
    } as unknown as Track)

const mountRow = (t: Track) =>
    mount(SongItem, {
        shallow: true,
        props: { track: t, index: 1, source: dropSources.playlist },
    })

/** What the row hands its two children as the favourite state. */
const favProps = (wrapper: ReturnType<typeof mountRow>) =>
    wrapper
        .findAllComponents({ name: 'TrackIndex' })
        .concat(wrapper.findAllComponents({ name: 'TrackDuration' }))
        .map(c => c.props('is_fav'))

// ---------------------------------------------------------------------------
// A track is held by several stores at once and those are separate objects, so
// the row cannot read the favourite state off the copy it was handed and stop
// there. It used to: `is_fav` was a ref seeded from the prop, re-seeded only
// when the virtual scroller recycled the row onto another trackhash. Flipping
// the favourite from the player bar therefore left the row on screen with a
// hollow heart until something remounted it — the bug this file pins.
// ---------------------------------------------------------------------------
describe('SongItem favourite marker', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('falls back to the flag the list was loaded with', () => {
        expect(favProps(mountRow(track({ is_favorite: true })))).toEqual([true, true])
        expect(favProps(mountRow(track({ is_favorite: false })))).toEqual([false, false])
    })

    it('follows a flip recorded elsewhere for the same track', async () => {
        const wrapper = mountRow(track({ is_favorite: false }))
        expect(favProps(wrapper)).toEqual([false, false])

        useFavorites().record(favType.track, 'abc', true)
        await nextTick()

        expect(favProps(wrapper)).toEqual([true, true])
    })

    it('ignores a flip recorded for a different track', async () => {
        const wrapper = mountRow(track({ is_favorite: false }))

        useFavorites().record(favType.track, 'other', true)
        await nextTick()

        expect(favProps(wrapper)).toEqual([false, false])
    })
})
