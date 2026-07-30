<template>
    <div class="right-group">
        <!-- On desktop shuffle/repeat live in the centre transport and the
             heart sits next to the track title; here they only appear on
             mobile, where all controls are crammed into one group. -->
        <template v-if="isMobile">
            <button
                class="aux repeat"
                :class="{ 'aux-off': settings.repeat == 'none' }"
                :title="settings.repeat == 'all' ? 'Repeat all' : settings.repeat == 'one' ? 'Repeat one' : 'No repeat'"
                @click="settings.toggleRepeatMode"
            >
                <RepeatOneSvg v-if="settings.repeat == 'one'" />
                <RepeatAllSvg v-else />
            </button>
            <button
                class="aux shuffle"
                :class="{ 'aux-off': !settings.shuffle }"
                :title="settings.shuffle ? 'Shuffle: random next track' : 'Shuffle off'"
                @click="queue.toggleShuffle"
            >
                <ShuffleSvg />
            </button>
            <HeartSvg
                v-if="!hideHeart"
                title="Favorite"
                :state="queue.currenttrack?.is_favorite"
                @handleFav="() => $emit('handleFav')"
            />
        </template>
        <LyricsButton />
        <DevicesButton />
        <Volume v-if="!hideVolume" />
    </div>
</template>

<script setup lang="ts">
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'
import { isMobile } from '@/stores/content-width'

import RepeatOneSvg from '@/assets/icons/repeat-one.svg'
import RepeatAllSvg from '@/assets/icons/repeat.svg'
import ShuffleSvg from '@/assets/icons/shuffle.svg'
import DevicesButton from '../DeviceSync/DevicesButton.vue'
import HeartSvg from '../shared/HeartSvg.vue'
import LyricsButton from '../shared/LyricsButton.vue'
import Volume from './Volume.vue'

const queue = useQueue()
const settings = useSettings()

defineProps<{
    hideHeart?: boolean
    // In the Now Playing view the volume gets its own dedicated row (see
    // NowPlaying/Header.vue), so it is suppressed in this control group there.
    hideVolume?: boolean
}>()

defineEmits<{
    (event: 'handleFav'): void
}>()
</script>

<style lang="scss">
.right-group {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 2px;
    height: 4rem;

    @include allPhones {
        width: max-content;
        height: unset;
    }

    button {
        height: 3rem !important;
        width: 3rem !important;
        background-color: transparent;
        border: none;

        &:hover {
            background-color: $candy-pink-soft;
        }

        &:active > svg {
            transform: scale(0.85);
        }
    }

    // Normalize every control icon (repeat, shuffle, lyrics, devices, volume
    // speaker) to one size. They all come from the shared 24x24 icon set, so a
    // plain width/height does it — the old `transform: scale(0.75)` sized each
    // glyph off its own viewBox, which is why the lyrics bubble (filling its
    // box edge to edge) towered over its neighbours. The favorite check is
    // excluded: HeartSvg brings its own geometry.
    > button:not(.heart-button) svg {
        width: 1.35rem;
        height: 1.35rem;
    }

    button.aux.aux-off svg {
        opacity: 0.45;
    }

    // The control glyphs are currentColor (filled bodies, stroked details) —
    // colour them through `color`, never `fill`, or the stroked ones (shuffle,
    // repeat, lyrics) get flooded solid. Two exclusions: HeartSvg brings its
    // own colours (currentColor circle + a white check mark), and the joined
    // devices button keeps the white glyph on its green box (DevicesButton.vue)
    // — spelled out here rather than left to specificity luck.
    > button:not(.heart-button):not(.ds-joined) {
        color: $candy-text;
    }

    // Active shuffle / repeat wear the play button's memphis box, mirroring the
    // desktop transport (LeftSidebar/NP/HotKeys.vue) — the shared treatment from
    // _candy.scss. The buttons are a fixed 3rem square here, so the box needs no
    // extra footprint reservation.
    button.aux:not(.aux-off) {
        @include mem-transport-aux-on;
        // A 3rem block of yellow around a 1.35rem glyph dwarfed its bare
        // neighbours (and the 2.5rem play button) in the Now Playing header.
        // The box matches the play button now, with a slightly bigger glyph so
        // it does not look empty; the margins keep the hit areas apart.
        width: 2.5rem !important;
        height: 2.5rem !important;
        margin: 0 0.25rem;

        svg {
            width: 1.5rem;
            height: 1.5rem;
        }

        &:hover {
            background-color: $mem-blush;
        }
    }
}
</style>
