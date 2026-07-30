import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The device-sync store keeps its clock estimator, dedupe set and timers as
// module-level singletons. Tests reset the module registry per case so those
// start fresh; the mocks below are captured once (hoisted) and survive resets.
const { playerMock, audioSourceMock, requestsMock } = vi.hoisted(() => ({
    playerMock: {
        setPlaybackRate: vi.fn(),
        getCurrentTimeMs: vi.fn(() => 0),
        hardSeekMs: vi.fn(),
        playCurrent: vi.fn(),
        setMute: vi.fn(),
        setVolume: vi.fn(),
        clearNextAudio: vi.fn(),
        clearMovingNextTimeout: vi.fn(),
    },
    audioSourceMock: {
        playPlayingSource: vi.fn(() => Promise.resolve()),
        pausePlayingSource: vi.fn(),
    },
    requestsMock: {
        registerDevice: vi.fn(() => Promise.resolve({ status: 200, data: {} })),
        pollSession: vi.fn(),
        joinGroup: vi.fn(() => Promise.resolve({ status: 200, data: {} })),
        leaveGroup: vi.fn(() => Promise.resolve({ status: 200, data: {} })),
        setQueue: vi.fn(() => Promise.resolve({ status: 200, data: {} })),
        sendCommand: vi.fn(() => Promise.resolve({ status: 200, data: {} })),
        resolveTracks: vi.fn(() => Promise.resolve([] as any[])),
    },
}))

// player.ts builds real <audio> elements at import — stub it to the imperatives
// the store actually drives.
vi.mock('@/stores/player', () => ({
    usePlayer: () => playerMock,
    audioSource: audioSourceMock,
    getUrl: () => '',
}))
vi.mock('@/requests/devicesync', () => requestsMock)
// setNewList / setFromPlaylist touch these — keep them light in jsdom.
vi.mock('@/stores/interface', () => ({ default: () => ({ focusCurrentInSidebar() {} }) }))
vi.mock('@/stores/pages/playlists', () => ({ default: () => ({ movePlayedToTop: vi.fn() }) }))

// Realistic backend shape: image strings carry a `?pathhash=` suffix (repo
// fixture rule — a sanitized `hash.webp` has hidden real bugs before).
const mkTrack = (hash: string): any => ({
    trackhash: hash,
    filepath: `/music/${hash}.mp3`,
    title: hash,
    duration: 100,
    image: `${hash}.webp?pathhash=${hash}ph`,
})

const mkState = (over: Partial<any> = {}): any => ({
    queue_id: 'q1',
    trackhashes: ['h1', 'h2'],
    from: {},
    currentindex: 0,
    repeat: 'all',
    playing: false,
    anchor: { position_ms: 0, at_server_ms: 1000 },
    ...over,
})

const mkPoll = (over: Partial<any> = {}): any => ({
    server_now_ms: 1000,
    version: 1,
    joined: false,
    scrobble_leader: null,
    commands: [],
    devices: [],
    ...over,
})

async function setup() {
    const useDeviceSync = (await import('@/stores/devicesync')).default
    const useTracklist = (await import('@/stores/queue/tracklist')).default
    const useQueue = (await import('@/stores/queue')).default
    const useSettings = (await import('@/stores/settings')).default
    return { useDeviceSync, useTracklist, useQueue, useSettings }
}

describe('devicesync store', () => {
    beforeEach(async () => {
        // NO vi.resetModules(): in vitest 0.34 it can hand the re-imported
        // store a different pinia module copy that still resolves to the
        // PREVIOUS test's store state, and module instances end up shared
        // between tests anyway. Instead the store exposes an explicit
        // test-state reset for its module singletons (timers, estimator,
        // command dedupe, leave-suppress window).
        vi.clearAllMocks()
        requestsMock.pollSession.mockReset()
        requestsMock.resolveTracks.mockReset()
        requestsMock.resolveTracks.mockResolvedValue([])
        playerMock.getCurrentTimeMs.mockReset()
        playerMock.getCurrentTimeMs.mockReturnValue(0)
        const { __resetDeviceSyncTestState } = await import('@/stores/devicesync')
        __resetDeviceSyncTestState()
        setActivePinia(createPinia())
        localStorage.clear()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('register captures a stable identity and marks registered', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')

        const ds = useDeviceSync()
        await ds.register()

        expect(ds.deviceId).toBe('devA')
        expect(ds.registered).toBe(true)
        expect(requestsMock.registerDevice).toHaveBeenCalledWith('devA', expect.any(String), expect.any(String))
    })

    it('poll applies state and resolves tracks only when the queue identity changes', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        requestsMock.resolveTracks.mockResolvedValue([mkTrack('h1'), mkTrack('h2')])
        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({ version: 1, joined: true, state: mkState({ currentindex: 0 }) })
        )
        await ds.poll()

        expect(requestsMock.resolveTracks).toHaveBeenCalledTimes(1)
        expect(useTracklist().tracklist.map((t: any) => t.trackhash)).toEqual(['h1', 'h2'])
        expect(useQueue().currentindex).toBe(0)

        // Same queue_id + hashes, new index → mirror the index, no re-resolve.
        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({ version: 2, joined: true, state: mkState({ currentindex: 1 }) })
        )
        await ds.poll()

        expect(requestsMock.resolveTracks).toHaveBeenCalledTimes(1)
        expect(useQueue().currentindex).toBe(1)
    })

    it('mirrors repeat from state without re-broadcasting it', async () => {
        const { useDeviceSync, useSettings } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        requestsMock.resolveTracks.mockResolvedValue([mkTrack('h1'), mkTrack('h2')])
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ joined: true, state: mkState({ repeat: 'one' }) }))
        await ds.poll()

        expect(useSettings().repeat).toBe('one')
        expect(requestsMock.sendCommand).not.toHaveBeenCalled()
    })

    it('executes a re-delivered command only once (dedupe by id)', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        const cmd = { id: 'c1', type: 'seek', payload: { position_ms: 5000 }, execute_at_ms: 0, target_device: null }
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 1, joined: true, commands: [cmd] }))
        await ds.poll()
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 2, joined: true, commands: [cmd] }))
        await ds.poll()

        expect(playerMock.hardSeekMs).toHaveBeenCalledTimes(1)
    })

    it('schedules a future command at the offset-adjusted local time', async () => {
        vi.useFakeTimers()
        vi.setSystemTime(100000)
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        // server ahead by 1000 ms (server_now 101000 at local 100000)
        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({
                server_now_ms: 101000,
                joined: true,
                commands: [
                    { id: 'c1', type: 'seek', payload: { position_ms: 3000 }, execute_at_ms: 102500, target_device: null },
                ],
            })
        )
        await ds.poll()

        // localExec = 102500 - offset(1000) = 101500 → delay 1500 ms from local now
        expect(playerMock.hardSeekMs).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1499)
        expect(playerMock.hardSeekMs).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(playerMock.hardSeekMs).toHaveBeenCalledTimes(1)
    })

    it('executes a missed (past) command immediately with catch-up position', async () => {
        vi.useFakeTimers()
        vi.setSystemTime(100000)
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        // offset 0 (server_now == local). Command was due 1000 ms ago.
        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({
                server_now_ms: 100000,
                joined: true,
                commands: [
                    { id: 'c9', type: 'play', payload: { position_ms: 5000 }, execute_at_ms: 99000, target_device: null },
                ],
            })
        )
        await ds.poll()

        // play implies playing → catch-up 1000 ms added to the position
        expect(playerMock.hardSeekMs).toHaveBeenCalledWith(6000)
    })

    it('applies a targeted set_volume only when addressed to this device', async () => {
        const { useDeviceSync, useSettings } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        const settings = useSettings()

        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({
                joined: true,
                commands: [
                    { id: 'v1', type: 'set_volume', payload: { volume: 0.3 }, execute_at_ms: 0, target_device: 'devA' },
                ],
            })
        )
        await ds.poll()
        expect(settings.volume).toBe(0.3)

        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({
                version: 2,
                joined: true,
                commands: [
                    { id: 'v2', type: 'set_volume', payload: { volume: 0.9 }, execute_at_ms: 0, target_device: 'devB' },
                ],
            })
        )
        await ds.poll()
        expect(settings.volume).toBe(0.3)
    })

    it('leaves the group and stops audio on a play_here targeted at this device', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true
        ds.status = 'joined'

        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({
                joined: true,
                commands: [{ id: 'ph', type: 'play_here', payload: {}, execute_at_ms: 0, target_device: 'devA' }],
            })
        )
        await ds.poll()

        expect(requestsMock.leaveGroup).toHaveBeenCalledWith('devA')
        expect(audioSourceMock.pausePlayingSource).toHaveBeenCalled()
        expect(ds.joined).toBe(false)
    })

    it('intercept(play) sends track_change when the queue matches the mirror, queue-set when it differs', async () => {
        const { useDeviceSync, useTracklist } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        const tl = useTracklist()
        tl.tracklist = [mkTrack('h1'), mkTrack('h2')]
        ds.lastMirroredHashKey = 'h1\nh2'

        ds.intercept('play', 1)
        expect(requestsMock.sendCommand).toHaveBeenCalledWith(
            expect.objectContaining({
                device_id: 'devA',
                type: 'track_change',
                payload: { index: 1, position_ms: 0, playing: true },
            })
        )
        expect(requestsMock.setQueue).not.toHaveBeenCalled()

        // Navigate locally to a new context → the hash key diverges from the mirror.
        tl.tracklist = [mkTrack('h3')]
        ds.intercept('play', 0)
        expect(requestsMock.setQueue).toHaveBeenCalledWith(
            expect.objectContaining({ device_id: 'devA', trackhashes: ['h3'], currentindex: 0 })
        )
    })

    it('onTrackEnded: leader advances (all wraps / none pauses at last), non-leader is silent', async () => {
        const { useDeviceSync, useTracklist, useQueue, useSettings } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true
        ds.scrobbleLeader = 'devA'

        useTracklist().tracklist = [mkTrack('h1'), mkTrack('h2')]
        useQueue().currentindex = 1
        const settings = useSettings()

        settings.repeat = 'all'
        ds.onTrackEnded()
        expect(requestsMock.sendCommand).toHaveBeenLastCalledWith(
            expect.objectContaining({ type: 'track_change', payload: { index: 0, position_ms: 0, playing: true } })
        )

        settings.repeat = 'none'
        ds.onTrackEnded()
        expect(requestsMock.sendCommand).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'pause' }))

        requestsMock.sendCommand.mockClear()
        ds.scrobbleLeader = 'devB'
        ds.onTrackEnded()
        expect(requestsMock.sendCommand).not.toHaveBeenCalled()
    })

    it('poll failures escalate to reconnecting then dissolve to solo (joined=false)', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true
        ds.status = 'joined'

        requestsMock.pollSession.mockResolvedValue(null)

        for (let i = 0; i < 3; i++) await ds.poll()
        expect(ds.status).toBe('reconnecting')
        expect(ds.joined).toBe(true)

        for (let i = 0; i < 12; i++) await ds.poll()
        expect(ds.joined).toBe(false)
    })

    // --- auto-rejoin ---------------------------------------------------------
    // A device that dropped out involuntarily (reaped, network gap, server
    // restart) walks back into a STILL-RUNNING group by itself.

    const peer = (over: Partial<any> = {}): any => ({
        device_id: 'devB',
        name: 'Chrome on Android',
        type: 'mobile',
        online: true,
        joined: true,
        volume: 1,
        mute: false,
        is_leader: true,
        ...over,
    })

    it('remembers membership across reloads and forgets it on a deliberate leave', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        await ds.join()
        expect(localStorage.getItem('aivinnet.group_member')).toBe('1')

        await ds.leave()
        expect(localStorage.getItem('aivinnet.group_member')).toBeNull()
    })

    it('rejoins a still-running group after an involuntary drop-out', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        localStorage.setItem('aivinnet.group_member', '1')
        const ds = useDeviceSync()
        await ds.register()

        // Server says: you are not a member, but devB is → group is alive.
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ joined: false, devices: [peer()] }))
        await ds.poll()
        await Promise.resolve()

        expect(requestsMock.joinGroup).toHaveBeenCalledWith('devA')
    })

    it('never CREATES a group on its own (no running group → no rejoin)', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        localStorage.setItem('aivinnet.group_member', '1')
        const ds = useDeviceSync()
        await ds.register()

        // Marker set, but nobody is in a group — opening the app must not
        // start group playback nobody asked for.
        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({ joined: false, devices: [peer({ joined: false })] })
        )
        await ds.poll()
        await Promise.resolve()

        expect(requestsMock.joinGroup).not.toHaveBeenCalled()
    })

    it('does not rejoin without the membership marker', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ joined: false, devices: [peer()] }))
        await ds.poll()
        await Promise.resolve()

        expect(requestsMock.joinGroup).not.toHaveBeenCalled()
    })

    it('does not rejoin right after the user left (marker cleared + suppress window)', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        await ds.join()
        await ds.leave()
        requestsMock.joinGroup.mockClear()

        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ joined: false, devices: [peer()] }))
        await ds.poll()
        await Promise.resolve()

        expect(requestsMock.joinGroup).not.toHaveBeenCalled()
    })

    it('backs off between rejoin attempts so a failing one cannot loop', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        localStorage.setItem('aivinnet.group_member', '1')
        const ds = useDeviceSync()
        await ds.register()

        requestsMock.pollSession.mockResolvedValue(mkPoll({ joined: false, devices: [peer()] }))
        await ds.poll()
        await Promise.resolve()
        expect(requestsMock.joinGroup).toHaveBeenCalledTimes(1)

        // The rejoin did not stick (server still reports us outside) — the next
        // polls must not hammer /join.
        ds.joined = false
        await ds.poll()
        await ds.poll()
        await Promise.resolve()
        expect(requestsMock.joinGroup).toHaveBeenCalledTimes(1)
    })

    it('a solo (non-joined) device never mirrors group state onto its local queue', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        // Server sends `state` to every device of the user — joined:false here.
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 3, joined: false, state: mkState() }))
        await ds.poll()

        expect(requestsMock.resolveTracks).not.toHaveBeenCalled()
        expect(useTracklist().tracklist).toEqual([])
        expect(useQueue().currentindex).toBe(0)
        expect(ds.joined).toBe(false)
    })

    it('cancels pending scheduled commands on leave — no hijack of solo playback', async () => {
        vi.useFakeTimers()
        vi.setSystemTime(100000)
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({
                server_now_ms: 100000,
                joined: true,
                commands: [
                    { id: 'c1', type: 'seek', payload: { position_ms: 3000 }, execute_at_ms: 102000, target_device: null },
                ],
            })
        )
        await ds.poll()
        expect(ds.joined).toBe(true)

        await ds.leave()
        vi.advanceTimersByTime(5000)

        expect(playerMock.hardSeekMs).not.toHaveBeenCalled()
    })

    it('clamps a stale track_change index into the current queue bounds', async () => {
        const { useDeviceSync, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        requestsMock.resolveTracks.mockResolvedValue([mkTrack('h1'), mkTrack('h2')])
        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({
                joined: true,
                state: mkState(),
                commands: [
                    { id: 'tc', type: 'track_change', payload: { index: 99 }, execute_at_ms: 0, target_device: null },
                ],
            })
        )
        await ds.poll()

        expect(useQueue().currentindex).toBe(1)
    })

    it('the applying guard never spans the resolve await — user actions still intercept', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        let release: (tracks: any[]) => void = () => {}
        requestsMock.resolveTracks.mockReturnValueOnce(new Promise(resolve => (release = resolve)))

        const pending = ds.applyState(mkState())
        // Let applyState reach (and suspend at) the resolve await.
        await Promise.resolve()
        expect(ds.applying).toBe(false)

        release([mkTrack('h1'), mkTrack('h2')])
        await pending
        expect(ds.applying).toBe(false)
        expect(ds.queueId).toBe('q1')
    })

    it('keeps known_version stale when the track resolve fails, so the server re-sends state', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        requestsMock.resolveTracks.mockResolvedValueOnce([])
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 5, joined: true, state: mkState() }))
        await ds.poll()
        expect(ds.sessionVersion).toBe(0)

        requestsMock.resolveTracks.mockResolvedValueOnce([mkTrack('h1'), mkTrack('h2')])
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 5, joined: true, state: mkState() }))
        await ds.poll()
        expect(ds.sessionVersion).toBe(5)
    })

    it('intercept(playPrev) restarts the current track past 3 s, jumps back before it', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        useTracklist().tracklist = [mkTrack('h1'), mkTrack('h2')]
        useQueue().currentindex = 1

        playerMock.getCurrentTimeMs.mockReturnValue(10000)
        ds.intercept('playPrev')
        expect(requestsMock.sendCommand).toHaveBeenLastCalledWith(
            expect.objectContaining({ type: 'seek', payload: { position_ms: 0 } })
        )
        expect(useQueue().duration.current).toBe(0)

        playerMock.getCurrentTimeMs.mockReturnValue(1000)
        ds.intercept('playPrev')
        expect(requestsMock.sendCommand).toHaveBeenLastCalledWith(
            expect.objectContaining({ type: 'track_change', payload: { index: 0, position_ms: 0, playing: true } })
        )
    })

    it('intercept(seek) optimistically moves the progress thumb', async () => {
        const { useDeviceSync, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        ds.intercept('seek', 42)
        expect(useQueue().duration.current).toBe(42)
        expect(requestsMock.sendCommand).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'seek', payload: { position_ms: 42000 } })
        )
    })

    it('does not re-adopt membership right after a voluntary leave (server lag race)', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        // Server considers us a member (page-reload semantics) → adopt.
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ joined: true }))
        await ds.poll()
        expect(ds.joined).toBe(true)

        await ds.leave()
        expect(ds.joined).toBe(false)

        // The server has not processed the leave yet — this stale poll must
        // NOT bounce the device back into the group.
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ joined: true }))
        await ds.poll()
        expect(ds.joined).toBe(false)
    })

    it('re-adopting a membership forces a full queue re-mirror (local list may have diverged)', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        requestsMock.resolveTracks.mockResolvedValue([mkTrack('h1'), mkTrack('h2')])
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 1, joined: true, state: mkState() }))
        await ds.poll()
        expect(requestsMock.resolveTracks).toHaveBeenCalledTimes(1)

        // Outage → solo; same server session survives with the same queue_id.
        ds.toSolo()

        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 1, joined: true, state: mkState() }))
        await ds.poll()

        // Same queue_id, but the re-adopt reset the mirror → re-resolve.
        expect(requestsMock.resolveTracks).toHaveBeenCalledTimes(2)
        expect(ds.joined).toBe(true)
    })

    it('sends WHOLE-millisecond positions (a fractional one is rejected with 422)', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        useTracklist().tracklist = [mkTrack('h1'), mkTrack('h2')]
        useQueue().currentindex = 0
        // Real players report fractional seconds → *1000 keeps the fraction.
        playerMock.getCurrentTimeMs.mockReturnValue(3213.456)

        await ds.sendQueueSet()

        expect(requestsMock.setQueue).toHaveBeenCalledWith(expect.objectContaining({ position_ms: 3213 }))

        // ...and the seek command path too.
        ds.intercept('seek', 12.3456)
        expect(requestsMock.sendCommand).toHaveBeenLastCalledWith(
            expect.objectContaining({ type: 'seek', payload: { position_ms: 12346 } })
        )
    })

    it('surfaces a rejected sync call instead of swallowing it', async () => {
        const { useDeviceSync, useTracklist } = await setup()
        const { useToast } = await import('@/stores/notification')
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true
        useTracklist().tracklist = [mkTrack('h1')]

        requestsMock.setQueue.mockResolvedValueOnce({ status: 422, data: {} })
        const toast = useToast()
        const spy = vi.spyOn(toast, 'showNotification')

        await ds.sendQueueSet()

        expect(spy).toHaveBeenCalled()
    })

    it('play seeds the group queue when the session never received one', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        useTracklist().tracklist = [mkTrack('h1'), mkTrack('h2')]
        useQueue().playing = false
        ds.lastMirroredHashKey = '' // nothing mirrored → server queue is empty

        ds.intercept('playPause')

        expect(requestsMock.setQueue).toHaveBeenCalledWith(
            expect.objectContaining({ trackhashes: ['h1', 'h2'], playing: true })
        )
        expect(requestsMock.sendCommand).not.toHaveBeenCalled()
    })

    it('applies this device audio offset when steering (Bluetooth latency trim)', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        useTracklist().tracklist = [mkTrack('h1')]
        useQueue().currentindex = 0
        useQueue().playing = true
        ds.joined = true
        ds.playing = true
        // Anchor says position 10_000 ms; a +300 ms trim means this device must
        // run 300 ms AHEAD to compensate a delayed output path.
        ds.anchor = { position_ms: 10_000, at_server_ms: 1000 }
        ds.setAudioOffset(300)
        expect(ds.audioOffsetMs).toBe(300)

        // Sitting exactly on the un-trimmed position is now 300 ms too late →
        // steering must pull forward (rate > 1) or seek, never report 'none'.
        playerMock.getCurrentTimeMs.mockReturnValue(10_000)
        playerMock.setPlaybackRate.mockClear()
        playerMock.hardSeekMs.mockClear()
        ds.steerTick()

        const rateCalls = playerMock.setPlaybackRate.mock.calls.map(c => c[0])
        const corrected = rateCalls.some(r => r > 1) || playerMock.hardSeekMs.mock.calls.length > 0
        expect(corrected).toBe(true)
    })

    it('persists the audio offset across store instances', async () => {
        const { useDeviceSync } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        useDeviceSync().setAudioOffset(-120)

        const { loadAudioOffset } = await import('@/utils/deviceSync/audioOffset')
        expect(loadAudioOffset()).toBe(-120)
    })

    it('intercept(insertTracks) broadcasts the would-be queue instead of mutating locally', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        const tl = useTracklist()
        tl.tracklist = [mkTrack('h1'), mkTrack('h2')]
        useQueue().currentindex = 0

        // "Play next" funnels through tracklist.insertAt → the group seam.
        tl.insertAt([mkTrack('h9')], 1)

        expect(tl.tracklist.map((t: any) => t.trackhash)).toEqual(['h1', 'h2'])
        expect(requestsMock.setQueue).toHaveBeenCalledWith(
            expect.objectContaining({ trackhashes: ['h1', 'h9', 'h2'], currentindex: 0 })
        )
    })

    it('intercept(removeTracks) broadcasts the would-be queue and shifts the index up', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        const tl = useTracklist()
        tl.tracklist = [mkTrack('h1'), mkTrack('h2'), mkTrack('h3')]
        useQueue().currentindex = 2
        useQueue().playing = true
        playerMock.getCurrentTimeMs.mockReturnValue(41000)

        // "Remove from queue" funnels through tracklist.removeByIndex.
        tl.removeByIndex(0)

        // Local list untouched — the server's echo is what changes it.
        expect(tl.tracklist.map((t: any) => t.trackhash)).toEqual(['h1', 'h2', 'h3'])
        expect(useQueue().currentindex).toBe(2)
        // Removed BELOW the current track → the current one is now index 1, and
        // playback continues from where it is.
        expect(requestsMock.setQueue).toHaveBeenCalledWith(
            expect.objectContaining({
                trackhashes: ['h2', 'h3'],
                currentindex: 1,
                playing: true,
                position_ms: 41000,
            })
        )
    })

    it('removing the CURRENT track keeps the index (next slides in) and restarts at 0', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        const tl = useTracklist()
        tl.tracklist = [mkTrack('h1'), mkTrack('h2'), mkTrack('h3')]
        useQueue().currentindex = 1
        playerMock.getCurrentTimeMs.mockReturnValue(41000)

        tl.removeByIndex(1)

        expect(requestsMock.setQueue).toHaveBeenCalledWith(
            expect.objectContaining({ trackhashes: ['h1', 'h3'], currentindex: 1, position_ms: 0 })
        )

        // ...and removing the LAST track clamps into the shortened queue.
        requestsMock.setQueue.mockClear()
        useQueue().currentindex = 2
        tl.removeByIndex(2)

        expect(requestsMock.setQueue).toHaveBeenCalledWith(
            expect.objectContaining({ trackhashes: ['h1', 'h2'], currentindex: 1, position_ms: 0 })
        )
    })

    it('an out-of-range remove is ignored instead of broadcasting a bogus queue', async () => {
        const { useDeviceSync, useTracklist } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        useTracklist().tracklist = [mkTrack('h1'), mkTrack('h2')]
        ds.intercept('removeTracks', 7)

        expect(requestsMock.setQueue).not.toHaveBeenCalled()
    })

    it('intercept(clearQueue) empties the GROUP queue instead of only the local list', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true

        const tl = useTracklist()
        tl.tracklist = [mkTrack('h1'), mkTrack('h2')]
        const queue = useQueue()
        queue.currentindex = 1

        queue.clearQueue()

        expect(tl.tracklist.map((t: any) => t.trackhash)).toEqual(['h1', 'h2'])
        expect(requestsMock.setQueue).toHaveBeenCalledWith(
            expect.objectContaining({ trackhashes: [], currentindex: 0, playing: false, position_ms: 0 })
        )
    })

    it('mirroring an EMPTY group queue stops audio instead of letting the steerer hammer it to 0', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()

        // Playing along in a group...
        requestsMock.resolveTracks.mockResolvedValueOnce([mkTrack('h1'), mkTrack('h2')])
        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({ version: 1, joined: true, state: mkState({ playing: true }) })
        )
        await ds.poll()
        useQueue().playing = true

        // ...another device clears the queue: no track to reconcile onto, and
        // the anchor sits at 0 while this element is 41 s into the old track.
        requestsMock.resolveTracks.mockResolvedValueOnce([])
        requestsMock.pollSession.mockResolvedValueOnce(
            mkPoll({
                version: 2,
                joined: true,
                state: mkState({ queue_id: 'q-empty', trackhashes: [], playing: false }),
            })
        )
        playerMock.getCurrentTimeMs.mockReturnValue(41000)
        audioSourceMock.pausePlayingSource.mockClear()

        await ds.poll()

        expect(useTracklist().tracklist).toEqual([])
        // Stopped — which is also what defuses the steer loop: it may pull the
        // element onto the zero anchor once, but a PAUSED element stays there
        // instead of playing on and being yanked back every 250 ms.
        expect(audioSourceMock.pausePlayingSource).toHaveBeenCalled()
        expect(useQueue().playing).toBe(false)
    })

    it('the leader does not fire a track_change into an emptied queue (400 → error toast)', async () => {
        const { useDeviceSync, useTracklist, useSettings } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = true
        ds.scrobbleLeader = 'devA'

        useTracklist().tracklist = []
        useSettings().repeat = 'all'

        ds.onTrackEnded()

        expect(requestsMock.sendCommand).not.toHaveBeenCalled()
    })

    it('solo (not joined) keeps the local queue mutations local', async () => {
        const { useDeviceSync, useTracklist, useQueue } = await setup()
        localStorage.setItem('aivinnet.device_id', 'devA')
        const ds = useDeviceSync()
        await ds.register()
        ds.joined = false

        const tl = useTracklist()
        tl.tracklist = [mkTrack('h1'), mkTrack('h2'), mkTrack('h3')]
        useQueue().currentindex = 0

        tl.removeByIndex(2)
        expect(tl.tracklist.map((t: any) => t.trackhash)).toEqual(['h1', 'h2'])

        useQueue().clearQueue()
        expect(tl.tracklist).toEqual([])
        expect(requestsMock.setQueue).not.toHaveBeenCalled()
    })
})
