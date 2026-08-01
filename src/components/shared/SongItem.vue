<template>
    <div
        class="songlist-item rounded-sm"
        :class="[
            { current: isCurrent() },
            { contexton: context_menu_showing },
            { 'with-plays': showPlaysColumn },
            { 'with-date': showDateColumn },
            { 'is-first': is_first },
            { 'is-last': is_last },
            dragOverClass,
        ]"
        :draggable="droppable"
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
    // Opt in to reordering by drag. This alone decides it: the `draggable`
    // binding used to additionally require `source === playlist`, which quietly
    // made the flag a no-op everywhere else — the Now Playing queue set
    // `droppable` and still could not be dragged. Every call site that passes
    // the flag means it.
    droppable?: boolean
    // First/last row of a list section — closes the ink frame around the
    // translucent list plate (top/bottom edge + corner radii).
    is_first?: boolean
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
    // Read the rect ONCE (was twice): dragover fires continuously on every
    // recycled row the pointer crosses, and each getBoundingClientRect() forces
    // a synchronous layout — doubly expensive while the virtual scroller is
    // recycling rows during a drag-scroll. Only write the refs when the side
    // actually flips so we don't churn the class-patch cycle.
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const top = e.clientY < rect.top + rect.height / 2
    if (dragOverTop.value !== top) dragOverTop.value = top
    if (dragOverBottom.value !== !top) dragOverBottom.value = !top
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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const top = e.clientY < rect.top + rect.height / 2
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
    // Reserved transparent border so the ink frame on hover/marked/playing rows
    // never shifts the content. (app-grid.scss zeroes the radius again for the
    // middle rows of the list plate — the frame there is continuous.)
    @include candy-row-base;

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
        // The app-wide row hover (see candy-row-hover): static-light fill so the
        // pinned ink text below stays readable in dark, inside the ink frame.
        @include candy-row-hover;

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
    // Fill, frame and the zigzag marker on the leading edge all come from the
    // one mixin the queue row uses too — see mem-now-playing-row in _candy.scss.
    @include mem-now-playing-row;
}

.songlist-item.contexton {
    // Same frame as hover, but with the soft-blush fill that marks "this row owns
    // the open context menu". Static light so the pinned ink text reads in dark.
    @include candy-row-hover($mem-blush-soft-static);
    background-color: $mem-blush-soft-static !important;
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
        color: $mem-text-muted-static;
    }

    .options-and-duration {
        .heart-icon.is_fav svg {
            // Teal "favorited" accent reads on the light row fills too.
            color: $mem-teal;
        }

        .options-icon svg {
            stroke: $mem-text-muted-static;
        }
    }

    // Unfavorited add/fav glyph declares its own adaptive colour (paper in
    // dark) — pin ink on the light row fills.
    //
    // `:not(.is-fav)` states what the comment already said. The favourited
    // glyph owns its fill (teal), and this selector outranks `.heart-button.is-fav`
    // by the row's own class — so without the exclusion the marker's disc would
    // go ink here and, since its tick is ink too, read as a solid blob.
    .heart-button:not(.is-fav) {
        color: $mem-ink;
    }
}

.songlist-item.drag-over-top {
    border-top: 2px solid $mem-line;
}

.songlist-item.drag-over-bottom {
    border-bottom: 2px solid $mem-line;
}

.songlist-item[draggable="true"] {
    cursor: grab;
    &:active { cursor: grabbing; }
}
</style>
