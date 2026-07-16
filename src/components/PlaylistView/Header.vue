<template>
  <div
    class="p-header image rounded-lg"
    :style="[
      {
        background: bg,
        backgroundPosition: `center ${info.settings.banner_pos}%`,
        height: `${isSmallPhone ? '24rem' : '18rem'}`,
      },
    ]"
    :class="{ 'use-sqr_img': useSqrImg }"
  >
    <!-- Darkens the BANNER background image for text readability. In square
         mode there is no banner background, so the overlay would just float
         as a dark rounded box over the page gradient. -->
    <div v-if="!isSmallPhone && info.has_image && !useSqrImg" class="gradient rounded-lg"></div>
    <div v-if="info.has_image && useSqrImg" class="sqr_img">
      <img :src="(playlist.info.image as string)" class="rounded-sm" />
    </div>
    <BannerImages v-if="playlist.info.count && !info.has_image && useSqrImg" class="sqr_img rounded-sm" />
    <Info />
    <LastUpdated />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";

import { isSmallPhone } from "@/stores/content-width";
import usePStore from "@/stores/pages/playlist";

import BannerImages from "./Header/BannerImages.vue";
import Info from "./Header/Info.vue";
import LastUpdated from "./Header/LastUpdated.vue";

const playlist = usePStore();

const { info } = storeToRefs(playlist);

const bg = computed(() => {
  // hide background on small screen
  if (isSmallPhone.value){
    return "";
  }

  if (playlist.info.has_image) {
    if (isSmallPhone.value || (!playlist.info.settings.square_img && !isSmallPhone.value)) {
      return `url(${info.value.image})`;
    }
  }

  return "";
});

const useSqrImg = computed(() => !playlist.info.has_image || !bg.value.startsWith("url"));
</script>

<style lang="scss">
.p-header {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  background-position: center 50%;
  background-size: cover !important;
  padding-bottom: 1rem;

  // Banner-image mode: the playlist photo is the banner. Give it the candy
  // border + radius and put the title/meta/controls in white over the photo.
  &:not(.use-sqr_img) {
    border: $candy-border;
    border-radius: $candy-radius;

    .playlist-info,
    .last-updated {
      // White text over the banner photo — static light in both themes.
      color: $mem-panel-static;
    }
  }

  &.use-sqr_img {
    grid-template-columns: max-content 1fr;
    align-items: flex-end;

    .title {
      font-size: 3.75rem !important;
    }

    @include largePhones {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: flex-start;
      gap: 1rem;

      // take up the space left by the gradient element
      height: 25rem !important;


      .playlist-info {
        text-align: center;
        height: max-content;
      }

      .sqr_img {
        height: 12rem;
        width: 12rem;
        margin-top: 1rem;
        margin: 0 auto;
      }

      .title {
        font-size: 2rem !important;
      }
    }
  }

  .sqr_img {
    height: 16rem;
    width: 16rem;
    z-index: 100;
    margin-left: 1rem;

    img {
      height: 100%;
      width: 100%;
      object-fit: cover;
    }
  }

  // Border only the single square cover (direct child img), not each tile of
  // the BannerImages collage (whose imgs are nested deeper).
  .sqr_img > img {
    border: $candy-border;
    border-radius: $candy-radius-sm;
  }

  // Plain dark scrim over the banner photo so text stays legible.
  .gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }

  @include largePhones {
    .title {
      font-size: 2.5rem !important;
    }
  }
}
</style>
