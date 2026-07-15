<template>
    <div class="hotkeys">
        <button v-if="!isMobile" class="aux" title="Shuffle" @click.prevent="queue.shuffleQueue">
            <ShuffleSvg />
        </button>
        <button class="skip skip-prev" @click.prevent="queue.playPrev">
            <PrevSvg />
        </button>
        <button class="play" @click.prevent="queue.playPause">
            <Spinner v-if="buffering && queue.playing" />
            <PauseSvg v-else-if="queue.playing" />
            <PlaySvg class="playsvg" v-else />
        </button>
        <button class="skip" @click.prevent="queue.playNext">
            <NextSvg />
        </button>
        <button
            v-if="!isMobile"
            class="aux repeat"
            :class="{ 'aux-disabled': settings.repeat === 'none' }"
            :title="settings.repeat === 'all' ? 'Repeat all' : settings.repeat === 'one' ? 'Repeat one' : 'No repeat'"
            @click.prevent="settings.toggleRepeatMode"
        >
            <RepeatOneSvg v-if="settings.repeat === 'one'" />
            <RepeatAllSvg v-else />
        </button>
    </div>
</template>

<script setup lang="ts">
import { buffering } from '@/stores/player'
import { isMobile } from '@/stores/content-width'
import useQStore from '@/stores/queue'
import useSettings from '@/stores/settings'

import { default as NextSvg, default as PrevSvg } from '@/assets/icons/next.svg'
import PauseSvg from '@/assets/icons/pause.svg'
import PlaySvg from '@/assets/icons/play.svg'
import ShuffleSvg from '@/assets/icons/shuffle.svg'
import RepeatAllSvg from '@/assets/icons/repeat.svg'
import RepeatOneSvg from '@/assets/icons/repeat-one.svg'
import Spinner from '@/components/shared/Spinner.vue'

const queue = useQStore()
const settings = useSettings()
</script>

<style lang="scss">
.hotkeys {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    height: 100%;

    button {
        padding: 0;
        background: none;
        border: none;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        // Transport glyphs (pause/next/shuffle/repeat) hardcode a light fill in
        // the SVG asset — force them black so they read on the light bar. play.svg
        // uses currentColor and lands black too.
        svg path {
            fill: $candy-black;
        }
    }

    // prev / next — light-grey glyphs that brighten on hover (no box).
    .skip {
        svg {
            width: 1.55rem;
            height: 1.55rem;
            opacity: 0.7;
            transition: opacity 0.15s ease, transform 0.1s ease;
        }

        &:hover svg {
            opacity: 1;
        }

        &:active svg {
            transform: scale(0.85);
        }
    }

    .skip-prev svg {
        transform: rotate(180deg);
    }

    .skip-prev:active svg {
        transform: rotate(180deg) scale(0.85);
    }

    // play / pause — teal memphis rounded-square with a 2px ink border and an
    // ink glyph (primary action). The exception to the borderless transport
    // icons; hover flips to $mem-yellow.
    .play {
        width: 2.5rem;
        height: 2.5rem;
        flex-shrink: 0;
        @include candy-box($mem-teal, $candy-radius-sm);
        transition: transform 0.1s ease, background-color 0.2s ease-out;

        svg {
            // Larger glyph — the 1.35rem play/pause looked too small in the box.
            width: 1.8rem;
            height: 1.8rem;
        }

        // Optically centre the play triangle inside the box.
        .playsvg {
            transform: translateX(1px);
        }

        &:hover {
            background-color: $mem-yellow;
            transform: scale(1.06);
        }

        &:active {
            transform: scale(0.98);
        }
    }

    // shuffle / repeat — subtle auxiliary controls.
    // Different box sizes on purpose: the shuffle glyph fills ~59% of its
    // viewBox, the repeat glyph ~78%, so equal CSS boxes look unequal. Bump
    // shuffle up and trim repeat down for optically matched icons.
    .aux {
        svg {
            width: 1.45rem;
            height: 1.45rem;
            opacity: 0.7;
            transition: opacity 0.15s ease, transform 0.1s ease;
        }

        &:hover svg {
            opacity: 1;
        }

        &:active svg {
            transform: scale(0.85);
        }
    }

    .aux.repeat svg {
        width: 1.15rem;
        height: 1.15rem;
    }

    .aux-disabled svg {
        opacity: 0.3;
    }

    // Repeat active (mode != none): pink-deep rounded fill so the "on" state
    // reads on the light bar (candy equivalent of the old green accent).
    .aux.repeat:not(.aux-disabled) {
        background-color: $candy-pink-deep;
        border-radius: $candy-radius-sm;

        svg {
            opacity: 1;
        }
    }

    @include allPhones {
        gap: 0.75rem;

        .skip-prev {
            margin-left: $small;
        }
    }
}
</style>
