import { defineStore } from 'pinia'
import {
    MusicBrainzStatus,
    fetchMissingCovers,
    getMusicBrainzStatus,
} from '@/requests/musicbrainz'
import { NotifType, useToast } from '@/stores/notification'

const POLL_INTERVAL_MS = 2000

interface State {
    status: MusicBrainzStatus | null
    pollTimer: ReturnType<typeof setInterval> | null
    starting: boolean
}

export default defineStore('musicbrainz', {
    state: (): State => ({
        status: null,
        pollTimer: null,
        starting: false,
    }),
    getters: {
        isRunning: (s) => !!s.status?.in_progress,
        progressPct(): number {
            if (!this.status || this.status.total === 0) return 0
            const done = this.status.fetched + this.status.failed
            return Math.min(100, Math.round((done / this.status.total) * 100))
        },
        progressText(): string {
            const s = this.status
            if (!s) return ''
            const done = s.fetched + s.failed
            if (s.in_progress) {
                return `${done}/${s.total} — ${s.fetched} ok, ${s.failed} fail`
            }
            if (s.total > 0) {
                return `Done: ${s.fetched}/${s.total} (${s.failed} fail)`
            }
            return ''
        },
    },
    actions: {
        async refreshStatus() {
            this.status = await getMusicBrainzStatus()
            if (this.status && !this.status.in_progress) {
                this.stopPolling()
            }
        },
        startPolling() {
            if (this.pollTimer) return
            this.pollTimer = setInterval(() => this.refreshStatus(), POLL_INTERVAL_MS)
        },
        stopPolling() {
            if (this.pollTimer) {
                clearInterval(this.pollTimer)
                this.pollTimer = null
            }
        },
        async startBatch(limit = 50) {
            if (this.starting || this.isRunning) return
            this.starting = true
            try {
                const res = await fetchMissingCovers(limit)
                if (res.status === 409 && res.runningStatus) {
                    this.status = res.runningStatus
                    this.startPolling()
                    return
                }
                if (!res.success) {
                    useToast().showNotification(
                        res.error || 'Could not start batch',
                        NotifType.Error,
                    )
                    return
                }
                if (res.queued === 0) {
                    useToast().showNotification(
                        'No albums without covers',
                        NotifType.Info,
                    )
                    return
                }
                useToast().showNotification(
                    `Started batch (${res.queued} albums)`,
                    NotifType.Info,
                )
                await this.refreshStatus()
                this.startPolling()
            } finally {
                this.starting = false
            }
        },
    },
})
