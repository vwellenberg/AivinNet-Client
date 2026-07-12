import { paths } from '@/config'
import { NotifType, Notification } from '@/stores/notification'
import useAxios from './useAxios'

export interface CoverSuggestion {
    url: string
    source: string
    album: string
    artist: string
}

/**
 * Searches iTunes + Deezer (proxied by the server) for album covers
 * matching the query. Returns null when the request itself failed
 * (as opposed to a successful search with zero hits).
 */
export async function searchCoversOnline(query: string): Promise<CoverSuggestion[] | null> {
    const { data, status } = await useAxios({
        url: `${paths.api.coverart}/search?q=${encodeURIComponent(query)}`,
        method: 'GET',
    })

    if (status !== 200 || !data) {
        new Notification('Cover search failed', NotifType.Error)
        return null
    }

    return data.results || []
}

/**
 * Asks the server to download the confirmed cover and save it as the
 * playlist image, then updates the playlist store (mirrors updatePlaylist).
 * Returns true on success.
 */
export async function saveOnlineCoverForPlaylist(pid: number, url: string, pStore: any): Promise<boolean> {
    const { data, status } = await useAxios({
        url: `${paths.api.coverart}/playlist/${pid}`,
        props: { url },
        method: 'POST',
    })

    if (status !== 200 || !data || !data.data) {
        new Notification('Failed to save cover image', NotifType.Error)
        return false
    }

    pStore.updatePInfo(data.data)
    new Notification('Playlist cover updated!', NotifType.Success)
    return true
}

/**
 * Asks the server to download the confirmed cover and save it as the
 * album cover. Returns the saved image filename, or null on failure.
 */
export async function saveOnlineCoverForAlbum(albumhash: string, url: string): Promise<string | null> {
    const { data, status } = await useAxios({
        url: `${paths.api.coverart}/album`,
        props: { albumhash, url },
        method: 'POST',
    })

    if (status !== 200 || !data || !data.image) {
        new Notification('Failed to save cover image', NotifType.Error)
        return null
    }

    // Success feedback is the caller's job (it shows an undo toast).
    return data.image
}

/**
 * Restores the album cover replaced by the last save (one level).
 */
export async function undoAlbumCover(albumhash: string): Promise<boolean> {
    const { data, status } = await useAxios({
        url: `${paths.api.coverart}/album/undo`,
        props: { albumhash },
        method: 'POST',
    })

    if (status !== 200 || !data || !data.success) {
        new Notification('Nothing to undo', NotifType.Error)
        return false
    }

    return true
}
