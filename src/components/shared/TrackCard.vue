<template>
  <RouterLink
    :to="{
      name: Routes.album,
      params: {
        albumhash: track.albumhash,
      },
    }"
    class="trackcard rounded"
  >
    <div class="image">
      <img class="rounded-sm" :src="paths.images.thumb.large + track.image" />
      <PlayBtn :source="playSource" :track="track" />
    </div>
    <div class="tinfo">
      <div v-if="track.help_text" class="rhelp track">
        <span class="help">{{ track.help_text }}</span>
        <span class="time">{{ track.time }}</span>
      </div>
      <div class="ttitle ellip">{{ track.title }}</div>
      <ArtistName :albumartists="track.albumartists" :artists="track.artists" />
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { paths } from "@/config";
import { playSources } from "@/enums";
import { Track } from "@/interfaces";

import { Routes } from "@/router";
import ArtistName from "../shared/ArtistName.vue";
import PlayBtn from "../shared/PlayBtn.vue";

defineProps<{
  track: Track;
  playSource: playSources;
}>();

defineEmits<{
  playThis: (index: number) => void;
}>();
</script>

<style lang="scss">
.trackcard {
  padding: $medium;
  cursor: pointer;
  height: max-content;
  transition: background-color 0.2s ease-out;
  @include candy-box($mem-panel, $candy-radius);

  .image {
    position: relative;
    margin-bottom: $small;
  }

  @include card-play-btn;

  &:hover {
    background-color: $mem-blush;
  }

  .ttitle {
    font-weight: 700;
    font-size: 0.95rem;
    color: $candy-text;
  }

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border: $candy-border;
    border-radius: $candy-radius-sm;
  }

  .artist {
    font-size: 0.8rem;
    font-weight: 500;
    color: $candy-text-muted;
  }
}
</style>
