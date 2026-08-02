import { SettingType } from '../enums'
import { Setting } from '@/interfaces/settings'

import useSettingsStore from '@/stores/settings'

const settings = useSettingsStore

const npLauflicht: Setting = {
    title: 'Now Playing glow',
    desc: 'Animated brand light around the Now Playing artwork (pink glow + running comet). Pick how intense it is.',
    type: SettingType.select,
    options: [
        { title: 'Off', value: 'off' },
        { title: 'Subtle', value: 'subtle' },
        { title: 'Normal', value: 'normal' },
    ],
    state: () => settings().np_lauflicht_level,
    action: (value: 'off' | 'subtle' | 'normal') => settings().setNpLauflichtLevel(value),
    defaultAction: () => settings().cycleNpLauflichtLevel(),
}

const showNowPlayingOnTabTitle: Setting = {
    title: 'Show Now Playing track on tab title',
    desc: 'Replace current page info with Now Playing track info',
    type: SettingType.binary,
    state: () => settings().nowPlayingTrackOnTabTitle,
    action: () => settings().toggleNowPlayingTrackOnTabTitle(),
}

const showInlineFavIcon: Setting = {
    title: 'Show inline favorite icon',
    desc: 'Show the favorite button next to the track duration',
    type: SettingType.binary,
    state: () => settings().showInlineFavIcon,
    action: () => settings().toggleShowInlineFavIcon(),
}

const highlightFavoriteTracks: Setting = {
    title: 'Highlight favorite tracks',
    desc: 'Always show the favorite button for favorited tracks',
    type: SettingType.binary,
    state: () => settings()._highlightFavoriteTracks,
    action: () => settings().toggleHighlightFavoriteTracks(),
    show_if: () => settings().showInlineFavIcon,
}

export default [npLauflicht, showNowPlayingOnTabTitle, showInlineFavIcon, highlightFavoriteTracks]
