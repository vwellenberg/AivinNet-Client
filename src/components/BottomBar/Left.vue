<template>
    <div v-auto-animate class="left-group">
        <HeartSvg
            v-if="settings.use_np_img && !isMobile"
            :state="queue.currenttrack?.is_favorite"
            @handleFav="$emit('handleFav')"
        />
        <RouterLink
            v-else
            title="Go to Now Playing"
            :to="{
                name: Routes.nowPlaying,
                params: {
                    tab: 'home',
                },
                replace: true,
            }"
            class="np-image lauflicht-rim rounded-sm no-scroll"
        >
            <img :src="paths.images.thumb.small + queue.currenttrack?.image" alt="" />
            <div class="expandicon">
                <ExpandSvg />
            </div>
        </RouterLink>
        <div class="track-info">
            <div v-tooltip class="title">
                <span class="ellip">
                    {{ queue.currenttrack?.title || 'Hello there' }}
                </span>
                <ExplicitIcon class="explicit-icon" v-if="queue.currenttrack?.explicit" />
                <MasterFlag :bitrate="queue.currenttrack?.bitrate || 0" />
            </div>
            <ArtistName
                :artists="queue.currenttrack?.artists || []"
                :albumartists="queue.currenttrack?.albumartists || 'Welcome to AivinNet'"
                class="artist"
            />
        </div>
        <HeartSvg
            v-if="!isMobile"
            class="np-fav"
            title="Favorite"
            :state="queue.currenttrack?.is_favorite"
            @handleFav="$emit('handleFav')"
        />
        <!-- Silence is a dead end on a small phone: this bar has no volume
             control (the right group is the navigation there), so the only
             speaker in the app sits far down the Now Playing page — and a
             muted state is persisted, or arrives from another device in a
             group session. Whenever there is no sound, the way back is right
             here on every page; when there is, nothing is shown and the bar
             keeps its room for the track title. -->
        <button
            v-if="phoneBar && settings.is_silent"
            class="bar-unmute"
            title="Unmute"
            @click="settings.toggleMute"
        >
            <VolumeMuteSvg />
        </button>
        <!-- Not in a short viewport. A landscape phone is the SAME device as a
             portrait one, and portrait has never had this group: it falls in
             the 660-900px band only because it is turned over, and then gets
             repeat, shuffle, favourite, lyrics, devices and volume that the
             upright phone does without. Dropping it here is not taking
             something away from landscape, it is ending an inconsistency —
             measured, the bar held 9 controls sideways against 4 upright. -->
        <Actions v-if="!phoneBar && isLargerMobile" @handleFav="$emit('handleFav')" />
        <HotKeys v-if="isMobile" />
        <!-- Small phones only get HotKeys here (Actions covers the larger ones),
             so without this the Devices button was buried in the Now Playing
             view and unreachable from the bar itself.

             It steps aside while the player is silent, and that is a decision
             about which of the two matters more in that moment. Five controls
             do not fit a 360px phone: cover 48 + unmute 44 + transport 164 +
             devices 44 is 300 of the 328 available, which left the title 12px
             and its text ran straight under the unmute box. Silence means
             nothing is audible anywhere, so "get the sound back" outranks "play
             this in sync with another device" — and Devices stays reachable on
             the Now Playing page, which is where it lived before it was added
             here. -->
        <DevicesButton v-if="phoneBar && !settings.is_silent" class="bar-devices" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { paths } from '@/config'
import { Routes } from '@/router'

import { isLargerMobile, isMobile, isShort } from '@/stores/content-width'
import useQStore from '@/stores/queue'
import useSettingsStore from '@/stores/settings'

import ExpandSvg from '@/assets/icons/expand.svg'
import VolumeMuteSvg from '@/assets/icons/volume-mute.svg'
import ArtistName from '@/components/shared/ArtistName.vue'
import DevicesButton from '../DeviceSync/DevicesButton.vue'
import HotKeys from '../LeftSidebar/NP/HotKeys.vue'
import HeartSvg from '../shared/HeartSvg.vue'
import MasterFlag from '../shared/MasterFlag.vue'
import Actions from './Right.vue'
import ExplicitIcon from '@/assets/icons/explicit.svg'

const queue = useQStore()
const settings = useSettingsStore()

/**
 * This bar is the PHONE bar: cover, title, transport, and one of unmute /
 * devices — the four controls an upright phone has always had.
 *
 * The 660-900px band (`isLargerMobile`) otherwise gets the richer group with
 * repeat, shuffle, favourite, lyrics, devices and volume. A landscape phone
 * lands in that band purely because it is turned over, and then carries nine
 * controls where the same device upright carries four. `isShort` pulls it back:
 * one device, one bar.
 *
 * Stated once and read three times, because the unmute button and the devices
 * button have to agree with it — a landscape phone that lost the volume control
 * with `Actions` and did NOT gain the unmute button would be exactly the silent
 * dead end #326 closed.
 */
const phoneBar = computed(() => isMobile.value && (!isLargerMobile.value || isShort.value))

defineEmits<{
    (e: 'handleFav'): void
}>()
</script>

<style lang="scss">
.left-group {
    display: flex;
    gap: $medium;

    // The way out of silence, phone bar only (see the template). It is not a
    // volume control — it exists only while there is nothing to hear — so it
    // wears the same yellow "on" box as an active shuffle or repeat: a state
    // that is switched off with one tap, rather than a glyph to interpret.
    .bar-unmute {
        @include btn-quiet($size: $bar-control, $glyph: $bar-glyph);
        @include btn-toggle-on;
    }

    // Devices button in the mobile bar: same footprint as a HotKeys control,
    // pinned to the end so the track title keeps the flexible space. Reads the
    // shared bar tokens rather than restating a size — that is the whole point
    // of them.
    .bar-devices {
        flex-shrink: 0;
        height: $bar-control;
        width: $bar-control;
        display: flex;
        align-items: center;
        justify-content: center;
        // Stated, not inherited: the rounded corner used to come from the
        // global button base. The joined state re-declares it with its own
        // green box, so only the idle one was left square.
        border-radius: $candy-radius-sm;
        cursor: pointer;

        svg {
            width: $bar-glyph;
            height: $bar-glyph;
        }

        // Idle only: bare glyph on the bar. The joined state keeps the shared
        // green box + ink frame from DevicesButton.vue, so these must not
        // strip its border/fill (they are more specific than the component's
        // own rule and used to win).
        &:not(.ds-joined) {
            border: none;
            background-color: transparent;
            color: $candy-text;
        }
    }
    align-items: center;
    font-size: small;
    font-weight: 700;
    line-height: 1.2;
    margin-right: $medium;

    // Favorite check next to the title (Spotify-style), desktop only.
    // Compact: the shared HeartSvg renders a 1.75rem glyph, too chunky for the
    // bar. height + width !important square the hit-box (overriding HeartSvg's
    // aspect-ratio: 1.5) so the trimmed 1.3rem glyph below stays contained.
    .np-fav {
        height: 1.6rem !important;
        width: 1.6rem !important;
        border: none !important;
        background-color: transparent !important;
        flex-shrink: 0;

        &:hover {
            background-color: transparent !important;
            opacity: 0.85;
        }

        // Smaller glyph — scoped to the title-side check ONLY, so the
        // use_np_img cover-replacement heart and the mobile Actions heart
        // keep their 1.75rem size.
        div svg {
            height: 1.3rem;
            width: 1.3rem;
        }
    }

    .np-image {
        position: relative;
        height: 3rem;

        // Lauflicht comet ring around the playing cover (always visible here).
        // The soft green bloom is suppressed in the compact bar — it would be
        // clipped by no-scroll (overflow:hidden) anyway; the bloom lives on the
        // bigger now-playing surfaces (sidebar card / full NP view).
        &.lauflicht-rim::after {
            display: none;
        }

        img {
            height: 100%;
            width: auto;
            aspect-ratio: 1;
            object-fit: cover;
            // Block-level so the inline baseline gap doesn't make .np-image
            // taller than the cover — that gap let the Lauflicht rim miss the
            // bottom edge instead of tracing all the way around.
            display: block;
            border: $candy-border;
            border-radius: $candy-radius-sm;
        }

        .expandicon {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(51, 51, 51, 0.6);

            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s ease-out, height 0.2s ease-out, transform 0.2s ease-out,
                background-color 0.2s ease-out;

            svg {
                transform: rotate(-90deg) scale(0.92);
            }
        }

        &:hover {
            .expandicon {
                transform: translateY(-$medium);
                height: 130%;
            }
        }

        &:active {
            .expandicon {
                background-color: rgba(51, 51, 51, 0.74);
            }
        }

        @include largePhones {
            flex-shrink: 0;
            margin-right: $medium;
        }

        @include smallerPhones {
            margin-right: $small;
        }
    }

    .heart-button {
        height: 3rem;
        width: 3rem;
        border: solid 1px $gray4;
        padding: 0;
    }

    .track-info {
        // Flex child: allow the title to truncate (ellipsis) and keep the
        // favorite heart hugging the title instead of being pushed to the
        // right edge near the transport controls.
        min-width: 0;
        max-width: 15rem;
        // `min-width: 0` above lets this box shrink, but shrinking is not
        // clipping: without this the title kept painting at its natural width
        // and ran UNDER the next control. That is what the unmute button
        // exposed — the box was 12px wide and the words were still there.
        overflow: hidden;

        .title {
            color: $candy-text;
            display: flex;
            align-items: center;
            margin-bottom: 2px;
            // A flex container's items refuse to shrink past min-content by
            // default, so the `.ellip` span inside never reached its own
            // ellipsis and pushed this row wider than its parent instead.
            min-width: 0;
        }

        .artistname {
            color: $candy-text-muted;

            a {
                font-size: 0.8rem;
            }
        }

        @include allPhones {
            width: calc(100% + 8px);
        }

        @include largePhones {
            width: unset;
            flex-grow: 1;
        }
    }

    @include allPhones {
        display: grid;
        // Cover, then the title takes the rest, then one max-content column per
        // control that happens to be there. The controls are conditional — the
        // unmute button only exists while the player is silent — so the trailing
        // columns are implicit; a fixed four-column template dropped the fifth
        // control onto a second row and doubled the bar's height.
        grid-auto-flow: column;
        grid-template-columns: max-content 1fr;
        grid-auto-columns: max-content;
        margin-right: unset;

        .heart-button {
            height: max-content;
            border: 1px solid transparent;
        }
    }

    @include largePhones {
        display: flex;
        gap: 0;
        max-width: calc(100% - 8px);
    }
}
</style>
