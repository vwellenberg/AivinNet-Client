import { Setting } from '@/interfaces/settings'
import { SettingType } from '../enums'
import useSettings from '@/stores/settings'

const settings = useSettings

const font: Setting = {
    title: 'Schriftart',
    desc: 'Wähle zwischen der Standard-Schrift und einer Spotify-ähnlichen Schrift (Figtree).',
    type: SettingType.select,
    options: [
        { title: 'Standard', value: 'default' },
        { title: 'Spotify-Stil', value: 'spotify' },
    ],
    state: () => settings().font,
    action: (value: 'default' | 'spotify') => settings().setFont(value),
    defaultAction: () => settings().toggleFont(),
}

export default [font]
