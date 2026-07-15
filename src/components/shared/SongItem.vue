<template>
    <div
        class="songlist-item rounded-sm"
        :class="[
            { current: isCurrent() },
            { contexton: context_menu_showing },
            { 'with-plays': showPlaysColumn },
            { 'with-date': showDateColumn },
            dragOverClass,
        ]"
        :draggable="droppable && source === dropSources.playlist"
        @dragstart="onDragStart"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
        @dblclick="emitUpdate"
        @contextmenu.prevent="showMenu"
    >
        <TrackIndex
            v-if="!isSmall"
            :index="index"
            :is_fav="is_fav"
            :is_current="isCurrent()"
            :is_current_playing="isCurrentPlaying()"
            :show-inline-fav-icon="settings.showInlineFavIcon"
            @add-to-fav="addToFav(track.trackhash)"
        />

        <TrackTitle
            :track="track"
            :is_current="isCurrent()"
            @play="emitUpdate"
        />

        <TrackAlbum
            :album="track.album || 'Unknown'"
            :albumhash="track.albumhash || ''"
            :hide_album="hide_album || false"
        />
        <TrackPlays v-if="showPlaysColumn" :playcount="track.playcount" />
        <TrackDateAdded v-if="showDateColumn" :timestamp="track.added_at" />
        <!--
            When the Plays column is shown (artist Top Tracks, wide layout) the
            play count is already visible, so suppress the duration's hover
            help_text ("N plays") to avoid showing the same number twice. On
            narrow layouts (no Plays column) help_text stays as the only way to
            surface the count.
        -->
        <TrackDuration
            :duration="track.duration || 0"
            :help_text="showPlaysColumn ? undefined : track.help_text"
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
import { isMedium, isSmall } from '@/stores/content-width'
import useQueueStore from '@/stores/queue'
import { showDragStart } from '@/utils/songItemMethods'

import TrackAlbum from './SongItem/TrackAlbum.vue'
import TrackDateAdded from './SongItem/TrackDateAdded.vue'
import TrackDuration from './SongItem/TrackDuration.vue'
import TrackIndex from './SongItem/TrackIndex.vue'
import TrackPlays from './SongItem/TrackPlays.vue'
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
    show_plays?: boolean
    show_date_added?: boolean
}>()

// Plays column is opt-in (artist "Popular"/Top Tracks) and hidden on narrow
// layouts. Gating both the class and the child on the same condition keeps the
// grid column count in sync with the rendered children.
const showPlaysColumn = computed(() => Boolean(props.show_plays) && !isSmall.value && !isMedium.value)

// "Date added" column is opt-in (playlist page only — mixes and the custom
// recently added/played playlists have no per-track added_at) and hidden on
// narrow layouts, following the same pattern as the Plays column.
const showDateColumn = computed(() => Boolean(props.show_date_added) && !isSmall.value && !isMedium.value)

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

function onDragStart(e: DragEvent) {
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
    grid-template-columns: 1.75rem 2.5fr 1.5fr 7.5rem;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
    font-weight: 500;
    line-height: 1.2;
    height: $song-item-height;
    user-select: none;
    padding-left: $small;
    position: relative;
    // Text sits directly on the page ground (grid area) -> theme-aware so it
    // turns white on the dark indigo ground. Filled row states (hover/current/
    // contexton) pin ink below (see the combined selector after this rule).
    color: $mem-content-text;
    // Transparent placeholder so the ink box on hover/marked/playing rows
    // never shifts the content.
    border: $candy-border-w solid transparent;
    transition: background-color 0.2s ease-out;

    // Plays column (issue #68): inserted between album and duration. Only set
    // on wide layouts (the .with-plays class is toggled off on isSmall/isMedium
    // together with the TrackPlays child), so it never clashes with the
    // responsive grids in app-grid.scss.
    //
    // The duration column is wider here (10rem vs the default 7.5rem): on
    // favorited rows the green check-circle is shown inline in that column, and
    // at 7.5rem the check + duration + options overflowed left over the Plays
    // number (justify-content: end). 10rem keeps the check inside its own column
    // with enough headroom for the longest (HH:MM:SS) durations.
    &.with-plays {
        grid-template-columns: 1.75rem 2.5fr 1.5fr 5rem 10rem;
    }

    // "Date added" column (playlist page): inserted between album and duration,
    // same rationale as .with-plays above. The date column fits the longest
    // absolute date ("Sep 28, 2026"); the duration column keeps the 10rem
    // headroom for the inline favorite check-circle. Shared with the
    // AfterHeader caption row via $songlist-columns-with-date.
    &.with-date {
        grid-template-columns: $songlist-columns-with-date;
    }

    &:hover {
        background-color: $candy-white;
        border-color: $candy-black;
        border-radius: $candy-radius-sm;

        .song-duration.has_help_text {
            opacity: 0;
        }

        .song-duration.help-text {
            opacity: 1;
        }

        .options-and-duration .heart-icon {
            visibility: visible;
        }

        .thumbnail .album-art {
            filter: brightness(0.55);
        }

        .thumb-play-overlay {
            opacity: 1 !important;
        }
    }

    .index {
        overflow: unset !important;
    }
}

.songlist-item.current {
    background-color: $mem-yellow;
    border: $candy-border;
    border-radius: $candy-radius-sm;
    overflow: hidden;

    // Signature memphis accent: a bunting-style zigzag strip along the bottom
    // edge of the currently-playing row.
    &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 9px;
        pointer-events: none;
        @include mem-zigzag($mem-ink);
    }
}

.songlist-item.contexton {
    background-color: $candy-pink-soft !important;
    // Consistent with hover/playing rows: marked rows always carry the ink box.
    border-color: $candy-black;
    border-radius: $candy-radius-sm;
}

// Filled row states (white hover / yellow playing / blush marked): the base
// row text is $mem-content-text (white on the dark ground), so pin ink for the
// text and icons that now render over a light fill. The muted children carry
// explicit content tokens (album/duration) that the row `color` can't cascade
// into, so they get explicit ink-muted here; the opacity-based children
// (index/plays/date/artist) inherit the row ink automatically.
.songlist-item:hover,
.songlist-item.current,
.songlist-item.contexton {
    color: $mem-ink;

    .song-album,
    .song-duration {
        color: $mem-text-muted;
    }

    .options-and-duration {
        .heart-icon.is_fav svg {
            color: $mem-ink;
        }

        .options-icon svg {
            stroke: $mem-text-muted;
        }
    }
}

.songlist-item.drag-over-top {
    border-top: 2px solid $candy-black;
}

.songlist-item.drag-over-bottom {
    border-bottom: 2px solid $candy-black;
}

.songlist-item[draggable="true"] {
    cursor: grab;
    &:active { cursor: grabbing; }
}
</style>
