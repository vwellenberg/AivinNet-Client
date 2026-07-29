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

        // Normalize every control icon (repeat, shuffle, lyrics, volume speaker)
        // to one size. The volume speaker's own scaling lives in Volume.vue but
        // is scoped under a .b-bar ancestor; in the Now Playing header this group
        // is NOT inside .b-bar, so without this the speaker rendered full-size and
        // looked bigger than its neighbours. (In the bottom bar Volume.vue's more
        // specific rule still wins, so that context is unchanged.)
        svg {
            transform: scale(0.75);
        }

        &:active > svg {
            transform: scale(0.6);
        }
    }

    button.aux.aux-off svg {
        opacity: 0.45;
    }

    // The transport glyphs (repeat, shuffle, lyrics) hardcode a light fill in
    // their SVG assets — force them to the theme text colour so they read on
    // the panel bar in BOTH themes. The favorite check is excluded: its circle
    // is currentColor-driven (see HeartSvg) and its check mark is a separate
    // white-stroked path that must stay white.
    > button:not(.heart-button) svg path {
        fill: $candy-text;
    }

    // Active shuffle / repeat wear the play button's memphis box, mirroring the
    // desktop transport (LeftSidebar/NP/HotKeys.vue). The glyph keeps this bar's
    // own 0.75 scale, so only the box, border, sprinkle and ink fill come from
    // the shared treatment.
    button.aux:not(.aux-off) {
        @include candy-box($mem-yellow, $candy-radius-sm);
        position: relative;
        overflow: hidden;

        &::before {
            content: "";
            position: absolute;
            inset: 0;
            @include mem-sprinkle(22px);
            opacity: 0.4;
            pointer-events: none;
        }

        svg {
            position: relative;
            z-index: 1;
        }

        // On the yellow accent fill the glyph must be static ink in BOTH themes —
        // the adaptive $candy-text above would turn it paper-light in dark mode.
        svg path {
            fill: $mem-ink;
        }

        &:hover {
            background-color: $mem-blush;
        }
    }

    // Device sync: green fill marks an active group session.
    button.devices-btn.ds-joined {
        background-color: $brand-green;

        svg path {
            fill: white;
        }
    }
}
</style>
