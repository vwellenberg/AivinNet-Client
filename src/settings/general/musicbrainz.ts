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
        if (s.isRunning) return `Lädt… ${s.progressText} (${s.progressPct}%)`
        if (!s.countLoaded) {
            // Lazy-load the count the first time the setting renders.
            s.refreshCount()
            return 'Lade Anzahl…'
        }
        if (s.missingCount === 0) {
            return `Alle ${s.totalAlbums} Alben haben ein Cover ✓`
        }
        return `${s.missingCount} von ${s.totalAlbums} Alben ohne Cover · alle laden`
    },
    // limit 0 = all missing albums
    action: () => store().startBatch(0),
}

export default [fetchMissingCovers]
