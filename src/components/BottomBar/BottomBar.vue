<template>
    <div class="b-bar">
        <LeftGroup @handleFav="handleFav" />
        <div class="center">
            <div v-if="!isMobile" class="with-time">
                <div class="time time-current">
                    <div class="numbers">
                        {{ formatSeconds(queue.duration.current || 0) }}
                    </div>
                </div>

                <div class="buttons rounded-sm border">
                    <HotKeys />
                </div>
                <div class="time time-full">
                    <div class="numbers">
                        {{ formatSeconds(queue.duration.full) }}
                    </div>
                </div>
            </div>
            <Progress />
        </div>
        <RightGroup v-if="!isMobile" @handleFav="handleFav" />
        <Navigation v-else />
        <!-- Autoplay-block overlay for remote group joins; the bottom bar is
             always mounted, which makes it a reliable host. -->
        <GestureOverlay />
    </div>
</template>

<script setup lang="ts">
import { favType } from '@/enums'
import favoriteHandler from '@/helpers/favoriteHandler'
import { isMobile } from '@/stores/content-width'
import { formatSeconds } from '@/utils'

import useQStore from '@/stores/queue'

import GestureOverlay from '@/components/DeviceSync/GestureOverlay.vue'
import HotKeys from '@/components/LeftSidebar/NP/HotKeys.vue'
import Progress from '@/components/LeftSidebar/NP/Progress.vue'
import Navigation from '@/components/LeftSidebar/NavButtons.vue'

import LeftGroup from './Left.vue'
import RightGroup from './Right.vue'

const queue = useQStore()

function handleFav() {
    favoriteHandler(
        queue.currenttrack?.is_favorite,
        favType.track,
        queue.currenttrack?.trackhash || '',
        () => null,
        () => null
    )
}
</script>

<style lang="scss">
.b-bar {
    display: grid;
    grid-template-columns: 1fr max-content 1fr;
    align-items: center;
    z-index: 1;
    // Side inset for the NP block / volume group. Used to be an inline style
    // gated on is_default_layout, which left the alternate (links) layout with
    // zero padding — the NP cover sat flush against the window edge.
    padding: 0 1rem;

    @include allPhones {
        display: flex;
        flex-direction: column;
        align-items: unset;
        gap: $small;
        padding: $medium 1rem;

        // The seek bar used to be decoration on phones: a 1px line, the whole
        // .center block set to `pointer-events: none`, and the thumb hidden on
        // :hover — which on a touch screen sticks after the first tap, so the
        // knob vanished as soon as you touched it and could never be dragged.
        // It is a real control now: a touch-sized track, a visible knob, and
        // `touch-action: none` so a horizontal drag scrubs instead of being
        // swallowed as a page scroll/swipe.
        .center #progress {
            // A slider is the one control that stays thinner than 44px — the
            // knob is what the finger goes for, so the track carries the bar
            // and the knob is oversized against it.
            --range-h: 1.25rem;
            touch-action: none;

            // Finger-sized knob (the desktop one is tuned for a mouse). Kept
            // slightly proud of the track so it stays visible while dragging.
            &::-webkit-slider-thumb {
                height: 1.6rem;
                width: 1.6rem;
                margin-top: -3px;
            }

            &::-moz-range-thumb {
                height: 1.6rem;
                width: 1.6rem;
            }
        }
    }

    button {
        // Transport icon buttons are borderless + transparent on the white bar
        // (override the global candy button base locally); black glyphs, with a
        // soft-pink rounded fill on hover. The play/pause button is the exception
        // (its pink candy-box lives in HotKeys) and is excluded from the hover.
        background: transparent;
        border: none;
        border-radius: $small;
        width: 3rem;
        transition: background-color 0.2s ease-out, border-color 0.2s ease-out;

        &:not(.play):hover {
            background-color: $candy-pink-soft;
        }

        @include allPhones {
            height: 3rem;
        }

        @include largePhones {
            // Square, and at the 44px touch target — the most-tapped controls
            // in the app were 40px. (A former `&:nth-child(2) { width: 3.5rem }`
            // here only ever hit the play button, since the aux buttons are
            // hidden at mobile widths, and stretched it into an oval.)
            width: 2.75rem;
            height: 2.75rem;
        }

        @include smallestPhones {
            &:first-child {
                display: none;
            }

            &:nth-child(2) {
                margin-left: $smaller;
            }

            &:last-child {
                display: none;
            }
        }
    }

    &:hover {
        // INFO: Show the progress bar when hovering over the bottom bar
        #progress::-moz-range-thumb {
            height: 1rem;
            width: 1rem;
        }

        #progress::-webkit-slider-thumb {
            height: 1rem;
            width: 1rem;
        }

        #progress::-ms-thumb {
            height: 1rem;
            width: 1rem;
        }

        // INFO: Also show the expand button
        .np-image .expandicon {
            opacity: 1;
        }
    }

    .with-time {
        display: grid;
        grid-template-columns: max-content 1fr max-content;
        align-items: center;
        // No fixed height: the row sizes to the green play circle (2.5rem) so
        // its rounded edges are never clipped. A short fixed height + scaled
        // buttons + overflow:hidden used to crop the transport icons.

        // Keep the prev/next glyph buttons transparent, but NOT the play/pause
        // button (it keeps its pink candy-box fill from HotKeys).
        button:not(.play) {
            background: transparent;
        }
    }

    .center {
        display: grid;
        align-items: center;
        gap: 0.625rem;

        width: 30rem;

        @media only screen and (max-width: 1080px) {
            width: 20rem !important;
        }

        @include allPhones {
            width: 100% !important;
            // No negative side margins any more: the bar used to be pulled to
            // the full viewport width (100vw), which cut the knob off at both
            // ends — exactly where you grab it to seek to the start or end.
            margin: 4px 0;
            user-select: none;

            // #progress is wrapped in .progress-wrap (#66), so target it as a
            // descendant instead of a direct child.
            #progress {
                width: 100%;
                margin: unset;
            }
        }

        .time {
            font-weight: 500;
            font-size: $medium;
            color: $candy-text;

            .numbers {
                // Plain time text, no pill/box background (Spotify).
                font-variant-numeric: tabular-nums;
            }
        }
    }

    // hotkey
    .buttons {
        display: grid;
        place-items: center;
        border: none;
    }
}
</style>
