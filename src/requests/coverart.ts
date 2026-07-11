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
 * matching the query. Returns an empty list on failure.
 */
export async function searchCoversOnline(query: string): Promise<CoverSuggestion[]> {
    const { data, status } = await useAxios({
        url: `${paths.api.coverart}/search?q=${encodeURIComponent(query)}`,
        method: 'GET',
    })

    if (status !== 200 || !data) {
        return []
    }

    return data.results || []
}

/**
 * Asks the server to download the confirmed cover and save it as the
 * playlist image. Returns the updated playlist info, or null on failure.
 */
export async function saveOnlineCoverForPlaylist(pid: number, url: string) {
    const { data, status } = await useAxios({
        url: `${paths.api.coverart}/playlist/${pid}`,
        props: { url },
        method: 'POST',
    })

    if (status !== 200 || !data || !data.data) {
        new Notification('Failed to save cover image', NotifType.Error)
        return null
    }

    return data.data
}

/**
 * Asks the server to download the confirmed cover and save it as the
 * album cover. Returns true on success.
 */
export async function saveOnlineCoverForAlbum(albumhash: string, url: string): Promise<boolean> {
    const { status } = await useAxios({
        url: `${paths.api.coverart}/album`,
        props: { albumhash, url },
        method: 'POST',
    })

    if (status !== 200) {
        new Notification('Failed to save cover image', NotifType.Error)
        return false
    }

    return true
}
