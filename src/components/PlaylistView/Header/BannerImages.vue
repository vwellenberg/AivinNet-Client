<template>
    <div
        class="playlist-banner-images no-scroll"
        :style="{
      background: playlist.info.images.length ? (playlist.info.images[0] as any).color : undefined,
    }"
    >
        <PlaylistImages v-if="playlist.info.images.length" :images="playlist.info.images" size="medium" />
    </div>
</template>

<script setup lang="ts">
import usePStore from '@/stores/pages/playlist'

import PlaylistImages from '@/components/shared/PlaylistImages.vue'

const playlist = usePStore()
</script>

<style lang="scss">
.playlist-banner-images {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.2s ease-in-out;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 0.2s ease-in-out;
    }

    .playlist-collage {
        width: 100%;
        height: 100%;
    }
}
</style>
