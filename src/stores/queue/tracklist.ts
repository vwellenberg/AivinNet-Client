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

            const player = usePlayer()
            const queue = useQueue()

            // Which track was queued up as "next" BEFORE the splice? Comparing
            // the TRACK is the only check that holds in both play orders. The
            // old test compared the insert POSITION against `nextindex`, which
            // is only ever true in sequential order — there `nextindex` is
            // `currentindex + 1`, exactly where "play next" inserts. Under
            // shuffle `nextindex` is a pre-rolled random index somewhere else
            // in the list, so the same insert displaced the preloaded row
            // without the condition ever firing.
            const nextBefore = this.tracklist[queue.nextindex]

            this.tracklist.splice(index, 0, ...tracks)

            // The shuffle bookkeeping is ABSOLUTE indexes: everything from
            // `index` on just moved back by `tracks.length`, so the pre-rolled
            // target and the history have to travel with them or they silently
            // start naming different tracks.
            queue.shiftShuffleIndexes(index, tracks.length)

            if (this.tracklist[queue.nextindex] !== nextBefore) {
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

            // The shuffle bookkeeping needs the same treatment as currentindex,
            // and for the same reason — the dragged row may have passed over it.
            queue.remapShuffleIndexes(from, move.finalIndex)

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

            const queue = useQueue()
            const { currentindex, playing, playNext, moveForward, setCurrentIndex } = queue
            const player = usePlayer()

            if (this.tracklist.length == 1) {
                return this.clearList()
            }

            // Same reasoning as insertAt: read the track, not the index. Taken
            // before anything below can move the queue on.
            const nextBefore = this.tracklist[queue.nextindex]

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

            // The removed row renumbers everything behind it, and it may BE the
            // pre-rolled shuffle target — in which case there is nothing to
            // re-point to and the store rolls again.
            queue.dropShuffleIndex(index)

            if (this.tracklist[queue.nextindex] !== nextBefore) {
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
        /**
         * "Play next": drop tracks into the slot right behind the playing one.
         *
         * Goes through `insertAt` rather than splicing itself — that is the only
         * place the queue is allowed to grow. Splicing here directly skipped BOTH
         * of its jobs: the group-session seam (the local list grew while the
         * server's queue_id stayed put, so nothing re-mirrored and every other
         * device kept the old queue with a currentindex pointing at the wrong
         * track) and the `clearNextAudio()` right after it — in sequential order
         * the insert lands exactly on `nextindex`, so the already-preloaded
         * audio was the track this insert just displaced.
         */
        insertAfterCurrent(tracks: Track[]) {
            const queue = useQueue()
            const at = queue.currentindex + 1

            this.insertAt(tracks, at)

            // Under shuffle the pre-rolled target points elsewhere and now
            // travels with the splice, so it would sail right past these rows.
            // "Play next" has to mean next in both play orders.
            queue.aimShuffleNext(at)

            // Shown in the group case too (same as addTracks): the insert was
            // accepted, it just travels via the server.
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
