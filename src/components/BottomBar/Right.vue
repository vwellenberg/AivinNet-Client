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

    // Every control in this group (repeat, shuffle, lyrics, devices, volume
    // speaker) shares the transport's footprint and glyph size — the same
    // $bar-control / $bar-glyph the centre transport reads, so the two halves
    // of the bar cannot drift apart again.
    //
    // Two exclusions, both because they bring their own complete anatomy:
    // HeartSvg (its own geometry and its teal favourited state) and the joined
    // devices button (white glyph on a green box, owned by DevicesButton.vue).
    // Spelled out rather than left to specificity luck.
    > button:not(.heart-button):not(.ds-joined) {
        @include btn-quiet($size: $bar-control, $glyph: $bar-glyph);
        // The control glyphs are currentColor (filled bodies, stroked details)
        // — colour them through `color`, never `fill`, or the stroked ones
        // (shuffle, repeat, lyrics) get flooded solid.
        color: $candy-text;
    }

    // The joined devices button is excluded above because its LOOK is its own
    // (green box, white glyph). Its FOOTPRINT is not — it belongs to the bar,
    // like every other control here. Without this the one button whose size
    // nobody owns falls back to whatever the global default happens to be.
    > button.ds-joined {
        width: $bar-control;
        height: $bar-control;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        svg {
            width: $bar-glyph;
            height: $bar-glyph;
        }
    }

    button.aux.aux-off svg {
        opacity: 0.45;
    }

    // Active shuffle / repeat wear the yellow memphis box, mirroring the
    // desktop transport (LeftSidebar/NP/HotKeys.vue). The footprint is already
    // reserved by the quiet role above, so switching on changes colour only —
    // it used to also resize the button from 3rem to 2.5rem, which shoved its
    // neighbours on every toggle.
    button.aux:not(.aux-off) {
        @include btn-toggle-on;

        &:hover {
            background-color: $mem-blush;
        }
    }
}
</style>
