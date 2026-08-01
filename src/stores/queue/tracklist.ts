import { defineStore } from 'pinia'

import useDeviceSync from '@/stores/devicesync'
import useInterface from '@/stores/interface'
import { NotifType, useToast } from '@/stores/notification'
import usePlaylists from '@/stores/pages/playlists'
import { usePlayer } from '@/stores/player'
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'

import { FromOptions } from '@/enums'
import {
    fromAlbum,
    fromArtist,
    fromFav,
    fromFolder,
    fromPlaylist,
    fromPlaylistFolder,
    fromSearch,
    Track,
} from '@/interfaces'
import { resolveQueueMove } from '@/utils/queueMove'

export type From =
    | fromFolder
    | fromAlbum
    | fromPlaylist
    | fromPlaylistFolder
    | fromSearch
    | fromArtist
    | fromFav

export function shuffleArray<T>(items: T[]): T[] {
    const shuffled = items.slice()
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}
export default defineStore('tracklist', {
    state: () => ({
        from: {} as From,
        tracklist: <Track[]>[],
    }),
    actions: {
        loadFromLocalStorage() {
            const queue = localStorage.getItem('queue')

            if (queue) {
                const parsed = JSON.parse(queue)
                this.from = parsed.from
                this.tracklist = parsed.tracks
            }
        },
        setNewList(tracklist: Track[]) {
            if (this.tracklist !== tracklist) {
                this.tracklist = []
                this.tracklist.push(...tracklist)
            }

            const { focusCurrentInSidebar } = useInterface()
            focusCurrentInSidebar(1000)
            usePlayer().clearNextAudio()

            // Shuffle history and the pre-rolled target are indices into the OLD
            // list — meaningless now. Reset before the next roll.
            const queue = useQueue()
            queue.shuffleRecent = []
            queue.rollShuffleNext()
        },
        setFromFolder(path: string, tracks: Track[]) {
            // remove trailing slash
            path = path.replace(/\/$/, '')
            const name = path.split('/').pop()
            this.from = <fromFolder>{
                type: FromOptions.folder,
                path: tracks[0].folder,
                name: name?.trim() === '' ? path : name,
            }
            this.setNewList(tracks)
        },
        setFromAlbum(name: string, albumhash: string, tracks: Track[]) {
            this.from = <fromAlbum>{
                type: FromOptions.album,
                name: name,
                albumhash: albumhash,
            }

            this.setNewList(tracks)
        },
        setFromPlaylist(name: string, pid: number, tracks: Track[]) {
            this.from = <fromPlaylist>{
                type: FromOptions.playlist,
                name: name,
                id: pid,
            }

            this.setNewList(tracks)

            // Library sidebar recency: bubble the played playlist to the top
            // of its group (pinned/un-pinned). Fire-and-forget so playback
            // never waits on the reorder request.
            if (useSettings().move_played_playlist_to_top) {
                void usePlaylists().movePlayedToTop(pid)
            }
        },
        setFromPlaylistFolder(name: string, id: number, tracks: Track[]) {
            this.from = <fromPlaylistFolder>{
                type: FromOptions.playlistFolder,
                name: name,
                id: id,
            }

            this.setNewList(tracks)
        },
        setFromSearch(query: string, tracks: Track[]) {
            this.from = <fromSearch>{
                type: FromOptions.search,
                query: query,
            }

            this.setNewList(tracks)
        },
        setFromArtist(artisthash: string, name: string, tracks: Track[]) {
            this.from = <fromArtist>{
                type: FromOptions.artist,
                artisthash: artisthash,
                artistname: name,
            }

            this.setNewList(tracks)
        },
        setFromFav(tracks: Track[]) {
            this.from = <fromFav>{
                type: FromOptions.favorite,
            }

            this.setNewList(tracks)
        },
        addTrack(track: Track) {
            return this.addTracks([track])
        },
        addTracks(tracks: Track[]) {
            this.insertAt(tracks, this.tracklist.length)

            const Toast = useToast()
            Toast.showNotification(`Added ${tracks.length} tracks to queue`, NotifType.Success)
        },
        insertAt(tracks: Track[], index: number) {
            // Group mode: local queue edits ("play next" / "add to queue" funnel
            // through here) must go through the server, or this device's list
            // silently diverges from the authoritative group queue.
            const ds = useDeviceSync()
            if (ds.joined && !ds.applying) {
                ds.intercept('insertTracks', tracks, index)
                return
            }

            this.tracklist.splice(index, 0, ...tracks)

            const player = usePlayer()
            const queue = useQueue()

            if (index == queue.nextindex) {
                player.clearNextAudio()
            }
        },
        /**
         * Reorder the queue itself: drag a row in the queue panel, or mirror a
         * playlist reorder into the queue that is playing that playlist.
         *
         * `to` is the drop GAP, the same convention SongItem emits and
         * `playlistMove.ts` uses. The index arithmetic — including where the
         * playing track ends up — lives in `utils/queueMove.ts` and is tested
         * against a model of this splice.
         */
        moveTrack(from: number, to: number) {
            const queue = useQueue()
            const move = resolveQueueMove(this.tracklist.length, from, to, queue.currentindex)
            if (!move) return

            // Group mode: the same seam as insertAt/removeByIndex. Splicing the
            // local list leaves the server's queue_id untouched, so nothing
            // re-mirrors and every other device keeps playing the old order.
            const ds = useDeviceSync()
            if (ds.joined && !ds.applying) {
                ds.intercept('moveTrack', from, to)
                return
            }

            const [track] = this.tracklist.splice(from, 1)
            this.tracklist.splice(move.finalIndex, 0, track)

            // A reorder is not a track change: whatever is playing keeps playing,
            // it just sits at a different index now.
            queue.setCurrentIndex(move.currentindex)

            // Whatever was preloaded as "next" may be a different track now.
            usePlayer().clearNextAudio()
        },
        clearList() {
            this.tracklist = []
            this.from = {} as From
        },
        /**
         * Reorder the queue once (the panel's "Shuffle" action).
         *
         * `avoidFront` is the index of the track playing right now: it must not
         * land first, because the caller restarts playback at index 0 — and a
         * shuffle that restarts the same song at 0:00 is the one outcome nobody
         * presses that button for.
         */
        shuffleList(avoidFront?: number) {
            const playing = avoidFront === undefined ? undefined : this.tracklist[avoidFront]
            const shuffled = shuffleArray(this.tracklist)

            if (playing && shuffled.length > 1 && shuffled[0] === playing) {
                const swap = 1 + Math.floor(Math.random() * (shuffled.length - 1))
                ;[shuffled[0], shuffled[swap]] = [shuffled[swap], shuffled[0]]
            }

            this.tracklist = shuffled
        },
        removeByIndex(index: number) {
            // Group mode: same seam as insertAt. A local splice would leave the
            // server queue untouched, so its queue_id never changes, nothing
            // re-mirrors — and the mirrored currentindex then points at the
            // wrong track on every device.
            const ds = useDeviceSync()
            if (ds.joined && !ds.applying) {
                ds.intercept('removeTracks', index)
                return
            }

            const { currentindex, nextindex, playing, playNext, moveForward, setCurrentIndex } = useQueue()
            const player = usePlayer()

            if (this.tracklist.length == 1) {
                return this.clearList()
            }

            if (index == currentindex) {
                if (playing) {
                    playNext()
                } else {
                    moveForward()
                }

                setCurrentIndex(index)
            }

            if (index < currentindex) {
                setCurrentIndex(currentindex - 1)
            }

            this.tracklist.splice(index, 1)

            if (index == nextindex) {
                player.clearNextAudio()
            }
        },
        toggleFav(index: number) {
            const track = this.tracklist[index]

            if (track) {
                track.is_favorite = !track.is_favorite
            }
        },
        // Apply an edited track's new tags to any copies already in the queue
        // (matched by the pre-edit trackhash). currentindex is left untouched, so
        // `currenttrack`/`currenttrackhash` simply re-derive — the now-playing bar
        // and current-row highlight follow the new tags without reloading audio.
        retagTrack(oldHash: string, updated: Track) {
            this.tracklist.forEach(track => {
                if (track.trackhash === oldHash) {
                    Object.assign(track, updated)
                }
            })
        },
        insertAfterCurrent(tracks: Track[]) {
            const { currentindex } = useQueue()

            this.tracklist.splice(currentindex + 1, 0, ...tracks)

            const Toast = useToast()
            Toast.showNotification(`Added ${tracks.length} tracks to queue`, NotifType.Success)
        },
    },
    getters: {
        length(): number {
            return this.tracklist.length
        },
    },
    persist: true,
})
