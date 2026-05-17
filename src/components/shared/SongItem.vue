<template>
    <div
        class="songlist-item rounded-sm"
        :class="[{ current: isCurrent() }, { contexton: context_menu_showing }, dragOverClass]"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
        @dblclick="emitUpdate"
        @contextmenu.prevent="showMenu"
    >
        <div
            v-if="droppable && source === dropSources.playlist"
            class="drag-handle"
            draggable="true"
            @pointerdown.stop="onHandlePointerDown"
            @pointerup.stop="onHandlePointerUp"
            @click.stop
            @dragstart="onDragStart"
            @dragend="onDragEnd"
        >⠿</div>
        <TrackIndex
            v-if="!isSmall"
            :index="index"
            :is_fav="is_fav"
            :show-inline-fav-icon="settings.showInlineFavIcon"
            @add-to-fav="addToFav(track.trackhash)"
        />

        <TrackTitle
            :track="track"
            :is_current="isCurrent()"
            :is_current_playing="isCurrentPlaying()"
            @play="emitUpdate"
        />
        <div class="song-artists">
            <ArtistName :artists="track.artists" :albumartists="track.albumartists" />
        </div>

        <TrackAlbum
            :album="track.album || 'Unknown'"
            :albumhash="track.albumhash || ''"
            :hide_album="hide_album || false"
        />
        <TrackDuration
            :duration="track.duration || 0"
            :help_text="track.help_text"
            :is_fav="is_fav"
            :showFavIcon="!isFavoritesPage"
            :showInlineFavIcon="settings.showInlineFavIcon"
            :highlightFavoriteTracks="settings.highlightFavoriteTracks"
            @showMenu="showMenu"
            @toggleFav="addToFav(track.trackhash)"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { dropSources, favType } from '@/enums'
import { showTrackContextMenu as showContext } from '@/helpers/contextMenuHandler'
import favoriteHandler from '@/helpers/favoriteHandler'
import { Track } from '@/interfaces'
import { isSmall } from '@/stores/content-width'
import useQueueStore from '@/stores/queue'
import { showDragStart } from '@/utils/songItemMethods'

import ArtistName from './ArtistName.vue'
import TrackAlbum from './SongItem/TrackAlbum.vue'
import TrackDuration from './SongItem/TrackDuration.vue'
import TrackIndex from './SongItem/TrackIndex.vue'
import TrackTitle from './SongItem/TrackTitle.vue'
import useSettings from '@/stores/settings'

const settings = useSettings()
const context_menu_showing = ref(false)

const queue = useQueueStore()

const props = defineProps<{
    track: Track
    index: number | string
    hide_album?: boolean
    is_queue_track?: boolean
    droppable?: boolean
    is_last?: boolean
    source: dropSources
}>()

const is_fav = ref(props.track.is_favorite || false)

const emit = defineEmits<{
    (e: 'playThis'): void
    (e: 'trackDropped', source: dropSources, track: Track, newIndex: number, oldIndex: number): void
}>()

const dragOverTop = ref(false)
const dragOverBottom = ref(false)
const dragOverClass = computed(() => {
    if (dragOverTop.value) return 'drag-over-top'
    if (dragOverBottom.value) return 'drag-over-bottom'
    return ''
})

let isDragReady = false
let dragReadyTimeout: ReturnType<typeof setTimeout> | null = null

function onHandlePointerDown() {
    isDragReady = false
    dragReadyTimeout = setTimeout(() => {
        isDragReady = true
    }, 150)
}

function onHandlePointerUp() {
    if (dragReadyTimeout !== null) {
        clearTimeout(dragReadyTimeout)
        dragReadyTimeout = null
    }
    isDragReady = false
}

function onDragEnd() {
    isDragReady = false
    if (dragReadyTimeout !== null) {
        clearTimeout(dragReadyTimeout)
        dragReadyTimeout = null
    }
}

function onDragStart(e: DragEvent) {
    if (!isDragReady) {
        e.preventDefault()
        return
    }
    showDragStart(e, props.track, props.track.index, props.source)
}

function onDragOver(e: DragEvent) {
    const el = e.currentTarget as HTMLElement
    const mid = el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2
    if (e.clientY < mid) {
        dragOverTop.value = true
        dragOverBottom.value = false
    } else {
        dragOverTop.value = false
        dragOverBottom.value = true
    }
}

function onDragLeave() {
    dragOverTop.value = false
    dragOverBottom.value = false
}

function onDrop(e: DragEvent) {
    dragOverTop.value = false
    dragOverBottom.value = false
    const data = e.dataTransfer?.getData('swing-track')
    if (!data) return
    const { track, source, oldIndex } = JSON.parse(data) as {
        track: Track
        source: dropSources
        oldIndex: number
    }
    const el = e.currentTarget as HTMLElement
    const top = e.clientY < el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2
    const newIndex = top ? props.track.index : props.track.index + 1
    if (oldIndex === newIndex || oldIndex === newIndex - 1) return
    emit('trackDropped', source, track, newIndex, oldIndex)
}

function emitUpdate() {
    emit('playThis')
}

function showMenu(e: MouseEvent) {
    showContext(e, props.track, context_menu_showing)
}

function isCurrent() {
    if (props.is_queue_track) {
        return queue.currentindex == parseInt(props.index as string) - 1
    }

    return queue.currenttrackhash == props.track.trackhash
}

function isCurrentPlaying() {
    return isCurrent() && queue.playing
}

function addToFav(trackhash: string) {
    favoriteHandler(
        is_fav.value,
        favType.track,
        trackhash,
        () => (is_fav.value = true),
        () => (is_fav.value = false)
    )
}

const stopWatcher = watch(
    () => props.track.trackhash,
    () => {
        is_fav.value = props.track.is_favorite
    }
)

onBeforeUnmount(() => {
    stopWatcher()
})

const route = useRoute()
const isFavoritesPage = route.path.startsWith('/favorites')
</script>

<style lang="scss">
// NOTE: CSS for responsiveness is at app-grid.scss
.songlist-item {
    display: grid;
    grid-template-columns: 1.75rem 1.25fr 1fr 1fr 7.5rem;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
    font-weight: 500;
    line-height: 1.2;
    height: $song-item-height;
    user-select: none;
    padding-left: $small;
    position: relative;
    transition: background-color 0.2s ease-out;

    &:hover {
        background-color: $gray;

        .index.ready {
            .text {
                transition-delay: 400ms;

                transform: translateX(0);
                opacity: 0;
            }

            .heart-icon {
                transition-delay: 400ms;
                transform: translateX(0);
                opacity: 1;
                visibility: visible;
            }
        }

        .song-duration.has_help_text {
            opacity: 0;
        }

        // INFO: Show help text on hover
        .song-duration.help-text {
            opacity: 1;
        }

        .options-and-duration .heart-icon.showInlineFavIcon {
            display: block;
        }
    }

    .index {
        overflow: unset !important;

        .heart-icon {
            opacity: 0;
            visibility: hidden;
        }
    }

    .song-artists {
        width: fit-content;
        max-width: calc(100% - 10px);
    }
}

.songlist-item.current {
    background-color: $gray;
}

.songlist-item.contexton {
    background-color: $gray4 !important;
}

.songlist-item.drag-over-top {
    border-top: 2px solid $blue;
}

.songlist-item.drag-over-bottom {
    border-bottom: 2px solid $blue;
}

.songlist-item .drag-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1.75rem;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: grab;
    color: $gray2;
    font-size: 1.1rem;
    z-index: 1;
    user-select: none;
}

.songlist-item:hover .drag-handle {
    display: flex;
}
</style>
