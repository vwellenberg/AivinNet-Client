<template>
  <QueueActions />
  <div
    class="queue-virtual-scroller"
    @mouseover="mouseover = true"
    @mouseout="mouseover = false"
    @dragover="onScrollerDragOver"
    @dragleave="onScrollerDragLeave"
    @drop="stopAutoScroll"
    @dragend="stopAutoScroll"
  >
    <NoItems
      :flag="!store.tracklist.length"
      :title="'No songs in queue'"
      :description="'When you start playing songs, they will appear here.'"
      :icon="QueueSvg"
    />
    <RecycleScroller
      id="queue-scrollable"
      v-slot="{ item, index }"
      class="scroller"
      style="height: 100%"
      :items="scrollerItems"
      :item-size="itemHeight"
      key-field="id"
    >
      <TrackItem
        :index="index"
        :track="item.track"
        :is-current="index === queue.currentindex"
        :is-current-playing="index === queue.currentindex && queue.playing"
        :is-queue-track="true"
        :droppable="true"
        @playThis="playFromQueue(index)"
        @trackDropped="onTrackDropped"
      />
    </RecycleScroller>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import useQStore from "@/stores/queue";
import useInterface from "@/stores/interface";
import useTracklist from "@/stores/queue/tracklist";

import NoItems from "../shared/NoItems.vue";
import QueueActions from "./Queue/QueueActions.vue";
import TrackItem from "@/components/shared/TrackItem.vue";
import QueueSvg from "@/assets/icons/queue.svg";
import { dropSources } from "@/enums";
import { Track } from "@/interfaces";
import { createDragAutoScroller } from "@/utils/dragAutoScroll";

const itemHeight = 64;
const queue = useQStore();
const store = useTracklist();
const mouseover = ref(false);

const { focusCurrentInSidebar, setScrollFunction } = useInterface();

const scrollerItems = computed(() => {
  return store.tracklist.map((track, index) => ({
    track,
    id: index,
  }));
});

function playFromQueue(index: number) {
  queue.play(index);
}

function onTrackDropped(_source: dropSources, _track: Track, newIndex: number, oldIndex: number) {
  stopAutoScroll();
  store.moveTrack(oldIndex, newIndex);
}

// Edge auto-scroll while reordering, same as the playlist page: the browser
// does not scroll a container during a native drag, so moving a track from the
// bottom of a long queue to the top would otherwise mean dragging and scrolling
// at the same time.
const autoScroller = createDragAutoScroller(() => document.getElementById("queue-scrollable"));

function onScrollerDragOver(e: DragEvent) {
  autoScroller.update(e.clientY);
}

function onScrollerDragLeave(e: DragEvent) {
  // dragleave bubbles up from every row the pointer crosses; only stop once the
  // pointer has truly left the scroller.
  const container = e.currentTarget as HTMLElement;
  const related = e.relatedTarget as Node | null;
  if (related && container.contains(related)) return;
  stopAutoScroll();
}

function stopAutoScroll() {
  autoScroller.stop();
}

const show_above = 1; // the number of tracks to show above the current track

function scrollToCurrent() {
  const elem = document.getElementById("queue-scrollable") as HTMLElement;

  const top = (queue.currentindex - show_above) * itemHeight;
  elem.scroll({
    top,
    behavior: "smooth",
  });
}

onMounted(() => {
  setScrollFunction(scrollToCurrent, mouseover);
  focusCurrentInSidebar();
});

onBeforeUnmount(() => {
  setScrollFunction(() => {}, null);
  stopAutoScroll();
});
</script>

<style lang="scss">
.queue-virtual-scroller {
  height: 100%;
  overflow: hidden;

  // The queue is a white panel, so the "No songs in queue" empty state must
  // keep ink text (NoItems defaults to the theme-aware ground colour, which
  // would go white-on-white here in dark mode).
  .nothing {
    color: $candy-text;

    p {
      color: $candy-text-muted;
    }
  }
}
</style>
