<template>
  <div
    v-wave
    class="track-item"
    :class="[
      {
        currentInQueue: isCurrent,
      },
      { contexton: context_on },
      dragOverClass,
    ]"
    :draggable="droppable"
    @click="playThis(track)"
    @contextmenu.prevent="showMenu"
    @dragstart="onDragStart"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="album-art">
      <!-- draggable=false so the row, not the cover, is what gets dragged: an
           <img> is natively draggable and would otherwise win the gesture. -->
      <img :src="paths.images.thumb.small + track.image" class="rounded-sm" draggable="false" />
      <div v-if="isCurrent" class="now-playing-track-indicator image" :class="{ last_played: !isCurrentPlaying }"></div>
    </div>
    <div class="tags">
      <div v-tooltip class="title">
        <span class="ellip">
          {{ track.title }}
        </span>
      </div>
      <hr />
      <div class="artist">
        <ArtistName :artists="track.artists" :albumartists="track.albumartists" :smaller="true" />
      </div>
    </div>
    <div class="float-buttons flex">
      <div
        class="fav-icon"
        :title="is_fav ? 'Add to favorites' : 'Remove from favorites'"
        @click.stop="() => addToFav(track.trackhash)"
      >
        <HeartSvg :state="is_fav" :no_emit="true" />
      </div>
      <div v-if="isQueueTrack" class="remove-track" title="Remove from queue" @click.stop="player.removeByIndex(index ?? 0)">
        <DelSvg />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import useTracklist from "@/stores/queue/tracklist";

import { paths } from "@/config";
import { dropSources, favType } from "@/enums";
import { showTrackContextMenu as showContext } from "@/helpers/contextMenuHandler";
import favoriteHandler from "@/helpers/favoriteHandler";
import { Track } from "@/interfaces";
import { showDragStart } from "@/utils/songItemMethods";

import DelSvg from "@/assets/icons/plus.svg";
import ArtistName from "./ArtistName.vue";
import HeartSvg from "./HeartSvg.vue";

const props = defineProps<{
  track: Track;
  isCurrent: boolean;
  isCurrentPlaying: boolean;
  isQueueTrack?: boolean;
  index?: number;
  /** Opt in to reordering by drag. Only the queue panel does. */
  droppable?: boolean;
}>();

const player = useTracklist();

const context_on = ref(false);
const is_fav = ref(props.track.is_favorite);

function showMenu(e: MouseEvent) {
  showContext(e, props.track, context_on);
}

const emit = defineEmits<{
  (e: "playThis"): void;
  (e: "trackDropped", source: dropSources, track: Track, newIndex: number, oldIndex: number): void;
}>();

const playThis = (track: Track) => {
  emit("playThis");
};

// --- reordering by drag (queue panel) --------------------------------------
// Mirrors SongItem's drag handling with one difference that matters: the index
// carried through the drag is the `index` PROP (the row's position in the
// queue), not `track.index`. The latter is the refIndex into whatever list the
// track originally came from and says nothing about where it sits in the queue.
const dragOverTop = ref(false);
const dragOverBottom = ref(false);
const dragOverClass = computed(() => {
  if (dragOverTop.value) return "drag-over-top";
  if (dragOverBottom.value) return "drag-over-bottom";
  return "";
});

function onDragStart(e: DragEvent) {
  // Guarded even though `draggable` is only set when droppable: the row holds a
  // natively draggable <img>, so a drag begun on the cover art fires dragstart
  // here on rows that never opted in (the search results use TrackItem too).
  // Unguarded, that drag would announce itself as a queue row with index 0.
  if (!props.droppable) return;
  showDragStart(e, props.track, props.index ?? 0, dropSources.queue);
}

function onDragOver(e: DragEvent) {
  if (!props.droppable) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const top = e.clientY < rect.top + rect.height / 2;
  if (dragOverTop.value !== top) dragOverTop.value = top;
  if (dragOverBottom.value !== !top) dragOverBottom.value = !top;
}

function onDragLeave() {
  dragOverTop.value = false;
  dragOverBottom.value = false;
}

function onDrop(e: DragEvent) {
  dragOverTop.value = false;
  dragOverBottom.value = false;
  if (!props.droppable) return;

  const data = e.dataTransfer?.getData("swing-track");
  if (!data) return;

  const { track, source, oldIndex } = JSON.parse(data) as {
    track: Track;
    source: dropSources;
    oldIndex: number;
  };

  // A row dragged in from a page carries an index into THAT list; treating it
  // as a queue position would reorder the wrong track.
  if (source !== dropSources.queue) return;

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const top = e.clientY < rect.top + rect.height / 2;
  const own = props.index ?? 0;
  const newIndex = top ? own : own + 1;
  if (oldIndex === newIndex || oldIndex === newIndex - 1) return;

  emit("trackDropped", source, track, newIndex, oldIndex);
}

function addToFav(trackhash: string) {
  favoriteHandler(
    is_fav.value,
    favType.track,
    trackhash,
    () => (is_fav.value = true),
    () => (is_fav.value = false)
  );
}

const stop = watch(
  () => props.track.is_favorite,
  (newValue) => {
    is_fav.value = newValue;
  }
);

onBeforeUnmount(() => {
  stop();
});
</script>

<style lang="scss">
.track-item.currentInQueue {
  // Fill, frame and the zigzag marker on the leading edge all come from the
  // one mixin the song-list row uses too — see mem-now-playing-row in
  // _candy.scss.
  @include mem-now-playing-row;
  // Absorb the 2px border into the queue's fixed 64px row slot.
  padding-top: calc(#{$small} - #{$candy-border-w});
  padding-bottom: calc(#{$small} - #{$candy-border-w});

  // Full strength on the playing row, same call as in SongItem.vue: the
  // sprinkle costs the dimmed artist line its legibility first, and this is
  // the row being read.
  .tags .title {
    font-weight: 700;
  }

  .artist {
    opacity: 1;
  }
}

.contexton {
  background-color: $candy-pink-soft;
  // Same ink box as hover/playing rows — marked rows are always framed.
  border: $candy-border;
  border-radius: $candy-radius-sm;
}

.track-item {
  display: grid;
  grid-template-columns: min-content 1fr max-content;
  align-items: center;
  padding: $small 1rem;
  transition: background-color 0.2s ease-out;
  // Anchor for the drop marker below. `.currentInQueue` already sets this; the
  // base row needs it too or the marker would position against the scroller.
  position: relative;

  .tags {
    .title {
      width: fit-content;
      font-weight: 600;
    }
  }

  .float-buttons {
    opacity: 0;
    gap: $small;
    & > * {
      cursor: pointer;
    }

    .heart-button {
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      background-color: transparent;

      // The UNFAVOURITED plus only. This selector (0,2,1) outranks
      // `.heart-button.is-fav` (0,2,0), so written bare it also repainted the
      // favourite marker — a favourited queue track has been drawing ink
      // instead of teal, telling the two states apart by shape alone. With the
      // marker's tick now ink as well, that would have flattened it to a blob.
      &:not(.is-fav) svg {
        color: $candy-black;
      }
    }

    .remove-track {
      transform: rotate(45deg);
      height: 2rem;
      width: 2rem;

      display: grid;
      place-items: center;

      &:hover {
        border-radius: 1rem;
      }
    }

    &:hover {
      opacity: 1 !important;
    }
  }

  &:hover {
    .float-buttons {
      opacity: 1;
    }

    .remove-track {
      transform: translateY(0) rotate(45deg);
    }

    background-color: $candy-pink-soft;
    border-radius: $candy-radius-sm;
  }

  hr {
    border: none;
    margin: 0.1rem;
  }

  .album-art {
    display: flex;
    align-items: center;
    justify-content: center;

    margin-right: $medium;
    position: relative;

    .now-playing-track-indicator {
      position: absolute;
    }
  }

  img {
    width: 3rem;
    height: 3rem;
    object-fit: contain;
    border: 1px solid $mem-line;
    border-radius: $candy-radius-sm;
  }

  .artist {
    opacity: 0.67;
    width: fit-content;
    font-weight: 700;
  }
}

.track-item[draggable="true"] {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

// Drop marker. An inset box-shadow rather than a border or a pseudo-element.
//
// A real border is out because this row reserves none up front (unlike the song
// rows): it would shift the row by 3px the moment the pointer crosses it. A
// pseudo-element is out because BOTH of them belong to the playing state now —
// `mem-now-playing-row` paints the sprinkle on ::before and the leading-edge
// marker on ::after, and the playing row is a perfectly ordinary drop target.
// An inset shadow costs no layout and no element.
.track-item.drag-over-top {
  box-shadow: inset 0 #{$candy-border-w} 0 $mem-line;
}

.track-item.drag-over-bottom {
  box-shadow: inset 0 #{-$candy-border-w} 0 $mem-line;
}
</style>
