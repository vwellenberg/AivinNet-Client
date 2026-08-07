import useSettings from '@/stores/settings'
import { loggedInUserIsAdmin } from '../utils'

import { SettingCategory } from '@/interfaces/settings'
import * as strings from '../strings'
import albums from './albums'
import restore from './backup'
import contextChildrenShowMode from './context-children-show-mode'
import font from './font'
import musicbrainz from './musicbrainz'
import nowPlaying from './now-playing-group'
import pageGradient from './page-gradient'
import rootDirSettings from './root-dirs'
import separators from './separators'
import sidebarSettings from './sidebar'
import theme from './theme'
import tracks from './tracks'
// icons
import AlbumSvg from '@/assets/icons/album.svg?raw'
import AvatarSvg from '@/assets/icons/artist.svg?raw'
import FolderSvg from '@/assets/icons/folder.svg?raw'
import TrackSvg from '@/assets/icons/mic.svg?raw'
import AppearanceSvg from '@/assets/icons/paintbrush.svg?raw'

const npStrings = strings.nowPlayingStrings
const rootRootStrings = strings.manageRootDirsStrings

export const general = {
    // title: 'General',
    groups: [
        {
            title: 'Appearance',
            desc: 'Settings for various parts of the user interface.',
            icon: AppearanceSvg,
            settings: [
                ...theme,
                ...pageGradient,
                ...font,
                ...sidebarSettings,
                ...contextChildrenShowMode,
                ...nowPlaying,
            ],
        },
    ],
} as SettingCategory

export const library = {
    title: 'Library',
    show_if: loggedInUserIsAdmin,
    groups: [
        {
            title: "Folders",
            icon: FolderSvg,
            desc: rootRootStrings.desc,
            settings: [...rootDirSettings],
        },
        {
            // null means settings table is not created yet
            show_if: () => useSettings().feat !== null,
            title: 'Tracks',
            icon: TrackSvg,
            desc: 'Settings relating to track information',
            settings: [...tracks],
        },
        {
            // null means settings table is not created yet
            show_if: () => useSettings().feat !== null,
            title: 'Albums',
            icon: AlbumSvg,
            desc: 'Settings relating to album information',
            settings: [...albums],
        },
        {
            // null means settings table is not created yet
            show_if: () => useSettings().feat !== null,
            title: 'Artists',
            icon: AvatarSvg,
            desc: 'Customize artist separators',
            settings: [separators],
        },
        {
            show_if: () => useSettings().feat !== null,
            title: 'Album Cover',
            icon: AlbumSvg,
            desc: 'Fetch missing album covers from MusicBrainz, iTunes and Deezer',
            settings: [...musicbrainz],
        },
        {
            title: "Backup",
            icon: AvatarSvg,
            desc: "Backup and restore your settings",
            settings: [...restore],
        }
    ],
} as SettingCategory

// ENHANCEMENT: Decouple components from Group.vue and pass them as part of the Setting interface (maybe?)
