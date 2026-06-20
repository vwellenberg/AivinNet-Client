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
    }

    // prev / next — light-grey glyphs that brighten on hover (no box).
    .skip {
        svg {
            width: 1.4rem;
            height: 1.4rem;
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

    // play / pause — prominent white circle with a dark icon (Spotify).
    .play {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background: #fff;
        flex-shrink: 0;
        transition: transform 0.1s ease;

        svg {
            width: 1.35rem;
            height: 1.35rem;
        }

        // Both play (currentColor) and pause (#F2F2F2) paths -> dark on white.
        svg path {
            fill: #181818;
        }

        // Optically centre the play triangle inside the circle.
        .playsvg {
            transform: translateX(1px);
        }

        &:hover {
            transform: scale(1.06);
        }

        &:active {
            transform: scale(0.98);
        }
    }

    // shuffle / repeat — subtle auxiliary controls.
    .aux {
        svg {
            width: 1.15rem;
            height: 1.15rem;
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

    .aux-disabled svg {
        opacity: 0.3;
    }

    @include allPhones {
        gap: 0.75rem;

        .skip-prev {
            margin-left: $small;
        }
    }
}
</style>
