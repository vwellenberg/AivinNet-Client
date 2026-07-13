<template>
  <div class="now-playing-info">
    <div class="text">
      <div class="title">{{ queue.currenttrack?.title || "AivinNet" }}</div>
      <ArtistName
        v-if="queue.currenttrack"
        :artists="queue.currenttrack?.artists || null"
        :albumartists="queue.currenttrack?.albumartists || ''"
      />
      <span v-else class="artist author">
        <a href="https://github.com/mungai-njoroge" target="_blank">built by @mungai-njoroge ↗</a>
      </span>
    </div>
    <div class="actions">
      <HeartSvg :state="queue.currenttrack?.is_favorite" @handle-fav="$emit('handleFav', queue.currenttrackhash)" />
      <OptionSvg class="optionsvg" :class="{ context_menu_showing }" @click="showMenu" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import ArtistName from "../shared/ArtistName.vue";
import HeartSvg from "../shared/HeartSvg.vue";

import OptionSvg from "@/assets/icons/more.svg";
import { showTrackContextMenu } from "@/helpers/contextMenuHandler";
import useQueueStore from "@/stores/queue";

const context_menu_showing = ref(false);

const queue = useQueueStore();

defineEmits<{
  (e: "handleFav", trackhash: string): void;
}>();

function showMenu(e: MouseEvent) {
  if (!queue.currenttrack) return;

  showTrackContextMenu(e, queue.currenttrack, context_menu_showing);
}
</script>

<style lang="scss">
.now-playing-info {
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: 1rem;
  margin-top: 1rem;
  font-weight: 500;

  .artist {
    font-size: 0.8rem;
    color: $candy-text-muted;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 1rem;

    .optionsvg {
      transform: scale(1.5) rotate(90deg);
      border-radius: $small;
      transition: background-color 0.2s ease-out;

      &:hover {
        background-color: $candy-pink-soft;
        cursor: pointer;
      }
    }

    svg.context_menu_showing {
      background-color: $candy-pink-soft;
    }
  }

  .heart-button {
    background-color: transparent;
    transition: background-color 0.2s ease-out;

    &:hover {
      background-color: $candy-pink-soft;
    }
  }

  .author {
    & > * {
      color: $candy-text-muted !important;
    }
  }
}
</style>
