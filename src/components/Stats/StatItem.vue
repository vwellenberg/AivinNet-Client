<template>
    <div class="statitem" :class="props.icon" :style="tileStyle">
        <div class="itemcontent">
            <div class="count ellip2" :title="formattedValue">{{ formattedValue }}</div>
            <div class="title">{{ text }}</div>
        </div>

        <component :is="icon" v-if="!props.icon.startsWith('top')" class="staticon" />
        <router-link
            v-if="props.icon.startsWith('top') && props.image"
            :to="{
                name: Routes.album,
                params: {
                    albumhash: props.image?.replace('.webp', ''),
                },
            }"
        >
            <img class="staticon statimage shadow-sm" :src="paths.images.thumb.small + props.image" alt="" />
        </router-link>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import StopWatchSvg from '@/assets/icons/timer.svg'
import HeadphoneSvg from '@/assets/icons/headphones.svg'
import FolderSvg from '@/assets/icons/folder.nopad.svg'
import Index1Svg from '@/assets/icons/index1.svg'
import SparklesSvg from '@/assets/icons/sparkles.svg'

import { paths } from '@/config'
import { Routes } from '@/router'
import { CANDY } from '@/utils/colortools/pageGradient'

const props = defineProps<{
    value: string
    text: string
    icon: string
    image?: string
}>()

const icon = computed(() => {
    switch (props.icon) {
        case 'streams':
            return HeadphoneSvg
        case 'playtime':
            return StopWatchSvg

        case 'trackcount':
            return FolderSvg

        case 'toptrack':
            return Index1Svg

        default:
            return SparklesSvg
    }
})

const formattedValue = computed(() => {
    return props.value.toLocaleString()
})

// Flat candy tile colour, cycled by stat type across the palette
// [pink, lavender, pink-soft, white]. Candy brutalism is flat, so every route
// (including Album/Artist, which previously used cover-extracted colours) uses
// the same candy tiles with black text.
const defaultBackgroundStyles = computed(() => {
    switch (props.icon) {
        case 'streams':
            return CANDY.pink
        case 'playtime':
            return CANDY.lavender
        case 'trackcount':
            return CANDY.pinkSoft
        case 'toptrack':
        case 'topalbum':
            return CANDY.white
        default:
            return CANDY.pink
    }
})

const tileStyle = computed(() => ({
    backgroundColor: defaultBackgroundStyles.value,
}))
</script>

<style lang="scss">
.statitem {
    @include candy-box($candy-pink, $candy-radius);
    color: $candy-text;
    height: 12rem;
    aspect-ratio: 1;
    overflow: hidden;
    position: relative;

    .itemcontent {
        position: relative;
        z-index: 1;
        height: 100%;
        padding: 1rem;

        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-start;
        gap: $small;

        .count {
            font-size: 1.55rem;
            font-weight: 900;
        }

        .title {
            font-size: 14px;
            font-weight: 500;
        }
    }

    .staticon {
        position: absolute;
        top: 1rem;
        left: 1rem;
        width: 1.5rem;
        z-index: 1;
        color: $candy-text;
    }

    .statimage {
        height: 54px;
        width: 54px;
        border-radius: $smaller;
        border: $candy-border;
    }
}

.statitem.toptrack,
.statitem.topalbum {
    aspect-ratio: 1.5;
}
</style>
