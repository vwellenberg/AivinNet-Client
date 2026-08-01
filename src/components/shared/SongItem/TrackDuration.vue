<template>
    <div class="options-and-duration">
        <div
            class="heart-icon"
            :class="{ 'is_fav': is_fav && highlightFavoriteTracks }"
            @click.stop="$emit('toggleFav')"
        >
            <HeartSvg :state="is_fav" :no_emit="true" />
        </div>
        <div class="song-duration" :class="{ has_help_text: help_text }">{{ formatSeconds(duration) }}</div>
        <div class="song-duration help-text" v-if="help_text">
            {{ help_text }}
        </div>
        <button
            class="options-icon"
            type="button"
            title="More options"
            aria-label="More options"
            @click.stop="$emit('showMenu', $event)"
            @dblclick.stop="() => {}"
        >
            <OptionSvg />
        </button>
    </div>
</template>

<script setup lang="ts">
import OptionSvg from '@/assets/icons/more.svg'
import { formatSeconds } from '@/utils'
import HeartSvg from '../HeartSvg.vue'

defineProps<{
    duration: number
    is_fav: boolean
    showInlineFavIcon: boolean
    highlightFavoriteTracks: boolean
    showFavIcon?: boolean
    help_text?: string
}>()

defineEmits<{
    (e: 'showMenu', event: MouseEvent): void
    (e: 'toggleFav'): void
}>()
</script>

<style lang="scss">
.songlist-item > .options-and-duration {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 1rem;
    margin-right: $small;
    position: relative;

    .heart-icon {
        // Reserve the slot (visibility, not display) so the duration keeps the
        // same x-position regardless of favourite/hover state — stops the
        // duration jumping left on hover and misaligning fav vs non-fav rows.
        // (margin-right dropped: the flex `gap: 1rem` already spaces it; the
        // extra $small made the heart->duration gap wider than the others.)
        visibility: hidden;
        user-select: none;
        opacity: 0.6;
        transition: opacity $motion-tint $motion-curve;
        cursor: pointer;

        // No size and no `transform: scale()` here, and no `all: unset` on the
        // button below. The three went together: unsetting the role left the
        // button at content size, the 28px wrapper and the 0.8 scale put a
        // number back on it, and the result measured 22,4px — in a 72px row,
        // beside a 32px ⋯ button. The toggle sizes itself from its role now.
        &:hover {
            opacity: 1;
        }

        svg {
            color: $gray1;
        }

        @include mediumPhones {
            display: none;
        }
    }

    .heart-icon.is_fav {
        visibility: visible;

        svg {
            // Inline favorited heart: teal "active" accent — readable
            // on the light and dark grounds and on the filled row states
            // (SongItem.vue pins the same teal there).
            color: $mem-teal;
        }
    }

    .song-duration {
        font-size: small;
        font-variant-numeric: tabular-nums;
        text-align: left;
        // On the page ground -> theme-aware muted. Filled rows re-pin
        // ink-muted in SongItem.vue.
        color: $mem-content-muted;
        // Framed like a runtime printed on a sleeve. `currentColor` on purpose:
        // the row re-pins the text colour on every filled state (hover, playing,
        // context menu), and the ring has to follow it or it strands as a grey
        // outline on the yellow row.
        border: 2px solid currentColor;
        border-radius: $candy-radius-pill;
        padding: 0.12rem 0.5rem;
        font-weight: 600;
        // The help-text twin below is absolutely positioned and must NOT take
        // the frame — it is a caption, not a value.
        &.help-text {
            border: none;
            padding: 0;
        }

        @include mediumPhones {
            display: none;
        }

        transition: opacity 0.2s ease-out;
    }

    .song-duration.help-text {
        position: absolute;
        // INFO: 3 rem is the width of the options icon (2rem) plus the gap of the flex container (1rem)
        right: 3rem;
        font-size: $medium;
        text-transform: uppercase;
        color: $orange;
        opacity: 0;
        transition: opacity 0.2s ease-out;

        @include allPhones {
            right: 2.5rem;
        }
    }

    // A <button>, not a <div> with @click: it opens the row's context menu, so
    // it has to be reachable by keyboard and announce a name. Its 2rem box was
    // right all along — it is simply `$control-compact` now, from the token
    // rather than by coincidence, which is also what makes the favourite beside
    // it the same size instead of 10px smaller.
    .options-icon {
        @include btn-quiet($size: $control-compact, $glyph: $control-compact-glyph);

        svg {
            // Always-visible options glyph on the page ground -> theme-aware
            // muted so it stays legible on the dark indigo ground. Filled rows
            // re-pin ink-muted in SongItem.vue.
            stroke: $mem-content-muted;
        }
    }
}

// Removed with this change: two rules keyed on `.heart-icon.is-favorited`, a
// class the template never sets (it binds `is_fav`). Both were dead — one hid
// the favourited heart on medium phones, where `.heart-icon` is already
// `display: none`, the other faded it out on row hover, which contradicts the
// reserved-slot comment above. Restoring the intent is a decision, not a
// rename, so they are gone rather than quietly switched on.
</style>
