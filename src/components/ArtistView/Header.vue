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
                <!-- Defensive only. The image endpoint answers 200 even for an
                     artist with no photo: it falls back to the backend's own
                     assets/artist.webp. So `@error` does NOT fire in the common
                     no-photo case, and what you see there is that asset, not
                     this tile (it is near-white on white — see the follow-up
                     issue). This covers the two cases the backend can't: an
                     empty `image` field, and a genuine network failure. -->
                <div v-if="imageMissing" class="artist-img-placeholder" title="No artist image">
                    <ArtistSvg />
                </div>
                <img
                    v-else
                    id="artist-avatar"
                    :src="paths.images.artist.large + artist.image"
                    @load="store.setBgColor"
                    @error="imageFailed = true"
                />
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
import ArtistSvg from '@/assets/icons/artist.svg'
import Info from './HeaderComponents/Info.vue'

const store = useArtistStore()
const settings = useSettingsStore()

// `@error` only fires for an image that was actually requested, so an artist
// with an empty `image` (nothing to request) has to be caught up front.
const imageFailed = ref(false)

const props = defineProps<{
    on_sidebar?: boolean
}>()

const { info: artist } = storeToRefs(store)

const imageMissing = computed(() => imageFailed.value || !artist.value.image)

function updateTitle() {
    props.on_sidebar ? () => {} : updatePageTitle(artist.value.name)
}

onMounted(() => updateTitle())
onBeforeRouteUpdate(() => {
    // Without this the placeholder sticks: the component is reused across
    // artist routes, so a failure on one artist would hide the next one's photo.
    imageFailed.value = false
    updateTitle()
})

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

    // Follows the header it tints — it is a separate absolutely positioned
    // element, so a shorter header would otherwise leave its wash hanging
    // below the header's own bottom edge. The header sizes to its content now,
    // so this is the same content's height, not a copy of a fixed number.
    @include shortViewport {
        height: 100%;
    }
}

.artist-page-header {
    display: grid;
    grid-template-columns: 1fr 450px;
    position: relative;

    // A landscape phone. The height comes from an INLINE style (13rem circular
    // / 18rem banner, 25rem on a small phone), so this has to shout to be heard.
    //
    // ⚠️ `height: auto`, NOT a smaller fixed height. The first version of this
    // block set `9rem !important` and the content did not fit: `.artist-info`
    // measured 173px inside a 144px box, so the Play row hung 13px BELOW the
    // header and landed on the "Tracks" heading, while the "Artist" label and
    // the stats line slid behind the round photo. The playlist and album
    // headers next door got this right — they RELEASE their floor instead of
    // setting a new ceiling. A header sizes to its content; what makes it flat
    // here is the content being smaller, not the box being shorter.
    //
    // Verify accordingly: not "how tall is the header", but "does .artist-info
    // end inside it". The first round measured the former and passed.
    @include shortViewport {
        height: auto !important;
        min-height: 0 !important;

        // The size goes on the PHOTO, never on its frame. The frame carries
        // `padding: 1rem` in circular mode, so forcing 7rem onto it too left
        // the photo overflowing its own box by exactly that padding — 16px out
        // to the right, 9px of it across the artist's name (measured). Size the
        // photo and let the frame hug it.
        .artist-img {
            padding: $small !important;
            height: auto !important;
            width: auto !important;
        }

        .artist-img img,
        .artist-img .artist-img-placeholder {
            // 7rem is what the playlist and album covers take here.
            height: 7rem !important;
            width: 7rem !important;
        }

        .artist-info {
            // 1rem of padding and a 1rem gap are 40px of the 173 — most of what
            // did not fit. The 44px action row is untouchable, so the air goes.
            padding: $small 0 $small $small;
            gap: $small;

            .text {
                gap: $smaller;
            }

            .artist-name {
                font-size: $detail-title-size-phone;
            }
        }
    }

    // Candy banner: the artist photo is a bordered, rounded image (the circular
    // mode overrides the radius to 50% below but keeps the same 2px border).
    // The no-photo placeholder is listed alongside the image in every geometry
    // rule below, so it inherits the exact same frame, radius and crop box
    // instead of drifting once someone tweaks one of them.
    .artist-img img,
    .artist-img .artist-img-placeholder {
        border: $candy-border;
        border-radius: $candy-radius;
    }

    // The placeholder itself: a memphis panel tile with the artist glyph.
    .artist-img-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: $mem-panel;
        color: $mem-content-text;
        box-sizing: border-box;

        svg {
            width: 35%;
            height: 35%;
            opacity: 0.45;
        }
    }

    // Small-phone overlay: the photo fills the header and the title sits on it,
    // so the text switches to white for legibility over the dark scrim.
    &.isSmallPhone .artist-info,
    &.isSmallPhone .artist-info .stats,
    &.isSmallPhone .artist-info .card-title {
        // White text over the dark photo scrim — static light in both themes.
        color: $mem-panel-static;
    }

    .artist-img {
        display: flex;
        align-items: flex-end;
        order: 1;

        img,
        .artist-img-placeholder {
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

            img,
            .artist-img-placeholder {
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

            img,
            .artist-img-placeholder {
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
