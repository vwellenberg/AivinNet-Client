<template>
    <div
        class="playlist-banner-images no-scroll"
        :style="{
      background: playlist.info.images.length ? (playlist.info.images[0] as any).color : undefined,
    }"
    >
        <img
            v-if="playlist.info.images.length"
            :src="paths.images.thumb.medium + (playlist.info.images[0] as any).image"
            class=""
        />
    </div>
</template>

<script setup lang="ts">
import { paths } from '@/config'
import usePStore from '@/stores/pages/playlist'

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
}
</style>
