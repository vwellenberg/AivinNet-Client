import { SettingType } from '../enums'
import { Setting } from '@/interfaces/settings'

import useSettingsStore from '@/stores/settings'

const settings = useSettingsStore

/**
 * Memphis theme switch: grid-paper light vs. classic-90s indigo dark.
 * App.vue watches the store value and toggles `body.theme-dark`, which
 * flips the --mem-* custom properties (Global/index.scss).
 */
const theme: Setting = {
    title: 'Theme',
    desc: 'Grid-paper light or the near-black dark look.',
    type: SettingType.select,
    options: [
        { title: 'Light', value: 'light' },
        { title: 'Dark', value: 'dark' },
    ],
    state: () => settings().theme,
    action: (value: 'light' | 'dark') => settings().setTheme(value),
    defaultAction: () => settings().toggleTheme(),
}

export default [theme]
