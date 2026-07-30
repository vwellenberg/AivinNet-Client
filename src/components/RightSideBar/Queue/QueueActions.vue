<template>
  <div class="queue-actions">
    <div class="left">
      <button v-if="!onNowPlaying" v-wave class="shuffle-queue action" @click="queue.shuffleQueue">
        <ShuffleSvg />
        <span>Shuffle</span>
      </button>
      <h2 v-else style="margin: 0">Now Playing</h2>
    </div>
    <div class="right">
      <button class="menu" :class="{ 'btn-active': context_showing }" @click="showContextMenu">
        <OptionsSvg />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import useQueue from "@/stores/queue";
import useTracklist from "@/stores/queue/tracklist";
import { ref } from "vue";

import { showQueueContextMenu } from "@/helpers/contextMenuHandler";

import OptionsSvg from "@/assets/icons/more.svg";
import ShuffleSvg from "@/assets/icons/shuffle.svg";

const queue = useQueue();
const { tracklist } = useTracklist();

const context_showing = ref(false);

function showContextMenu(e: MouseEvent) {
  if (!tracklist.length) return;

  showQueueContextMenu(e, context_showing);
}

defineProps<{
  onNowPlaying?: boolean;
}>();
</script>

<style lang="scss">
.queue-actions {
  display: flex;
  justify-content: space-between;
  gap: $small;
  margin: 1rem;
  margin-bottom: 0;

  // `.lyricsversion` used to live here; the template has not rendered it for a
  // long time, and its only remaining job was cancelling the global button
  // base's fill on a button that no longer exists.

  .left {
    display: flex;
    align-items: center;
    gap: $small;
  }

  // "Shuffle" — a labelled button, so the pill role. It used to get this look
  // from the global button base and only wrote down its padding.
  .action {
    @include btn-pill($h: 2.25rem);

    svg {
      transform: scale(0.8);
    }
  }

  .right {
    display: flex;
    gap: $medium;

    // Queue overflow menu.
    .menu {
      @include btn-action($size: 2.25rem);

      svg {
        transform: scale(1.2) rotate(90deg);
      }
    }

    // Open menu = yellow, the app-wide "active" signal. Kept out of the role
    // on purpose: blush there is the POINTER signal, and folding the two
    // together is what once made a pinned button look permanently hovered.
    .menu.btn-active {
      background-color: $mem-yellow;
      color: $mem-ink;
    }
  }
}
</style>
