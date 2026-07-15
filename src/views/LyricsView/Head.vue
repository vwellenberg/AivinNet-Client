<template>
  <div v-if="queue.currenttrack" class="lyricsinfo">
    <RouterLink
      :to="{
        name: Routes.album,
        params: {
          albumhash: queue.currenttrack.albumhash,
        },
      }"
    >
      <img :src="paths.images.thumb.small + queue.currenttrack.image" class="shadow-sm" />
    </RouterLink>

    <div class="text">
      <div class="title ellip">{{ queue.currenttrack.title }}</div>
      <ArtistName :artists="queue.currenttrack.artists" :albumartists="queue.currenttrack.albumartists" />
    </div>
    <div class="right">
      <div v-if="lyrics.lyrics.length && !lyrics.synced" class="lyricstype">unsynced</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useLyrics from "@/stores/lyrics";
import useQueue from "@/stores/queue";

import ArtistName from "@/components/shared/ArtistName.vue";
import { paths } from "@/config";
import { Routes } from "@/router";

const queue = useQueue();
const lyrics = useLyrics();
</script>

<style lang="scss">
.lyricsinfo {
  padding: 2rem 0 1rem 0;
  font-size: 1rem;
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  gap: $medium;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1;
  // Opaque paper band over the scrolling grid ground (lyrics pass behind it),
  // with a hard ink bottom edge like the folder breadcrumb band.
  background-color: $mem-paper;
  border-bottom: $candy-border;

  @include allPhones {
    padding: $large 0;
    margin-bottom: -$small;
  }

  img {
    display: block;
    height: 2.5rem;
    border: $candy-border;
    border-radius: $candy-radius-sm;
  }

  .title {
    font-size: 0.85rem;
  }

  .artist {
    font-size: 0.8rem;
  }

  .lyricstype {
    border-radius: $candy-radius-pill;
    border: 1px solid $candy-black;
    font-size: 12px;
    padding: $smaller $small;
    background-color: $candy-lavender;
    color: $candy-black;
  }
}
</style>
