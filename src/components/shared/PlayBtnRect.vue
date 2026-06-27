<template>
    <!-- Green primary CTA with a black glyph + label (Spotify look). All call
         sites pass a bright bg (green headers / white Mixes), so black always
         reads. Deliberately reverses #53 (white-on-green via getTextColor). -->
    <button
        v-wave
        class="playbtnrect shadow-sm circular btn-active"
        :style="{
            backgroundColor: bg_color ? bg_color : '',
            borderColor: bg_color ? bg_color : '',
            color: bg_color ? '#0a0a0a' : '',
        }"
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
    bg_color?: string
}>()
</script>

<style lang="scss">
.playbtnrect {
    width: 6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $white;
    padding-right: 1rem;
    // Quick scale on hover/press — matches the bottom-bar play button.
    transition: transform 0.1s ease;

    svg {
        height: 1.75rem;
    }

    &:hover {
        transform: scale(1.06);
    }

    &:active {
        transform: scale(0.98);
    }
}
</style>
