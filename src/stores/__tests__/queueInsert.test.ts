import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Both stores are the real thing here — the bug lives in the seam BETWEEN
// them (tracklist splices, queue holds the pre-rolled shuffle target), so
// mocking either one would mock away the thing under test. Everything else
// the two pull in (player, device sync, router, notifications, playlists) is
// irrelevant to insert maths and gets stubbed.
const { clearNextAudio, dsState } = vi.hoisted(() => ({
    clearNextAudio: vi.fn(),
    // Mutable so a test can put this device into a group session — the seam
    // there returns before anything is spliced locally.
    dsState: { joined: false, applying: false, intercept: vi.fn() },
}))

vi.mock('@/stores/player', () => ({
    audioSource: {
        playingSource: { src: '', currentTime: 0 },
        pausePlayingSource: vi.fn(),
        playPlayingSource: vi.fn(),
    },
    getUrl: () => '',
    usePlayer: () => ({
        playCurrent: vi.fn(),
        clearNextAudio,
        clearMovingNextTimeout: vi.fn(),
    }),
}))
vi.mock('@/stores/devicesync', () => ({ default: () => dsState }))
vi.mock('@/stores/interface', () => ({ default: () => ({ focusCurrentInSidebar: vi.fn() }) }))
vi.mock('@/stores/lyrics', () => ({ default: () => ({ setCurrentLine: vi.fn(), calculateCurrentLine: () => 0 }) }))
vi.mock('@/stores/notification', () => ({
    NotifType: { Success: 0, Error: 1, Info: 2 },
    useToast: () => ({ showNotification: vi.fn() }),
}))
vi.mock('@/stores/pages/playlists', () => ({ default: () => ({ playlists: [] }) }))
vi.mock('@/helpers/mediaNotification', () => ({ default: vi.fn() }))
vi.mock('@/requests/favorite', () => ({ isFavorite: () => Promise.resolve(false) }))
vi.mock('@/router', () => ({
    router: { currentRoute: { value: { name: 'other' } } },
    Routes: { Lyrics: 'Lyrics' },
}))

import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import useSettings from '@/stores/settings'

import { Track } from '@/interfaces'

const track = (i: number) => ({ trackhash: `h${i}`, filepath: `${i}.mp3` }) as Track

describe('tracklist.insertAt: the preloaded next track', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        clearNextAudio.mockClear()
        useTracklist().tracklist = Array.from({ length: 10 }, (_, i) => track(i))
    })

    it('drops the preload when the insert lands on the next row (sequential order)', () => {
        const queue = useQueue()
        queue.currentindex = 3
        expect(queue.nextindex).toBe(4)

        useTracklist().insertAt([track(99)], 4)

        expect(clearNextAudio).toHaveBeenCalled()
    })

    it('keeps the preload when the insert lands behind the next row', () => {
        const queue = useQueue()
        queue.currentindex = 3

        useTracklist().insertAt([track(99)], 8)

        expect(clearNextAudio).not.toHaveBeenCalled()
    })

    // The regression. Under shuffle `nextindex` is a pre-rolled random index,
    // so "play next" (which inserts at currentindex + 1) almost never equals
    // it — the old `index == nextindex` check therefore never fired, and the
    // audio preloaded for the shuffle target stayed while the row it belonged
    // to shifted down by one.
    it('keeps naming the same track after an insert in front of the shuffle target', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        queue.currentindex = 3
        settings.shuffle = true
        // Pin the target instead of rolling, so the test states the case it
        // is about rather than depending on which index the picker returns.
        queue.shuffleNextIndex = 7
        const targetBefore = tracklist.tracklist[queue.nextindex]

        tracklist.insertAt([track(99)], 4)

        // Same track, new index — and therefore nothing to invalidate.
        expect(queue.shuffleNextIndex).toBe(8)
        expect(tracklist.tracklist[queue.nextindex]).toBe(targetBefore)
        expect(clearNextAudio).not.toHaveBeenCalled()
    })

    // The boundary of that shift: an insert landing exactly ON the target
    // pushes it down too, because the new row takes its slot. `from <= target`
    // rather than `from < target` is what makes this case come out right.
    it('shifts the target when the insert lands exactly on it', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        queue.currentindex = 3
        settings.shuffle = true
        queue.shuffleNextIndex = 7
        const targetBefore = tracklist.tracklist[7]

        tracklist.insertAt([track(99)], 7)

        expect(queue.shuffleNextIndex).toBe(8)
        expect(tracklist.tracklist[8]).toBe(targetBefore)
        expect(clearNextAudio).not.toHaveBeenCalled()
    })

    // `shuffleRecent` is absolute too, and it feeds `previndex` plus the
    // avoid-list of the next roll. Left behind, Previous plays whatever slid
    // into the old slot.
    it('carries the shuffle history along, so Previous keeps its track', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        settings.shuffle = true
        queue.currentindex = 3
        // Newest entry last, and it is the current track — `previndex` reads
        // the one before it, so this history means "previous is row 7".
        queue.shuffleRecent = [2, 7, 3]
        expect(queue.previndex).toBe(7)
        const prevBefore = tracklist.tracklist[7]

        tracklist.insertAt([track(99)], 4)

        // Only 7 sits at or behind the insert; 2 and 3 are in front and stay
        // put — the same reason `currentindex` (3) needs no shift here.
        expect(queue.shuffleRecent).toEqual([2, 8, 3])
        expect(queue.previndex).toBe(8)
        expect(tracklist.tracklist[8]).toBe(prevBefore)
    })

    it('leaves the shuffle target alone when the insert lands behind it', () => {
        const queue = useQueue()
        const settings = useSettings()

        queue.currentindex = 3
        settings.shuffle = true
        queue.shuffleNextIndex = 5

        useTracklist().insertAt([track(99)], 9)

        expect(queue.shuffleNextIndex).toBe(5)
        expect(clearNextAudio).not.toHaveBeenCalled()
    })

    it('shifts the shuffle target by the NUMBER of inserted tracks', () => {
        const queue = useQueue()
        const settings = useSettings()

        queue.currentindex = 0
        settings.shuffle = true
        queue.shuffleNextIndex = 6

        useTracklist().insertAt([track(97), track(98), track(99)], 2)

        expect(queue.shuffleNextIndex).toBe(9)
    })

    it('does not invent a target when shuffle is off', () => {
        const queue = useQueue()
        queue.currentindex = 3
        expect(queue.shuffleNextIndex).toBeNull()

        useTracklist().insertAt([track(99)], 4)

        expect(queue.shuffleNextIndex).toBeNull()
    })
})

describe('"Play next" means next in both play orders', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        clearNextAudio.mockClear()
        dsState.joined = false
        dsState.intercept = vi.fn()
        useTracklist().tracklist = Array.from({ length: 10 }, (_, i) => track(i))
    })

    it('plays the inserted track next in sequential order', () => {
        const queue = useQueue()
        const tracklist = useTracklist()
        queue.currentindex = 3

        tracklist.insertAfterCurrent([track(99)])

        expect(tracklist.tracklist[queue.nextindex].trackhash).toBe('h99')
    })

    // Without `aimShuffleNext` the pre-rolled target simply shifts past the new
    // row and the insert is never heard — the feature would be a silent no-op
    // for anyone with shuffle on.
    it('plays the inserted track next under shuffle too', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        settings.shuffle = true
        queue.currentindex = 3
        queue.shuffleNextIndex = 7

        tracklist.insertAfterCurrent([track(99)])

        expect(queue.shuffleNextIndex).toBe(4)
        expect(tracklist.tracklist[queue.nextindex].trackhash).toBe('h99')
    })

    // Aiming has to happen INSIDE insertAt, before the preload check. Done
    // afterwards, `tracklist[nextindex]` still looked unchanged, so audio
    // already preloaded for the old target survived and played instead of the
    // row the user just queued.
    it('drops the preload it just invalidated by aiming', () => {
        const queue = useQueue()
        const settings = useSettings()

        settings.shuffle = true
        queue.currentindex = 3
        queue.shuffleNextIndex = 7

        useTracklist().insertAfterCurrent([track(99)])

        expect(clearNextAudio).toHaveBeenCalled()
    })

    it('does the same through queue.playTrackNext', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        settings.shuffle = true
        queue.currentindex = 3
        queue.shuffleNextIndex = 7

        queue.playTrackNext(track(99))

        expect(tracklist.tracklist[queue.nextindex].trackhash).toBe('h99')
        expect(clearNextAudio).toHaveBeenCalled()
    })

    // In a group session insertAt hands off to the server and returns before
    // splicing. Aiming from outside also fired here, moving this device's idea
    // of "next" out of step with the group.
    it('does not touch the target when the insert went to the group instead', () => {
        const queue = useQueue()
        const settings = useSettings()

        settings.shuffle = true
        queue.currentindex = 3
        queue.shuffleNextIndex = 7
        dsState.joined = true

        useTracklist().insertAfterCurrent([track(99)])

        expect(dsState.intercept).toHaveBeenCalled()
        expect(queue.shuffleNextIndex).toBe(7)
        expect(clearNextAudio).not.toHaveBeenCalled()
    })
})

describe('tracklist.shuffleList: the bookkeeping cannot survive a reshuffle', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        clearNextAudio.mockClear()
        dsState.joined = false
        useTracklist().tracklist = Array.from({ length: 10 }, (_, i) => track(i))
    })

    // `currentindex` is deliberately NOT 0 here. Rolling inside shuffleList
    // would push this pre-shuffle index straight back into the history it just
    // emptied, and `previndex` would then point into the reshuffled list at a
    // track that never played. A test that reshuffles from index 0 cannot see
    // that — the polluted entry looks exactly like a clean reset.
    it('clears the bookkeeping without putting the pre-shuffle index back', () => {
        const queue = useQueue()
        const settings = useSettings()

        settings.shuffle = true
        queue.currentindex = 4
        queue.shuffleRecent = [2, 5, 8]
        queue.shuffleNextIndex = 7

        useTracklist().shuffleList(4)

        expect(queue.shuffleRecent).toEqual([])
        expect(queue.shuffleNextIndex).toBeNull()
        expect(clearNextAudio).toHaveBeenCalled()
    })
})

describe('tracklist.removeByIndex: the shuffle bookkeeping follows', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        clearNextAudio.mockClear()
        useTracklist().tracklist = Array.from({ length: 10 }, (_, i) => track(i))
    })

    it('keeps the target on its track when a row in front of it goes', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        settings.shuffle = true
        queue.currentindex = 0
        queue.shuffleNextIndex = 7
        const targetBefore = tracklist.tracklist[7]

        tracklist.removeByIndex(2)

        expect(queue.shuffleNextIndex).toBe(6)
        expect(tracklist.tracklist[queue.nextindex]).toBe(targetBefore)
        expect(clearNextAudio).not.toHaveBeenCalled()
    })

    it('rolls again when the removed row WAS the target', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        settings.shuffle = true
        queue.currentindex = 0
        queue.shuffleRecent = []
        queue.shuffleNextIndex = 7

        tracklist.removeByIndex(7)

        // Asserting `!== 7` would be flaky: a fresh roll may legitimately land
        // on 7 again. What is deterministic is that a roll HAPPENED —
        // `rollShuffleNext` pushes the current index into the history — and
        // that the result is a valid row of the now shorter list rather than a
        // stale number.
        expect(queue.shuffleRecent).toEqual([0])
        expect(queue.shuffleNextIndex).not.toBeNull()
        expect(queue.shuffleNextIndex as number).toBeLessThan(tracklist.tracklist.length)
        expect(clearNextAudio).toHaveBeenCalled()
    })

    it('forgets the removed row in the history and shifts the rest', () => {
        const queue = useQueue()
        const settings = useSettings()

        settings.shuffle = true
        queue.currentindex = 0
        queue.shuffleRecent = [2, 5, 8]

        useTracklist().removeByIndex(5)

        expect(queue.shuffleRecent).toEqual([2, 7])
    })
})

describe('tracklist.moveTrack: the shuffle bookkeeping follows', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        clearNextAudio.mockClear()
        useTracklist().tracklist = Array.from({ length: 10 }, (_, i) => track(i))
    })

    it('carries the target along when the dragged row passes over it', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        settings.shuffle = true
        queue.currentindex = 0
        queue.shuffleNextIndex = 5
        const targetBefore = tracklist.tracklist[5]

        // Drag row 2 down into the gap at 8 -> it lands at 7, passing over 5.
        tracklist.moveTrack(2, 8)

        expect(queue.shuffleNextIndex).toBe(4)
        expect(tracklist.tracklist[queue.nextindex]).toBe(targetBefore)
    })

    it('travels with the dragged row when that row IS the target', () => {
        const queue = useQueue()
        const settings = useSettings()
        const tracklist = useTracklist()

        settings.shuffle = true
        queue.currentindex = 0
        queue.shuffleNextIndex = 3
        const targetBefore = tracklist.tracklist[3]

        tracklist.moveTrack(3, 8)

        expect(tracklist.tracklist[queue.nextindex]).toBe(targetBefore)
    })
})
