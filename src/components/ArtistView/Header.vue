<template>
    <div class="headparent">
        <div
            v-if="!on_sidebar"
            class="artist-header-ambient rounded-lg"
            :class="{ isSmallPhone }"
        ></div>
        <div
            ref="artistheader"
            class="artist-page-header rounded-lg no-scroll"
            :class="{ isSmallPhone, useCircularImage }"
            :style="{
                height: `${isSmallPhone ? '25rem' : containerHeight}`,
            }"
        >
            <Info :artist="artist" :use-circular-image="useCircularImage" />
            <div
                class="artist-img no-select"
                :style="{
                    height: containerHeight,
                }"
            >
                <img id="artist-avatar" :src="paths.images.artist.large + artist.image" @load="store.setBgColor" />
            </div>
            <!-- Small-phone only: the photo fills the header and the title sits on
                 it, so a plain dark bottom scrim keeps the text legible. Wide
                 layouts show the photo beside the text on flat pink (no overlay). -->
            <div v-if="!useCircularImage && isSmallPhone" class="gradient"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import useSettingsStore from '@/stores/settings'
import { useElementSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { Ref, computed, onMounted, ref } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'

import { paths } from '@/config'
import updatePageTitle from '@/utils/updatePageTitle'

import useArtistStore from '@/stores/pages/artist'
import Info from './HeaderComponents/Info.vue'

const store = useArtistStore()
const settings = useSettingsStore()

const props = defineProps<{
    on_sidebar?: boolean
}>()

const { info: artist } = storeToRefs(store)

function updateTitle() {
    props.on_sidebar ? () => {} : updatePageTitle(artist.value.name)
}

onMounted(() => updateTitle())
onBeforeRouteUpdate(() => updateTitle())

const artistheader: Ref<HTMLElement | null> = ref(null)
const { width } = useElementSize(artistheader)

const isSmallPhone = computed(() => width.value <= 660)
const useCircularImage = computed(() => !isSmallPhone.value && settings.useCircularArtistImg)

const containerHeight = computed(() => {
    return useCircularImage.value ? '13rem' : '18rem'
})
</script>

<style lang="scss">
.headparent {
    height: 100%;
    width: 100%;
    position: relative;
}

.artist-header-ambient {
    height: 18rem;
    width: 100%;
    position: absolute;
    opacity: 0.25;
}

.artist-page-header {
    display: grid;
    grid-template-columns: 1fr 450px;
    position: relative;

    // Candy banner: the artist photo is a bordered, rounded image (the circular
    // mode overrides the radius to 50% below but keeps the same 2px border).
    .artist-img img {
        border: $candy-border;
        border-radius: $candy-radius;
    }

    // Small-phone overlay: the photo fills the header and the title sits on it,
    // so the text switches to white for legibility over the dark scrim.
    &.isSmallPhone .artist-info,
    &.isSmallPhone .artist-info .stats,
    &.isSmallPhone .artist-info .card-title {
        color: $candy-white;
    }

    .artist-img {
        display: flex;
        align-items: flex-end;
        order: 1;

        img {
            height: 100%;
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            object-position: 0% 20%;
        }
    }

    &.useCircularImage {
        grid-template-columns: min-content 1fr;

        .artist-img {
            padding: 1rem;
            order: -1;
            z-index: 10;

            img {
                border-radius: 50%;
                height: calc(100% - 0rem);
                width: unset;
                aspect-ratio: 1;
            }
        }
    }

    // Plain dark bottom scrim over the photo (small-phone overlay only).
    .gradient {
        position: absolute;
        inset: 0;
        height: 100%;
        width: 100%;
        pointer-events: none;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.35) 0%, transparent 50%);
    }

    &.isSmallPhone {
        display: flex;
        flex-direction: column-reverse;
        position: relative;

        .artist-img {
            position: absolute;
            width: 100%;
            top: 0;
            height: 100% !important;

            img {
                height: 100%;
                width: 100%;
                aspect-ratio: 1;
                object-fit: cover;
                object-position: 0% 20%;
            }
        }
    }
}
</style>
