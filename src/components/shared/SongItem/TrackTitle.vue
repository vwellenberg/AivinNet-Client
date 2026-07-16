<template>
  <div class="tracktitle flex">
    <div class="thumbnail" @click.prevent="$emit('play')">
      <img :src="imguri + track.image" class="album-art image rounded-sm" />
      <div class="thumb-play-overlay" v-if="!is_current">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </div>
    </div>
    <div v-tooltip class="song-title">
      <div class="with-flag" @click.prevent="$emit('play')">
        <span class="title ellip" :class="{ 'is-current': is_current }">
          {{ track.title }}
        </span>
        <ExplicitIcon  class="explicit-icon" v-if="track.explicit" />
        <MasterFlag :bitrate="track.bitrate" />
      </div>
      <div class="isSmallArtists">
        <ArtistName :artists="track.artists" :albumartists="track.albumartists" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Track } from "@/interfaces";
const imguri = paths.images.thumb.small;

import ArtistName from "../ArtistName.vue";
import MasterFlag from "../MasterFlag.vue";
import ExplicitIcon from "@/assets/icons/explicit.svg";

import { paths } from "@/config";

defineProps<{
  track: Track;
  is_current: boolean;
}>();

defineEmits<{
  (e: "play"): void;
}>();
</script>

<style lang="scss">
.songlist-item > .tracktitle {
  position: relative;
  align-items: center;

  .explicit-icon {
    margin-left: $small;
  }

  .thumbnail {
    margin-right: $medium;
    display: flex;
    position: relative;
    flex-shrink: 0;

    .album-art {
      width: 3rem;
      height: 3rem;
      object-fit: contain;
      cursor: pointer;
      z-index: 20;
      border: 1px solid $mem-line;
      border-radius: $candy-radius-sm;
      transition: filter 0.15s ease;
    }

    .thumb-play-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      z-index: 30;
      pointer-events: none;
      transition: opacity 0.15s ease;

      svg {
        width: 1.4rem;
        height: 1.4rem;
        color: white;
        filter: drop-shadow(0 1px 3px rgba(0,0,0,0.6));
      }
    }

    @include smallerPhones {
      margin-right: $small;
    }
  }

  .song-title > .isSmallArtists {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: small;
    opacity: 0.67;
  }

  .song-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    cursor: pointer;

    .with-flag {
      display: flex;
      align-items: center;
    }

    .title {
      font-weight: 600;
    }

    // Highlight the title of the currently-playing track (issue #67). This
    // title always sits on the .current (yellow) row, so pin static ink.
    .title.is-current {
      color: $mem-ink;
    }
  }
}
</style>
