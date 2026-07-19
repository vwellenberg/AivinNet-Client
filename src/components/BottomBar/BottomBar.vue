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

        /* Hiding the dot/thumb/handle for readonly input */
        /* Webkit browsers, Firefox, IE etc */
        /* #progress now sits inside a .progress-wrap (#66 hover preview), so
           these reach it as a descendant rather than a direct child. */
        &:hover .center #progress::-webkit-slider-thumb {
            display: none;
            opacity: 0;
            visibility: hidden;
        }

        &:hover .center #progress::-moz-range-thumb {
            display: none;
            opacity: 0;
            visibility: hidden;
        }

        &:hover .center #progress::-ms-thumb {
            display: none;
            opacity: 0;
            visibility: hidden;
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
            // All transport buttons stay square at 2.5rem so the green play
            // circle stays round. A former `&:nth-child(2) { width: 3.5rem }`
            // here only ever hit the play button (aux buttons are hidden at
            // mobile widths, making play the 2nd child) and stretched it into
            // an oval, so it was removed.
            width: 2.5rem;
            height: 2.5rem;
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
            margin: 4px -16px;
            user-select: none;
            pointer-events: none;

            // #progress is wrapped in .progress-wrap (#66), so target it as a
            // descendant instead of a direct child.
            #progress {
                height: 1px !important;
                width: 100vw !important;
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
