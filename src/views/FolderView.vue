<template>
    <div class="folder-view v-scroll-page" style="height: 100%" :class="{ isSmall, isMedium, is_alt_layout }">
        <NoItems
            :flag="folder.tracks.length === 0 && folder.dirs.length === 0"
            :title="folder.query === '' ? 'Folder is empty' : 'No results found'"
            :description="
                folder.query === ''
                    ? 'The folder you are trying to access has no indexed tracks. Please add tracks to this folder and try again'
                    : `
      No tracks or folders in this immediate directory matched the query: '${folder.query}'`
            "
            :icon="FolderSvg"
        />
        <DynamicScroller
            id="contentscroller"
            :items="scrollerItems"
            :min-item-size="72"
            class="scroller"
            style="height: 100%"
        >
            <template #before v-if="is_alt_layout || isMedium || isSmall">
                <Folder />
            </template>

            <template #default="{ item, index, active }">
                <DynamicScrollerItem
                    :item="item"
                    :active="active"
                    :size-dependencies="[item.props]"
                    :data-index="index"
                >
                    <component
                        :is="item.component"
                        :key="index"
                        v-bind="item.props"
                        @playThis="playFromPage(item.props.index - 1)"
                    ></component>
                </DynamicScrollerItem>
            </template>
        </DynamicScroller>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'

import { isMedium, isSmall, track_limit } from '@/stores/content-width'
import useFolder from '@/stores/pages/folder'
import useQueue from '@/stores/queue'
import useTracklist from '@/stores/queue/tracklist'
import useSettings from '@/stores/settings'

import { dropSources } from '@/enums'
import { Track, subPath } from '@/interfaces'
import { createTrackProps } from '@/utils'
import updatePageTitle from '@/utils/updatePageTitle'

import FolderSvg from '@/assets/icons/folder.svg'
import FolderList from '@/components/FolderView/FolderList.vue'
import Folder from '@/components/nav/Titles/Folder.vue'
import NoItems from '@/components/shared/NoItems.vue'
import SongItem from '@/components/shared/SongItem.vue'
import { xl } from '@/composables/useBreakpoints'
import AlbumsFetcher from '@/components/ArtistView/AlbumsFetcher.vue'
import { getFiles } from '@/requests/folders'
import { trackBandFade } from '@/utils/songItemMethods'

const queue = useQueue()
const folder = useFolder()
const settings = useSettings()
const tracklist = useTracklist()

const is_alt_layout = computed(() => settings.is_alt_layout || !xl)

interface ScrollerItem {
    id: any
    component: typeof FolderList | typeof SongItem | typeof AlbumsFetcher
    props: any
}

class songItem {
    id: string | undefined
    props: any
    component = SongItem

    constructor(track: Track, is_first = false, is_last = false, band_fade = 1) {
        this.id = track.filepath
        this.props = { ...createTrackProps(track), is_first, is_last, source: dropSources.folder, band_fade }
    }
}

const scrollerItems = computed(() => {
    const items: ScrollerItem[] = []

    if (folder.dirs.length) {
        items.push({
            id: 'folder-list',
            component: FolderList,
            props: {
                folders: folder.dirs,
            },
        })
    }

    folder.tracks.forEach((track, i) => {
        // trackTotal is the folder's REAL count; the loaded window grows page
        // by page, and normalising against it would re-shade every row on each
        // fetch.
        items.push(new songItem(track, i === 0, i === folder.tracks.length - 1, trackBandFade(i + 1, folder.trackTotal)))
    })

    if (folder.tracks.length >= track_limit.value) {
        items.push({
            id: Math.random(),
            component: AlbumsFetcher,
            props: {
                fetch_callback: () => folder.fetchAll(folder.path),
            },
        })
    }

    return items
})

async function playFromPage(index: number) {
    let tracks = folder.allTracks

    if (folder.trackTotal !== folder.allTracks.length) {
        const { tracks: newTracks } = await getFiles(folder.path, 0, -1, true, {
            sorttracksby: folder.trackSortBy,
            tracksort_reverse: folder.trackSortReverse,
            sortfoldersby: folder.folderSortBy,
            foldersort_reverse: folder.folderSortReverse,
        })
        tracks = newTracks
    }

    tracklist.setFromFolder(folder.path, tracks)
    queue.play(index)
}

onBeforeRouteUpdate((to, from) => {
    folder
        .fetchAll(to.params.path as string, true)

        .then(() => {
            folder.resetQuery()
        })
        .then(async () => {
            await nextTick()

            document.getElementById('contentscroller')?.scrollTo({
                top: 0,
            })
        })
})

onBeforeRouteLeave(() => {
    folder.resetAll()
})

onMounted(() => {
    updatePageTitle('Folders')
})
</script>

<style lang="scss">
.folder-view.is_alt_layout {
    .scroller {
        // Same gap the head keeps below itself, and the head's `top` matches it
        // so the plate does not jump the moment it starts sticking. It used to
        // be `0`, because the head was meant to bleed into the card's top edge.
        padding-top: $small !important;
    }

    // This wrapper only carries the sticky behaviour and the gap to the rows —
    // the plate itself is the head inside it (see below). The gap has to be
    // PADDING, not a margin: the DynamicScroller places its rows from the
    // measured slot height and never sees a margin, so a margin would leave the
    // first row flush against the plate's frame, printing a double rule.
    .scroller > div.vue-recycle-scroller__slot:first-child {
        padding-bottom: $small;
        position: sticky;
        // Matches the scroller's top padding: the plate keeps the same distance
        // from the card's frame at rest and while stuck, so it does not jump.
        top: $small;
        z-index: 1;
    }

    // The breadcrumb head is CHROME over a scrolling list, so it wears the plate
    // anatomy every other sticky head wears (see LyricsView/Head.vue): opaque
    // panel surface, an ink frame on ALL FOUR sides, the shared radius and the
    // offset shadow. Opaque matters twice over — rows pass behind it, and the
    // veil would show them through its own text.
    //
    // It used to be a bare $mem-ground fill on the wrapper with nothing but a
    // `border-bottom`. A single line only reads as an edge when it runs into the
    // card's frame at both ends, and this one never could: the scroller carries
    // $alt_layout_pad of side padding, so the line stopped 44px short of the ink
    // frame on each side and floated there. Three pixels below it the folder
    // plate opened its OWN frame, so the two printed as one 6px double rule.
    // Hence a closed plate instead of half an edge.
    #folder-nav-title {
        padding: $small $medium;
        background-color: $mem-panel;
        border: $candy-border;
        border-radius: $candy-radius;
        @include candy-shadow(3px, 3px);
    }
}
</style>
