<template>
    <!-- Primary "Play" CTA: a bold black candy button with white label + glyph,
         one consistent look on every header. -->
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
// `button.` prefix so the black fill/border/radius win over the global button
// base, .btn-active (pink-deep) and .circular (pill) without !important.
button.playbtnrect {
    width: 6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $candy-black;
    color: $candy-white;
    border: $candy-border;
    border-radius: $candy-radius-sm;
    padding-right: 1rem;
    // Quick scale on hover/press — matches the bottom-bar play button.
    transition: transform 0.1s ease;

    svg {
        height: 1.75rem;
    }

    &:hover {
        background-color: $candy-black;
        transform: scale(1.06);
    }

    &:active {
        transform: scale(0.98);
    }
}
</style>
