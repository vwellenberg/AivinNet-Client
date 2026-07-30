<template>
    <div class="now-playing-header">
        <div class="centered">
            <PlayingFrom />
            <RouterLink
                :to="{
                    name: Routes.album,
                    params: {
                        albumhash: queue.currenttrack?.albumhash || ' ',
                    },
                }"
                title="Go to Album"
                class="np-image lauflicht-rim"
            >
                <img v-motion-fade class="rounded" :src="paths.images.thumb.large + queue.currenttrack?.image" />
            </RouterLink>
            <NowPlayingInfo @handle-fav="handleFav" />
            <Progress v-if="isMobile" />
            <div class="below-progress">
                <div v-if="isMobile" class="time">
                    {{ formatSeconds(queue.duration.current) }}
                </div>
                <Buttons v-if="isSmallPhone" :hide-heart="true" :hide-volume="true" @handleFav="() => {}" />
                <div v-if="isMobile" class="time">
                    {{ formatSeconds(queue.duration.full) }}
                </div>
            </div>
            <div v-if="isMobile" class="np-devices">
                <!-- On mobile the bottom bar swaps the aux group for navigation,
                     so this is the only place a phone can reach group playback.
                     Small phones already get the full aux group above. -->
                <DevicesButton v-if="!isSmallPhone" />
            </div>
            <Volume v-if="isSmallPhone" class="np-volume" />
        </div>
        <h3 class="nowplaying_title" v-if="queue.next">Up Next</h3>
        <SongItem
            v-if="queue.next"
            :track="queue.next"
            :index="queue.nextindex + 1"
            :is_first="true"
            :is_last="true"
            :source="dropSources.folder"
            @play-this="queue.playNext"
        />
        <h3 class="nowplaying_title">Queue</h3>
    </div>
</template>

<script setup lang="ts">
import { paths } from '@/config'
import { dropSources, favType } from '@/enums'
import favoriteHandler from '@/helpers/favoriteHandler'
import { Routes } from '@/router'
import { isMobile, isSmallPhone } from '@/stores/content-width'
import useQueueStore from '@/stores/queue'
import { formatSeconds } from '@/utils'

import Progress from '@/components/LeftSidebar/NP/Progress.vue'
import Buttons from '../BottomBar/Right.vue'
import Volume from '../BottomBar/Volume.vue'
import SongItem from '../shared/SongItem.vue'
import NowPlayingInfo from './NowPlayingInfo.vue'
import PlayingFrom from './PlayingFrom.vue'

const queue = useQueueStore()

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
.now-playing-view.isSmall .now-playing-header .nowplaying_title {
    padding-left: 0.5rem;
}

.now-playing-header {
    padding-bottom: $smaller;
    position: relative;

    .nowplaying_title {
        padding-left: 1rem;
        margin: 1.25rem 0;

        &:last-child {
            padding-top: $large;
            margin: 1rem 0;
        }

        @media only screen and (max-width: 724px) {
            padding-left: 0.5rem;
        }

        /* Somehow has to be replaced by above now
        @include largePhones {
            padding-left: 0.5rem;
        }
        */
    }

    .below-progress {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;

        .time {
            font-size: $medium;
            font-weight: 500;
            color: $candy-text;
            background-color: $candy-pink-soft;
            border: 1px solid $mem-line;
            padding: 1px $smaller;
            min-width: 2.5rem;
            text-align: center;
            border-radius: $smaller;
            font-variant-numeric: tabular-nums;
        }

        /* Responsive */
        @include allPhones {
            .right-group button.speaker {
                border-top: 1px solid transparent !important;
                border-top-left-radius: 0 !important;
                border-top-right-radius: 0 !important;
            }
        }

        @include smallestPhones {
            position: relative;
            flex-direction: column;
            align-items: unset;
            gap: $small;

            .time:first-child {
                align-self: baseline;
                margin-left: 4px;
            }

            .time:last-child {
                align-self: end;
                position: absolute;
                top: 0;
                right: 4px;
            }

            .right-group {
                width: 100% !important;
                display: flex;
                justify-content: space-between;
            }
        }
    }

    // Volume gets its own full-width row in the mobile Now Playing view. In the
    // bottom bar the slider styling is .b-bar-scoped (and hidden on mobile), so
    // here the standalone control is styled explicitly: speaker icon + an
    // accessible horizontal slider on its own line (instead of being crammed —
    // and the slider mis-rendered — into the repeat/shuffle/lyrics row).
    .np-volume {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.85rem;
        padding: 0 0.25rem;

        .speaker-icon {
            flex-shrink: 0;
            height: 2.25rem;
            width: 2.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: transparent;
            border: none;
            cursor: pointer;

            // Shared 24x24 icon set: size it directly instead of scaling off
            // the viewBox, so it matches the other controls on this screen.
            svg {
                width: 1.45rem;
                height: 1.45rem;
            }
        }

        // Track pill, border and the white bordered thumb come from the global
        // range styling; only the flat teal played-volume fill is painted here
        // (clipped by the inline background-size from Volume.vue).
        .volume-slider {
            flex: 1;
            margin-right: 0; // neutralise the global range's 15px right margin
            background-image: linear-gradient($mem-teal, $mem-teal);
            background-repeat: no-repeat;
            // background-size is set inline from the current volume (Volume.vue).
        }
    }

    .centered {
        margin: 0 auto;
        width: 26rem;
        max-width: 100%;
    }

    .np-image {
        position: relative;
        display: block;
        margin-bottom: 1rem;
        // Match the cover's corner radius so the Lauflicht rim (border-radius:
        // inherit) traces the rounded image edge instead of a square.
        border-radius: 1rem;

        img {
            width: 100%;
            // Square the cover deterministically so the .np-image box — and the
            // Lauflicht rim drawn on it (inset:0) — hugs the image on every
            // device. height:100% resolved against this auto-height parent, which
            // is undefined: some devices left a gap so the rim missed the cover.
            height: auto;
            aspect-ratio: 1;
            max-width: 30rem;
            object-fit: cover;
            display: block;
            border: $candy-border;
        }
    }

    #progress {
        margin-top: 1rem;
        margin-right: 0;

        &::-moz-range-thumb {
            height: 0.8rem;
        }

        &::-webkit-slider-thumb {
            height: 0.8rem;
        }

        &::-ms-thumb {
            height: 0.8rem;
        }
    }
}
</style>