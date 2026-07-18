// Multiroom device-sync store (client side of the "group session" feature).
//
// Server is the source of truth. This store short-polls the session, feeds a
// Cristian clock-offset estimator, mirrors the authoritative queue/transport
// state under a re-entrancy guard (`applying`), executes server-scheduled
// commands at the right local time (with catch-up for missed ones), and steers
// audio drift with a 250 ms playbackRate/seek loop while playing.
//
// C2 scope: the store + the store-side seams only. Nothing wires it into the
// UI/App yet, so solo behavior is unchanged (nothing calls the new store).
//
// Module-level singletons live OUTSIDE the reactive state (same pattern as
// player.ts's `audioSource`): timers, the estimator and the executed-command
// dedupe set must not be proxied by Vue reactivity.

import { defineStore } from 'pinia'

import { computeCorrection } from '@/utils/deviceSync/driftSteer'
import { ClockOffsetEstimator } from '@/utils/deviceSync/clockSync'
import { detectDeviceName, detectDeviceType, getOrCreateDeviceId } from '@/utils/deviceSync/deviceId'
import { expectedPositionMs } from '@/utils/deviceSync/expectedPosition'
import type {
    DeviceSummary,
    PollResponse,
    SyncAnchor,
    SyncCommand,
    SyncCommandType,
    SyncFrom,
    SyncState,
} from '@/utils/deviceSync/types'

import {
    joinGroup,
    leaveGroup,
    pollSession,
    registerDevice,
    resolveTracks,
    sendCommand,
    setQueue,
} from '@/requests/devicesync'

import { audioSource, usePlayer } from '@/stores/player'
import useQueue from '@/stores/queue'
import type { From } from '@/stores/queue/tracklist'
import useTracklist from '@/stores/queue/tracklist'
import useSettings from '@/stores/settings'

type RepeatMode = 'all' | 'one' | 'none'

/** Poll cadence: fast while in a group, relaxed while solo. */
const CADENCE_JOINED_MS = 1000
const CADENCE_SOLO_MS = 5000
/** Steering tick while playing in a group. */
const STEER_MS = 250
/** Consecutive poll failures before we surface "reconnecting". */
const RECONNECT_AFTER = 3
/** Consecutive poll failures (≈15 s at 1 s cadence) before we dissolve to solo. */
const FAILURES_TO_SOLO = 15
/** Cap on the executed-command dedupe set (FIFO-trimmed). */
const MAX_EXECUTED_IDS = 500
/** A scheduled command this close to firing suppresses drift steering. */
const STEER_SUPPRESS_MS = 1000

// --- non-reactive module singletons -----------------------------------------

const estimator = new ClockOffsetEstimator()
const executedCommandIds = new Set<string>()

let pollTimer: any = null
let pollingActive = false
let steerTimer: any = null
let visibilityHandler: (() => void) | null = null

interface Scheduled {
    handle: any
    at: number
}
let scheduled: Scheduled[] = []

// The trackhash currently loaded into the audio element and the last applied
// playbackRate — both tracked here (not in reactive state) so reconciliation
// and steering can compare cheaply without reading the media element.
let loadedTrackhash = ''
let appliedRate = 1

function rememberCommandId(id: string) {
    executedCommandIds.add(id)
    if (executedCommandIds.size <= MAX_EXECUTED_IDS) return

    // FIFO trim: a Set preserves insertion order, so the oldest ids come first.
    const excess = executedCommandIds.size - MAX_EXECUTED_IDS
    let removed = 0
    for (const key of executedCommandIds) {
        executedCommandIds.delete(key)
        if (++removed >= excess) break
    }
}

function scheduledCommandNear(nowMs: number): boolean {
    return scheduled.some(s => Math.abs(s.at - nowMs) <= STEER_SUPPRESS_MS)
}

/** Whether a command's effect is a moving (playing) position — drives catch-up. */
function impliesPlaying(cmd: SyncCommand, playing: boolean): boolean {
    const p = (cmd.payload ?? {}) as any
    switch (cmd.type) {
        case 'play':
            return true
        case 'track_change':
            return p.playing !== false
        case 'seek':
            return playing
        default:
            return false
    }
}

function shuffleInPlace<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

export default defineStore('devicesync', {
    state: () => ({
        deviceId: '',
        deviceName: '',
        deviceType: '',
        registered: false,
        joined: false,
        /** Re-entrancy guard: true while mirroring server state, so seams don't echo. */
        applying: false,
        sessionVersion: 0,
        queueId: '',
        /** trackhashes joined with '\n' — a cheap queue-identity key (no sha1). */
        lastMirroredHashKey: '',
        devices: [] as DeviceSummary[],
        scrobbleLeader: null as string | null,
        anchor: null as SyncAnchor | null,
        /** Server truth for whether the session is playing. */
        playing: false,
        status: 'solo' as 'solo' | 'joined' | 'reconnecting',
        /** Autoplay-block overlay flag — consumed by the later UI PR. */
        needsGesture: false,
        pollFailures: 0,
    }),

    getters: {
        isScrobbleLeader(state): boolean {
            return !!state.deviceId && state.scrobbleLeader === state.deviceId
        },
        me(state): DeviceSummary | undefined {
            return state.devices.find(d => d.device_id === state.deviceId)
        },
        others(state): DeviceSummary[] {
            return state.devices.filter(d => d.device_id !== state.deviceId)
        },
    },

    actions: {
        // --- identity / registration ----------------------------------------
        async register() {
            this.deviceId = getOrCreateDeviceId()
            this.deviceName = detectDeviceName()
            this.deviceType = detectDeviceType()
            await registerDevice(this.deviceId, this.deviceName, this.deviceType)
            this.registered = true
        },

        // --- poll loop ------------------------------------------------------
        startPolling() {
            if (pollingActive) return
            pollingActive = true
            this.ensureVisibilityListener()
            this.scheduleNextPoll()
        },
        stopPolling() {
            pollingActive = false
            if (pollTimer) {
                clearTimeout(pollTimer)
                pollTimer = null
            }
            this.removeVisibilityListener()
        },
        scheduleNextPoll() {
            if (!pollingActive) return
            const cadence = this.joined ? CADENCE_JOINED_MS : CADENCE_SOLO_MS
            pollTimer = setTimeout(() => {
                void this.poll().finally(() => this.scheduleNextPoll())
            }, cadence)
        },
        /** Re-arm the next poll immediately so a joined/solo change takes effect at once. */
        restartPollingCadence() {
            if (!pollingActive) return
            if (pollTimer) {
                clearTimeout(pollTimer)
                pollTimer = null
            }
            this.scheduleNextPoll()
        },
        ensureVisibilityListener() {
            if (visibilityHandler || typeof document === 'undefined') return
            visibilityHandler = () => {
                if (document.visibilityState === 'visible') {
                    void this.poll()
                    this.hardResync()
                }
            }
            document.addEventListener('visibilitychange', visibilityHandler)
        },
        removeVisibilityListener() {
            if (!visibilityHandler || typeof document === 'undefined') return
            document.removeEventListener('visibilitychange', visibilityHandler)
            visibilityHandler = null
        },

        async poll() {
            if (!this.deviceId) return
            const settings = useSettings()
            const t0 = Date.now()

            let res: PollResponse | null = null
            try {
                res = await pollSession({
                    device_id: this.deviceId,
                    known_version: this.sessionVersion,
                    client_sent_ms: t0,
                    volume: settings.volume,
                    mute: settings.mute,
                })
            } catch {
                // network/parse failure — treated the same as a null response below.
                res = null
            }

            if (!res) {
                this.pollFailures++
                if (this.pollFailures >= RECONNECT_AFTER) {
                    this.status = 'reconnecting'
                }
                if (this.joined && this.pollFailures >= FAILURES_TO_SOLO) {
                    // ≈15 s of silence while joined → dissolve to solo, keep playing.
                    this.toSolo()
                }
                return
            }

            estimator.addSample(t0, res.server_now_ms, Date.now())
            this.pollFailures = 0
            if (this.status === 'reconnecting') {
                this.status = this.joined ? 'joined' : 'solo'
            }
            this.devices = res.devices ?? []
            this.scrobbleLeader = res.scrobble_leader ?? null

            // Membership transition: the server no longer considers us joined
            // (e.g. it restarted and the RAM session is gone) → graceful solo.
            if (this.joined && !res.joined) {
                this.toSolo()
                this.sessionVersion = res.version
                return
            }

            if (res.state) {
                await this.applyState(res.state)
            }
            this.handleCommands(res.commands ?? [])
            this.sessionVersion = res.version
        },

        /** Re-derive transport from the current anchor (used on tab re-focus). */
        hardResync() {
            if (!this.joined || !this.anchor) return
            this.applying = true
            try {
                this.reconcileTransport()
            } finally {
                this.applying = false
            }
        },

        // --- authoritative state mirroring ----------------------------------
        async applyState(state: SyncState) {
            const prevQueueId = this.queueId
            this.applying = true
            try {
                this.queueId = state.queue_id

                const hashKey = state.trackhashes.join('\n')
                const queueChanged = state.queue_id !== prevQueueId || hashKey !== this.lastMirroredHashKey

                if (queueChanged) {
                    const tracks = await resolveTracks(state.trackhashes)
                    const tracklist = useTracklist()
                    tracklist.setNewList(tracks)
                    tracklist.from = state.from as From
                    this.lastMirroredHashKey = hashKey
                }

                const queue = useQueue()
                queue.currentindex = state.currentindex

                // Direct state write, not toggleRepeatMode() — mirroring must not
                // re-broadcast as a set_repeat command.
                useSettings().repeat = state.repeat as RepeatMode

                this.anchor = state.anchor
                this.playing = state.playing

                this.reconcileTransport()
            } finally {
                this.applying = false
            }
        },

        /**
         * Hard-align the audio element with the anchor: (re)load the current
         * track, seek to the expected position, and match play/pause. A best-
         * effort seek is fine — the steering loop converges any residual drift.
         */
        reconcileTransport() {
            if (!this.anchor) return
            const anchor = this.anchor

            const queue = useQueue()
            const tracklist = useTracklist()
            const player = usePlayer()

            const current = tracklist.tracklist[queue.currentindex]
            if (!current || !current.filepath) {
                // Missing-track gap: fewer tracks resolved than hashes and the
                // current one is absent → stay paused-mirroring, do not crash.
                return
            }

            const expected = expectedPositionMs(anchor, estimator.serverNow(), this.playing)
            const trackDiffers = loadedTrackhash !== current.trackhash
            const drift = Math.abs(player.getCurrentTimeMs() - expected) > 1000
            const playMismatch = queue.playing !== this.playing

            if (!trackDiffers && !drift && !playMismatch) return

            queue.playing = this.playing
            player.setPlaybackRate(1)
            appliedRate = 1

            if (trackDiffers) {
                player.playCurrent()
                loadedTrackhash = current.trackhash
            } else if (this.playing) {
                void audioSource.playPlayingSource()
            } else {
                audioSource.pausePlayingSource()
            }

            player.hardSeekMs(expected)
        },

        // --- command handling -----------------------------------------------
        handleCommands(cmds: SyncCommand[]) {
            for (const cmd of cmds) {
                if (executedCommandIds.has(cmd.id)) continue
                // Add before executing: the server re-delivers pending commands
                // during a grace window, so dedupe strictly by id.
                rememberCommandId(cmd.id)

                if (cmd.target_device !== null && cmd.target_device !== undefined) {
                    if (cmd.target_device !== this.deviceId) continue
                    this.handleTargeted(cmd)
                } else {
                    this.scheduleCommand(cmd)
                }
            }
        },

        /** Targeted (execute_at 0) commands addressed to this device. */
        handleTargeted(cmd: SyncCommand) {
            const p = (cmd.payload ?? {}) as any

            switch (cmd.type) {
                case 'set_volume': {
                    const settings = useSettings()
                    this.applying = true
                    try {
                        settings.setVolume(p.volume)
                    } finally {
                        this.applying = false
                    }
                    break
                }
                case 'set_mute': {
                    const settings = useSettings()
                    this.applying = true
                    try {
                        settings.mute = !!p.mute
                        usePlayer().setMute(settings.mute)
                    } finally {
                        this.applying = false
                    }
                    break
                }
                case 'join_invite': {
                    void this.joinNow()
                    break
                }
                case 'play_here': {
                    // Another device pressed "play here only": recipients bow out
                    // of the group and stop their audio.
                    this.playHereLeave()
                    break
                }
                default:
                    break
            }
        },

        scheduleCommand(cmd: SyncCommand) {
            const localExecMs = cmd.execute_at_ms - estimator.offset
            const now = Date.now()
            const delay = localExecMs - now

            if (delay <= 0) {
                // Missed window: execute now, catching up the position by however
                // long ago the command was meant to fire (only while playing).
                const catchUp = impliesPlaying(cmd, this.playing)
                    ? Math.max(0, estimator.serverNow() - cmd.execute_at_ms)
                    : 0
                this.executeCommand(cmd, catchUp)
                return
            }

            const entry: Scheduled = { handle: null, at: localExecMs }
            entry.handle = setTimeout(() => {
                scheduled = scheduled.filter(s => s !== entry)
                this.executeCommand(cmd, 0)
            }, delay)
            scheduled.push(entry)
        },

        executeCommand(cmd: SyncCommand, extraMs = 0) {
            const p = (cmd.payload ?? {}) as any
            const queue = useQueue()
            const player = usePlayer()

            this.applying = true
            try {
                switch (cmd.type) {
                    case 'play': {
                        queue.playing = true
                        void audioSource.playPlayingSource()
                        if (typeof p.position_ms === 'number') {
                            player.hardSeekMs(p.position_ms + extraMs)
                        }
                        break
                    }
                    case 'pause': {
                        queue.playing = false
                        audioSource.pausePlayingSource()
                        if (typeof p.position_ms === 'number') {
                            player.hardSeekMs(p.position_ms)
                        }
                        break
                    }
                    case 'seek': {
                        player.setPlaybackRate(1)
                        appliedRate = 1
                        player.hardSeekMs((p.position_ms ?? 0) + extraMs)
                        break
                    }
                    case 'track_change': {
                        const wantPlaying = p.playing !== false
                        if (typeof p.index === 'number') queue.currentindex = p.index
                        queue.playing = wantPlaying
                        player.setPlaybackRate(1)
                        appliedRate = 1
                        player.playCurrent()
                        loadedTrackhash = useTracklist().tracklist[queue.currentindex]?.trackhash ?? ''
                        player.hardSeekMs((p.position_ms ?? 0) + extraMs)
                        break
                    }
                    case 'set_repeat': {
                        useSettings().repeat = p.repeat as RepeatMode
                        break
                    }
                    default:
                        break
                }
            } finally {
                this.applying = false
            }
        },

        // --- drift steering --------------------------------------------------
        startSteerLoop() {
            if (steerTimer) return
            steerTimer = setInterval(() => this.steerTick(), STEER_MS)
        },
        stopSteerLoop() {
            if (!steerTimer) return
            clearInterval(steerTimer)
            steerTimer = null
        },
        steerTick() {
            if (!this.joined || !this.playing || !this.anchor || this.applying) return
            const anchor = this.anchor
            // Don't fight a seek/track-change that's about to fire.
            if (scheduledCommandNear(Date.now())) return

            const player = usePlayer()
            const expected = expectedPositionMs(anchor, estimator.serverNow(), true)
            const correction = computeCorrection(player.getCurrentTimeMs(), expected)

            if (correction.action === 'rate') {
                player.setPlaybackRate(correction.rate)
                appliedRate = correction.rate
            } else if (correction.action === 'seek') {
                player.hardSeekMs(correction.seekToMs)
                player.setPlaybackRate(1)
                appliedRate = 1
            } else if (appliedRate !== 1) {
                player.setPlaybackRate(1)
                appliedRate = 1
            }
        },

        // --- membership transitions -----------------------------------------
        async join() {
            if (!this.deviceId) return
            const t0 = Date.now()
            const res = await joinGroup(this.deviceId)
            const snap = res?.data as PollResponse | undefined

            this.joined = true
            this.status = 'joined'
            this.pollFailures = 0

            const snapState = snap?.state
            const emptySession = !snapState || (snapState.trackhashes?.length ?? 0) === 0
            const localTracklist = useTracklist()

            if (emptySession && localTracklist.tracklist.length > 0) {
                // First joiner into an empty session seeds it from local state.
                if (snap && typeof snap.server_now_ms === 'number') {
                    estimator.addSample(t0, snap.server_now_ms, Date.now())
                }
                if (snap?.devices) this.devices = snap.devices
                this.scrobbleLeader = snap?.scrobble_leader ?? null
                if (typeof snap?.version === 'number') this.sessionVersion = snap.version
                await this.sendQueueSet()
            } else {
                await this.applySnapshot(snap, t0)
            }

            this.startSteerLoop()
            this.restartPollingCadence()
        },

        /** Remote-invite join: audio play() may be autoplay-blocked → needsGesture. */
        async joinNow() {
            if (!this.deviceId) return
            const t0 = Date.now()
            const res = await joinGroup(this.deviceId)
            const snap = res?.data as PollResponse | undefined

            this.joined = true
            this.status = 'joined'
            this.pollFailures = 0

            await this.applySnapshot(snap, t0)

            this.startSteerLoop()
            this.restartPollingCadence()
        },

        /** Retry the blocked play() from a real user gesture and clear the flag. */
        completeGestureJoin() {
            this.needsGesture = false
            this.applying = true
            try {
                this.reconcileTransport()
            } finally {
                this.applying = false
            }
        },

        async applySnapshot(snap: PollResponse | undefined, t0: number) {
            if (!snap) return
            if (typeof snap.server_now_ms === 'number') {
                estimator.addSample(t0, snap.server_now_ms, Date.now())
            }
            this.devices = snap.devices ?? this.devices
            this.scrobbleLeader = snap.scrobble_leader ?? null
            if (snap.state) await this.applyState(snap.state)
            this.handleCommands(snap.commands ?? [])
            if (typeof snap.version === 'number') this.sessionVersion = snap.version
        },

        /** Voluntary leave: keep playing locally (dissolve-to-solo semantics). */
        async leave() {
            const id = this.deviceId
            this.stopSteerLoop()
            this.joined = false
            this.status = 'solo'
            this.restartPollingCadence()
            if (id) await leaveGroup(id)
        },

        /** play_here recipient: leave the group AND stop audio. */
        playHereLeave() {
            const id = this.deviceId
            if (id) void leaveGroup(id)
            audioSource.pausePlayingSource()
            useQueue().playing = false
            this.toSolo()
        },

        /** Internal graceful fallback to solo — never stops local playback. */
        toSolo() {
            this.joined = false
            this.stopSteerLoop()
            this.status = 'solo'
            this.restartPollingCadence()
        },

        // --- outbound: queue-set + commands ---------------------------------
        async sendQueueSet(opts?: {
            trackhashes?: string[]
            from?: SyncFrom
            currentindex?: number
            playing?: boolean
            position_ms?: number
            repeat?: string
        }) {
            const tracklist = useTracklist()
            const queue = useQueue()
            const settings = useSettings()
            const player = usePlayer()

            await setQueue({
                device_id: this.deviceId,
                trackhashes: opts?.trackhashes ?? tracklist.tracklist.map(t => t.trackhash),
                from: opts?.from ?? (tracklist.from as SyncFrom),
                currentindex: opts?.currentindex ?? queue.currentindex,
                playing: opts?.playing ?? queue.playing,
                position_ms: opts?.position_ms ?? player.getCurrentTimeMs(),
                repeat: opts?.repeat ?? settings.repeat,
            })
        },

        async sendCmd(type: SyncCommandType, payload: unknown, target_device?: string) {
            await sendCommand({ device_id: this.deviceId, type, payload, target_device })
        },

        // --- transport interception (called from queue/settings seams) ------
        intercept(action: string, ...args: any[]) {
            const queue = useQueue()
            const tracklist = useTracklist()
            const settings = useSettings()

            switch (action) {
                case 'play': {
                    const index = typeof args[0] === 'number' ? args[0] : 0
                    const currentKey = tracklist.tracklist.map(t => t.trackhash).join('\n')

                    if (currentKey !== this.lastMirroredHashKey) {
                        // New context: the user navigated to a fresh album/playlist
                        // (components already set the local list) → replace the group
                        // queue. The server bounces it back as authoritative state.
                        void this.sendQueueSet({
                            trackhashes: tracklist.tracklist.map(t => t.trackhash),
                            from: tracklist.from as SyncFrom,
                            currentindex: index,
                            playing: true,
                            position_ms: 0,
                            repeat: settings.repeat,
                        })
                    } else {
                        void this.sendCmd('track_change', { index, position_ms: 0, playing: true })
                    }
                    break
                }
                case 'playPause': {
                    if (queue.playing) void this.sendCmd('pause', {})
                    else void this.sendCmd('play', {})
                    break
                }
                case 'seek': {
                    const posSeconds = typeof args[0] === 'number' ? args[0] : 0
                    void this.sendCmd('seek', { position_ms: Math.round(posSeconds * 1000) })
                    break
                }
                case 'playNext': {
                    void this.sendCmd('track_change', { index: queue.nextindex, position_ms: 0, playing: true })
                    break
                }
                case 'playPrev': {
                    void this.sendCmd('track_change', { index: queue.previndex, position_ms: 0, playing: true })
                    break
                }
                case 'shuffleQueue': {
                    const hashes = tracklist.tracklist.map(t => t.trackhash)
                    const currentHash = hashes[queue.currentindex]
                    const rest = hashes.filter((_, i) => i !== queue.currentindex)
                    shuffleInPlace(rest)
                    const shuffled = currentHash !== undefined ? [currentHash, ...rest] : rest
                    void this.sendQueueSet({
                        trackhashes: shuffled,
                        from: tracklist.from as SyncFrom,
                        currentindex: 0,
                        playing: true,
                        position_ms: 0,
                        repeat: settings.repeat,
                    })
                    break
                }
                case 'toggleRepeat': {
                    void this.sendCmd('set_repeat', { repeat: args[0] })
                    break
                }
                default:
                    break
            }
        },

        /** Audio ended in group mode: only the scrobble leader advances the group. */
        onTrackEnded() {
            if (!this.isScrobbleLeader) return

            const queue = useQueue()
            const tracklist = useTracklist()
            const settings = useSettings()
            const len = tracklist.tracklist.length
            const i = queue.currentindex

            if (settings.repeat === 'one') {
                void this.sendCmd('track_change', { index: i, position_ms: 0, playing: true })
                return
            }
            if (settings.repeat === 'all') {
                const next = len > 0 ? (i + 1) % len : 0
                void this.sendCmd('track_change', { index: next, position_ms: 0, playing: true })
                return
            }
            // repeat 'none': advance, or pause the group when the last track ends.
            if (i >= len - 1) {
                void this.sendCmd('pause', {})
            } else {
                void this.sendCmd('track_change', { index: i + 1, position_ms: 0, playing: true })
            }
        },
    },
})
