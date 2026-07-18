import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// A controllable device-sync stand-in: flip joined/applying per test and assert
// that the queue seams route to intercept() (or fall through to local bodies).
const { dsMock } = vi.hoisted(() => ({
    dsMock: { joined: false, applying: false, intercept: vi.fn() },
}))
vi.mock('@/stores/devicesync', () => ({ default: () => dsMock }))

// player.ts builds real <audio> elements at import — stub it.
vi.mock('@/stores/player', () => ({
    usePlayer: () => ({ playCurrent() {}, clearNextAudio() {}, clearMovingNextTimeout() {} }),
    audioSource: { playingSource: { src: '', paused: true, currentTime: 0 } },
    getUrl: () => '',
}))
vi.mock('@/stores/interface', () => ({ default: () => ({ focusCurrentInSidebar() {} }) }))
vi.mock('@/stores/pages/playlists', () => ({ default: () => ({ movePlayedToTop: vi.fn() }) }))

import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'

const mkTrack = (hash: string): any => ({ trackhash: hash, filepath: `/music/${hash}.mp3`, title: hash, duration: 1 })

describe('queue group-mode seams', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        dsMock.joined = false
        dsMock.applying = false
        dsMock.intercept.mockReset()
    })

    it('joined + not applying: play intercepts and does not mutate queue state', () => {
        const q = useQueue()
        useTracklist().tracklist = [mkTrack('a'), mkTrack('b'), mkTrack('c')]
        dsMock.joined = true

        q.play(2)

        expect(dsMock.intercept).toHaveBeenCalledWith('play', 2)
        expect(q.currentindex).toBe(0)
        expect(q.playing).toBe(false)
    })

    it('joined + not applying: seek/playPause/playNext route to intercept without local mutation', () => {
        const q = useQueue()
        useTracklist().tracklist = [mkTrack('a'), mkTrack('b')]
        dsMock.joined = true

        q.seek(42)
        q.playPause()
        q.playNext()

        expect(dsMock.intercept).toHaveBeenCalledWith('seek', 42)
        expect(dsMock.intercept).toHaveBeenCalledWith('playPause')
        expect(dsMock.intercept).toHaveBeenCalledWith('playNext')
        expect(q.currentindex).toBe(0)
        expect(q.duration.current).toBe(0)
    })

    it('applying=true: actions run their normal local bodies', () => {
        const q = useQueue()
        useTracklist().tracklist = [mkTrack('a'), mkTrack('b'), mkTrack('c')]
        dsMock.joined = true
        dsMock.applying = true

        q.play(2)

        expect(dsMock.intercept).not.toHaveBeenCalled()
        expect(q.currentindex).toBe(2)
        expect(q.playing).toBe(true)
    })

    it('autoPlayNext no-ops when joined', () => {
        const q = useQueue()
        useTracklist().tracklist = [mkTrack('a'), mkTrack('b')]
        dsMock.joined = true
        q.currentindex = 0

        q.autoPlayNext()

        expect(q.currentindex).toBe(0)
    })

    it('solo (not joined): play mutates locally and never intercepts', () => {
        const q = useQueue()
        useTracklist().tracklist = [mkTrack('a'), mkTrack('b'), mkTrack('c')]
        dsMock.joined = false

        q.play(1)

        expect(dsMock.intercept).not.toHaveBeenCalled()
        expect(q.currentindex).toBe(1)
        expect(q.playing).toBe(true)
    })
})
