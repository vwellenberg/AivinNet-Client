import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// player.ts instantiates <audio> elements and a heavy import chain at module
// load. retagTrack never calls into it, so stub the module to keep the import
// light in jsdom.
vi.mock('@/stores/player', () => ({
    usePlayer: () => ({ clearNextAudio() {} }),
    audioSource: {},
    getUrl: () => '',
}))

import useTracklist from '@/stores/queue/tracklist'

const mk = (over: Partial<any> = {}) => ({
    trackhash: '',
    title: '',
    album: '',
    artists: [] as any[],
    albumartists: [] as any[],
    track: 0,
    ...over,
})

describe('tracklist.retagTrack', () => {
    beforeEach(() => setActivePinia(createPinia()))

    it('patches every queue copy matching the old hash and leaves others untouched', () => {
        const tl = useTracklist()
        tl.tracklist = [
            mk({ trackhash: 'OLD', title: 'Old' }),
            mk({ trackhash: 'KEEP', title: 'Keep' }),
            mk({ trackhash: 'OLD', title: 'Old too' }),
        ]

        tl.retagTrack('OLD', mk({ trackhash: 'NEW', title: 'New Title', artists: [{ name: 'A' }] }) as any)

        expect(tl.tracklist[0].trackhash).toBe('NEW')
        expect(tl.tracklist[0].title).toBe('New Title')
        expect(tl.tracklist[2].trackhash).toBe('NEW')
        expect(tl.tracklist[2].title).toBe('New Title')
        // unrelated track untouched
        expect(tl.tracklist[1].trackhash).toBe('KEEP')
        expect(tl.tracklist[1].title).toBe('Keep')
    })

    it('no-ops when no queue track matches', () => {
        const tl = useTracklist()
        tl.tracklist = [mk({ trackhash: 'A', title: 'A' })]

        tl.retagTrack('ZZZ', mk({ trackhash: 'NEW', title: 'X' }) as any)

        expect(tl.tracklist[0].trackhash).toBe('A')
        expect(tl.tracklist[0].title).toBe('A')
    })
})
