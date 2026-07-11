import useAlbum from '@/stores/pages/album'
import useTracklist from '@/stores/queue/tracklist'

import { getAlbumTracks } from '@/requests/album'
import { addAlbumToPlaylist } from '@/requests/playlists'
import { toggleAlbumPin } from '@/helpers/pinAlbum'
import usePinnedAlbums from '@/stores/pages/pinnedAlbums'

import { AddToQueueIcon, DownloadIcon, PlayNextIcon, PlusIcon, PushPinIcon, SearchIcon } from '@/icons'
import { getBaseUrl, paths } from '@/config'
import { Album, Option, Playlist, Track } from '@/interfaces'
import useModal from '@/stores/modal'
import { get_find_on_social, getAddToPlaylistOptions } from './utils'

export default async (album?: Album) => {
    const albumStore = useAlbum()

    if (!album) {
        album = albumStore.info
    }

    const play_next = <Option>{
        label: 'Play next',
        action: async () => {
            let tracks: Track[] = []

            if (album) {
                tracks = await getAlbumTracks(album.albumhash)
            } else {
                tracks = albumStore.tracks.filter(track => !track.is_album_disc_number)
            }

            useTracklist().insertAfterCurrent(tracks)
        },
        icon: PlayNextIcon,
    }

    const add_to_queue = <Option>{
        label: 'Add to queue',
        action: async () => {
            let tracks: Track[] = []

            if (album) {
                tracks = await getAlbumTracks(album.albumhash)
            } else {
                tracks = albumStore.tracks.filter(track => !track.is_album_disc_number)
            }

            useTracklist().addTracks(tracks)
        },
        icon: AddToQueueIcon,
    }

    // Action for each playlist option
    const AddToPlaylistAction = (playlist: Playlist) => {
        addAlbumToPlaylist(playlist, album.albumhash)
    }

    const add_to_playlist: Option = {
        label: 'Add to Playlist',
        children: () =>
            getAddToPlaylistOptions(AddToPlaylistAction, {
                albumhash: album.albumhash,
                playlist_name: album.title,
            }),
        icon: PlusIcon,
    }

    const download_album = <Option>{
        label: 'Download as ZIP',
        action: () => {
            const a = document.createElement('a')
            a.href = getBaseUrl() + paths.api.download + `/album/${album.albumhash}`
            a.click()
        },
        icon: DownloadIcon,
    }

    const find_cover_online = <Option>{
        label: 'Find cover online',
        action: () => {
            const artist = album.albumartists && album.albumartists.length ? album.albumartists[0].name : ''

            useModal().showFindCoverOnlineModal({
                type: 'album',
                id: album.albumhash,
                query: `${album.title} ${artist}`.trim(),
            })
        },
        icon: SearchIcon,
    }

    const is_pinned = usePinnedAlbums().isPinned(album.albumhash) || !!album.is_pinned
    const pin: Option = {
        label: is_pinned ? 'Unpin from library' : 'Pin to library',
        icon: PushPinIcon,
        action: () => toggleAlbumPin(album as Album),
    }

    return [
        play_next,
        add_to_queue,
        add_to_playlist,
        pin,
        find_cover_online,
        download_album,
        get_find_on_social('album', '', album),
    ]
}
