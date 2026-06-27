<template>
    <div class="folder-view v-scroll-page" style="height: 100%; position: relative;" :class="{ isSmall, isMedium }"
        :style="{ background: playlist.colors.bg ? `linear-gradient(180deg, ${playlist.colors.bg} 0%, ${playlist.colors.bg2 || playlist.colors.bg} 28%, #121212 62%)` : `linear-gradient(180deg, #2a2a2a 0%, #121212 45%)` }">
        <DynamicScroller
            id="contentscroller"
            :items="scrollerItems"
            :min-item-size="72"
            class="scroller"
            style="height: 100%"
        >
            <template #default="{ item, index, active }">
                <DynamicScrollerItem
                    :item="item"
                    :active="active"
                    :size-dependencies="[item.id, item.size]"
                    :data-index="index"
                >
                    <component
                        :is="item.component"
                        :key="item.id"
                        v-bind="item.props"
                        @playThis="playFromPlaylistPage(item.props.index - 1)"
                        @trackDropped="onTrackDropped"
                    ></component>
                </DynamicScrollerItem>
            </template>
        </DynamicScroller>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { onMounted, onUpdated } from 'vue'

import { isMedium, isSmall, isSmallPhone } from '@/stores/content-width'
import { dropSources } from '@/enums'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import usePlaylistStore from '@/stores/pages/playlist'

import updatePageTitle from '@/utils/updatePageTitle'

import playlistSvg from '@/assets/icons/playlist.svg'
import Header from '@/components/PlaylistView/Header.vue'
import NoItems from '@/components/shared/NoItems.vue'
import SongItem from '@/components/shared/SongItem.vue'
import AfterHeader from '@/components/PlaylistView/AfterHeader.vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import AlbumsFetcher from '@/components/ArtistView/AlbumsFetcher.vue'
import { reorderTracks } from '@/requests/playlists'
import { Track } from '@/interfaces'

const queue = useQueue()
const tracklist = useTracklist()
const playlist = usePlaylistStore()
const route = useRoute()

watch(() => route.params.pid, async (newPid, oldPid) => {
    if (newPid && newPid !== oldPid) {
        playlist.resetTracks()
        await playlist.fetchAll(newPid as string)
    }
})

interface ScrollerItem {
    id: string | number
    component: typeof Header | typeof SongItem | typeof NoItems | typeof AlbumsFetcher
    size: number
    props?: {}
}

const getNoItemsComponent = () =>
    <ScrollerItem>{
        id: 'Noitems',
        component: NoItems,
        size: 300, // somehow it doesn't work, patched with CSS
        props: {
            icon: playlistSvg,
            flag: playlist.tracks.length === 0,
            title: 'No tracks in this playlist',
            description: 'Add tracks to this playlist by right clicking on a track and selecting "add to playlist"',
        },
    }

const scrollerItems = computed(() => {
    const header: ScrollerItem = {
        id: 'header',
        component: Header,
        size: isSmallPhone.value ? 24 * 16 : 18 * 16,
    }

    const afterHeader: ScrollerItem = {
        id: 'afterHeader',
        component: AfterHeader,
        size: 4 * 16,
    }

    const tracks = playlist.tracks.map(track => {
        return {
            // Key by position (track.index = Fuse refIndex), like every other
            // track list in the app (SongList, Queue, ...). filepath is NOT
            // guaranteed unique, so a duplicate entry collided on the scroller
            // key and one row collapsed into a blank gap.
            id: track.index,
            component: SongItem,
            props: {
                track: track,
                index: track.index + 1,
                is_last: track.index === playlist.tracks.length - 1,
                droppable: !playlist.query,
                source: dropSources.playlist,
            },
            size: 72,
        }
    })

    const body = playlist.tracks.length === 0 ? [getNoItemsComponent()] : tracks

    // Show the infinite-scroll sentinel only after the first trackhash window
    // has been requested and more remain. Gating purely on !allLoaded rendered
    // the sentinel during the transient EMPTY window of a playlist switch: the
    // route watch runs resetTracks() (allTracks=[], allLoaded=false,
    // loadedHashCount=0) and only THEN awaits fetchAll(newPid). In that gap the
    // sentinel mounts and its onMounted fires fetch_callback ->
    // fetchAll(playlist.info.id) while info.id is STILL the previous playlist,
    // racing the watch's fetchAll(newPid). Whichever resolves last wins, so the
    // new playlist intermittently flashed "No tracks" / showed stale rows until
    // a hard reload. Gating on loadedHashCount > 0 hides the sentinel until the
    // switch's fetchAll has actually requested page 1 (cursor advanced, info.id
    // now correct), which kills the race while still paginating an
    // orphan-shortened OR all-orphan first page. Don't auto-load during a search.
    if (playlist.loadedHashCount > 0 && !playlist.allLoaded && !playlist.query) {
        body.push({
            id: 'tracks-fetcher',
            size: 1,
            component: AlbumsFetcher,
            props: {
                fetch_callback: () => playlist.fetchAll(playlist.info.id),
            },
        })
    }

    return [header, afterHeader, ...body]
})

async function onTrackDropped(_source: dropSources, _track: Track, newIndex: number, oldIndex: number) {
    playlist.moveTrack(oldIndex, newIndex)
    await reorderTracks(playlist.info.id, playlist.allTracks.map(t => t.trackhash))
}

async function playFromPlaylistPage(index: number) {
    const { name, id } = playlist.info

    if (!playlist.allLoaded) {
        // Load the complete tracklist before building the queue. Gate on
        // allLoaded (not tracks.length !== count): an orphan trackhash keeps
        // count > resolvable tracks forever, so the old gate re-fetched on
        // every play. Await so the queue is built from the complete list.
        await playlist.fetchAll(id, false, true)
    }

    tracklist.setFromPlaylist(name, id, playlist.allTracks)
    queue.play(index)
}

;[onMounted, onUpdated].forEach(() => {
    updatePageTitle(playlist.info.name)
})

onBeforeRouteLeave(() => playlist.resetAll())
</script>

<style lang="scss">
.playlist-virtual-scroller {
    .nothing {
        height: 25rem;
    }
}
</style>
