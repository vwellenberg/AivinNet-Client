import { Setting } from '@/interfaces/settings'
import useMusicBrainzStore from '@/stores/musicbrainz'
import { SettingType } from '../enums'

const store = () => useMusicBrainzStore()

const fetchMissingCovers: Setting = {
    title: 'Cover via MusicBrainz nachholen',
    desc: 'Lädt fehlende Album-Cover aus MusicBrainz / Cover Art Archive (max. 50 pro Lauf, ~1s pro Album).',
    type: SettingType.button,
    state: null,
    inactive: () => store().isRunning || store().starting,
    button_text: () => {
        const s = store()
        if (s.starting) return 'Starte…'
        if (s.isRunning) return `Lädt… ${s.progressText} (${s.progressPct}%)`
        if (s.status && !s.status.in_progress && s.status.total > 0) {
            return `Erneut starten · letzter Lauf: ${s.progressText}`
        }
        return 'Jetzt nachholen'
    },
    action: () => store().startBatch(50),
}

export default [fetchMissingCovers]
