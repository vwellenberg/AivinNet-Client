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
        resolveTracks: vi.fn(() => Promise.resolve([])),
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

const mkTrack = (hash: string): any => ({
    trackhash: hash,
    filepath: `/music/${hash}.mp3`,
    title: hash,
    duration: 100,
    image: '',
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
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        requestsMock.pollSession.mockReset()
        requestsMock.resolveTracks.mockReset()
        requestsMock.resolveTracks.mockResolvedValue([])
        playerMock.getCurrentTimeMs.mockReset()
        playerMock.getCurrentTimeMs.mockReturnValue(0)
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
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 1, state: mkState({ currentindex: 0 }) }))
        await ds.poll()

        expect(requestsMock.resolveTracks).toHaveBeenCalledTimes(1)
        expect(useTracklist().tracklist.map((t: any) => t.trackhash)).toEqual(['h1', 'h2'])
        expect(useQueue().currentindex).toBe(0)

        // Same queue_id + hashes, new index → mirror the index, no re-resolve.
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ version: 2, state: mkState({ currentindex: 1 }) }))
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
        requestsMock.pollSession.mockResolvedValueOnce(mkPoll({ state: mkState({ repeat: 'one' }) }))
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
})
