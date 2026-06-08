import { Setting } from '@/interfaces/settings'
import useMusicBrainzStore from '@/stores/musicbrainz'
import { SettingType } from '../enums'

const store = () => useMusicBrainzStore()

const fetchMissingCovers: Setting = {
    title: 'Cover via MusicBrainz nachholen',
    desc: 'Lädt fehlende Album-Cover aus MusicBrainz / Cover Art Archive (~1s pro Album).',
    type: SettingType.button,
    state: null,
    inactive: () => store().isRunning || store().starting,
    button_text: () => {
        const s = store()
        if (s.starting) return 'Starte…'
        if (s.isRunning) return `Lädt… ${s.progressPct}%`
        if (!s.countLoaded) {
            // Lazy-load the count the first time the setting renders.
            s.refreshCount()
            return 'Lade Anzahl…'
        }
        if (s.missingCount === 0) {
            return 'Alle Cover vorhanden ✓'
        }
        if (s.remainingCount === 0) {
            return s.failedCount > 0
                ? `${s.failedCount} ohne Treffer · erneut versuchen`
                : 'Erneut versuchen'
        }
        return `${s.remainingCount} Cover laden`
    },
    // limit 0 = all missing albums. When nothing is left to try (all
    // remaining were previously failed), the click retries those instead.
    action: () => {
        const s = store()
        s.startBatch(0, s.countLoaded && s.remainingCount === 0 && s.missingCount > 0)
    },
}

export default [fetchMissingCovers]
