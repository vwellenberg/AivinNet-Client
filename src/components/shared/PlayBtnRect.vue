<template>
    <!-- Primary "Play" CTA: a bold teal memphis button with a subtle sprinkle
         texture and ink label + glyph, one consistent look on every header. -->
    <button
        v-wave
        class="playbtnrect shadow-sm circular btn-active"
        @click="playFrom(source)"
    >
        <playBtnSvg />
        <div class="text">Play</div>
    </button>
</template>

<script setup lang="ts">
import { playSources } from '@/enums'

import playBtnSvg from '@/assets/icons/play.svg'
import { playFrom } from '@/helpers/usePlayFrom'

defineProps<{
    source: playSources
}>()
</script>

<style lang="scss">
// `button.` prefix so the teal fill/border/radius win over the global button
// base, .btn-active and .circular (pill) without !important.
button.playbtnrect {
    position: relative;
    width: 6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $mem-teal;
    color: $mem-ink;
    border: $candy-border;
    border-radius: $candy-radius-sm;
    padding-right: 1rem;
    overflow: hidden; // clip the sprinkle overlay to the rounded corners
    // Quick scale on hover/press — matches the bottom-bar play button.
    transition: transform 0.1s ease;

    // Subtle sprinkle (terrazzo) texture over the teal fill. A translucent
    // ::before keeps the dashes faint so the "Play" label stays legible;
    // combining the pattern directly on the button reads too busy at this size.
    &::before {
        content: "";
        position: absolute;
        inset: 0;
        @include mem-sprinkle;
        opacity: 0.3;
        pointer-events: none;
        z-index: 0;
    }

    svg,
    .text {
        position: relative;
        z-index: 1;
    }

    svg {
        height: 1.75rem;
    }

    // Hover keeps the teal identity (primary action colour) and just scales —
    // no colour flip, so it stays distinct from the yellow "playing" states.
    &:hover {
        background-color: $mem-teal;
        transform: scale(1.06);
    }

    &:active {
        transform: scale(0.98);
    }
}
</style>
