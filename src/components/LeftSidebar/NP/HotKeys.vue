<template>
    <div class="hotkeys no-scroll">
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
    gap: 1.1rem;
    height: 100%;

    button {
        height: 100%;
        padding: 0;
        background: none;
        border: 1px solid transparent;
        border-radius: 0;

        &:hover {
            background: $darkestblue;
        }
    }

    .play {
        width: 4rem;
    }

    .skip-prev {
        svg {
            transform: rotate(180deg);
        }

        &:active svg {
            transform: rotate(180deg) scale(0.75);
        }
    }

    // Shuffle / repeat: smaller and subtler than the transport buttons, no
    // heavy hover fill (Spotify-style auxiliary controls).
    .aux {
        &:hover {
            background: none;
        }

        svg {
            transform: scale(0.62);
            opacity: 0.85;
            transition: opacity 0.15s ease, transform 0.15s ease;
        }

        &:hover svg {
            opacity: 1;
        }

        &:active svg {
            transform: scale(0.52);
        }
    }

    .aux-disabled svg {
        opacity: 0.3;
    }

    @include allPhones {
        gap: 0;

        .skip-prev {
            margin-left: $small;
        }
    }

    @include largePhones {
        flex-shrink: 0;

        .skip-prev {
            margin-left: $smaller;
        }
    }

    .playsvg {
        height: 1.75rem;
    }
}
</style>
