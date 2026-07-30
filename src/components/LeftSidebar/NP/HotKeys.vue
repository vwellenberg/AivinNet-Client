<template>
    <div class="hotkeys">
        <button
            v-if="!isMobile"
            class="aux shuffle"
            :class="{ 'aux-off': !settings.shuffle }"
            :title="settings.shuffle ? 'Shuffle: random next track' : 'Shuffle off'"
            @click.prevent="queue.toggleShuffle"
        >
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
            :class="{ 'aux-off': settings.repeat === 'none' }"
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
// The "on" state of shuffle / repeat is the shared `mem-transport-aux-on`
// treatment from _candy.scss (this transport and the mobile one in
// BottomBar/Right.vue use the same one).
//
// All five transport glyphs come from the shared 24x24 icon set, drawn to one
// optical size, so they take ONE glyph size here — the per-glyph corrections
// this file used to carry (shuffle up, repeat down) are gone with the icons
// that needed them.
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

        // The transport glyphs are currentColor (filled play/pause/skip,
        // stroked shuffle/repeat) — drive them from `color` so they read on
        // the panel bar in BOTH themes (ink on light, paper on dark). Never
        // `fill` here: that would flood the stroked glyphs solid.
        color: $candy-text;
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
        color: $mem-ink;
        @include candy-box($mem-teal, $candy-radius-sm);
        transition: transform 0.1s ease, background-color 0.2s ease-out;
        position: relative;
        overflow: hidden; // clip the sprinkle to the rounded corners

        // Memphis sprinkle over the teal box (like the header Play CTA).
        &::before {
            content: "";
            position: absolute;
            inset: 0;
            @include mem-sprinkle(22px);
            opacity: 0.4;
            pointer-events: none;
        }

        svg,
        .spinner {
            // Glyph above the sprinkle overlay.
            position: relative;
            z-index: 1;
        }

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

    // shuffle / repeat — auxiliary controls. Off = bare glyph on a transparent
    // box; on = the memphis fill (see below).
    //
    // The 2rem box and its 2px border are reserved in BOTH states. Without that
    // the off state was only as wide as its bare glyph and grew to 2rem when
    // switched on, which visibly shoved the whole transport row —
    // prev/play/next included — sideways on every shuffle toggle.
    //
    // One glyph size for both: shuffle and repeat come from the shared icon
    // set and are drawn to the same optical size.
    .aux {
        width: 2rem;
        height: 2rem;
        flex-shrink: 0;
        border: $candy-border-w solid transparent;
        border-radius: $candy-radius-sm;

        svg {
            width: 1.3rem;
            height: 1.3rem;
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

    .aux-off svg {
        opacity: 0.45;
    }

    // Active shuffle / active repeat: the play button's box, one size down and in
    // yellow. Same hover/press feedback as .play so the three read as one family.
    .aux.shuffle:not(.aux-off),
    .aux.repeat:not(.aux-off) {
        @include mem-transport-aux-on;
        transition: transform 0.1s ease, background-color 0.2s ease-out;

        &:hover {
            background-color: $mem-blush;
            transform: scale(1.06);
        }

        &:active {
            transform: scale(0.98);

            svg {
                // The box already scales; don't shrink the glyph a second time.
                transform: none;
            }
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
