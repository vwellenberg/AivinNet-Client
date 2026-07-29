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
// Shared by this desktop transport and BottomBar/Right.vue's mobile one: the
// "on" state of an auxiliary control (shuffle / repeat) wears the same memphis
// box as the play button — 2px ink border, rounded square, sprinkle texture —
// only smaller and in yellow, so play stays the primary teal action. The "off"
// state deliberately keeps no box at all, which keeps the bar calm and makes
// "on" unmistakable.
//
// $size is the box; pass the glyph size separately because the shuffle glyph
// fills ~59% of its viewBox and the repeat glyph ~78%, so equal CSS boxes look
// unequal (that correction predates this mixin).
@mixin transport-aux-active($size: 2rem) {
    width: $size;
    height: $size;
    flex-shrink: 0;
    @include candy-box($mem-yellow, $candy-radius-sm);
    position: relative;
    overflow: hidden; // clip the sprinkle to the rounded corners

    // Memphis sprinkle over the accent fill, exactly like the play CTA.
    &::before {
        content: "";
        position: absolute;
        inset: 0;
        @include mem-sprinkle(22px);
        opacity: 0.4;
        pointer-events: none;
    }

    svg {
        // Above the sprinkle overlay.
        position: relative;
        z-index: 1;
        opacity: 1;
    }

    // The transport SVGs hardcode a light fill (#F2F2F2), and $candy-text turns
    // them paper-light in dark mode — on the yellow fill the glyph must be
    // static ink in BOTH themes.
    svg path {
        fill: $mem-ink;
    }
}

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
        // the SVG asset — force them to the theme text colour so they read on
        // the panel bar in BOTH themes (ink on light, paper on dark).
        svg path {
            fill: $candy-text;
        }
    }

    // …but the play/pause glyph sits on the teal accent box (theme-invariant
    // light fill) — pin static ink there.
    .play svg path {
        fill: $mem-ink;
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

    // shuffle / repeat — auxiliary controls. Off = bare glyph; on = the memphis
    // box below (see transport-aux-active).
    // Different glyph sizes on purpose: the shuffle glyph fills ~59% of its
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

    .aux-off svg {
        opacity: 0.45;
    }

    // Active shuffle / active repeat: the play button's box, one size down and in
    // yellow. Same hover/press feedback as .play so the three read as one family.
    .aux.shuffle:not(.aux-off),
    .aux.repeat:not(.aux-off) {
        @include transport-aux-active(2rem);
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
