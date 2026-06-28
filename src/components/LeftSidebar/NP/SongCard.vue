<template>
  <Motion
    :key="q.currenttrack?.trackhash"
    :initial="{ opacity: 0, scale: 0.9 }"
    :animate="{
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'ease-in' },
    }"
    :exit="{ opacity: 0, scale: 0.9 }"
  >
    <div
      v-wave
      class="sidebar-songcard lauflicht-rim rounded-sm"
      :style="{ '--np-accent': colors.theme1 || '#FF284E' }"
    >
      <router-link
        :to="{
          name: Routes.nowPlaying,
          params: {
            tab: 'home',
          },
        }"
      >
        <img
          :src="imguri + q.currenttrack?.image"
          alt=""
          class="l-image rounded-sm"
        />
      </router-link>
      <Bitrate />
    </div>
  </Motion>
</template>

<script setup lang="ts">
import { Motion } from "motion/vue";
import { Routes } from "@/router";

import { paths } from "@/config";
import useColorStore from "@/stores/colors";
import useQueueStore from "@/stores/queue";

import Bitrate from "./Bitrate.vue";

const imguri = paths.images.thumb.medium;
const q = useQueueStore();
// Cover accent of the current track (LightVibrant, set per track in
// stores/player.ts). Drives the Lauflicht rim; brand-red fallback below.
const colors = useColorStore();
</script>

<style lang="scss">
.l-image {
  width: 100%;
}

.sidebar-songcard {
  width: 100%;
  position: relative;
  width: 13rem;

  // Block-level link + square block image so the card shrink-wraps the cover
  // exactly and the Lauflicht rim traces the image edge. The inline link left a
  // baseline gap that pushed the card taller than the cover.
  a {
    display: block;
  }

  img {
    cursor: pointer;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
  }
}
</style>
