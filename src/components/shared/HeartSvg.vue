<template>
    <button
        v-wave
        class="heart-button circular"
        :class="{ 'is-fav': state }"
        @click="!no_emit && $emit('handleFav')"
    >
        <Motion
            :initial="{
                opacity: 0,
            }"
            :animate="{
                opacity: 1,
                transition: {
                    delay: 0.25,
                    duration: 0.5,
                },
            }"
        >
            <CheckCircleSvg v-if="state" class="check-circle" />
            <PlusSvg v-else />
        </Motion>
    </button>
</template>

<script setup lang="ts">
import { Motion } from 'motion/vue'

import CheckCircleSvg from '@/assets/icons/check.circle.fill.svg'
import PlusSvg from '@/assets/icons/plus.svg'

defineProps<{
    state: Boolean | undefined
    no_emit?: Boolean
}>()

defineEmits<{
    // eslint-disable-next-line no-unused-vars
    (event: 'handleFav'): void
}>()
</script>

<style lang="scss">
.heart-button {
    line-height: normal;
    align-items: center;
    gap: $smaller;
    border: none;
    // Unfavorited: theme-text outline glyph (the plus) on a transparent
    // button — ink on light chrome, paper on dark.
    color: $candy-text;
    aspect-ratio: 1.5;
    background: transparent;

    div {
        height: max-content;
        transform: scale(1);

        svg {
            height: 1.75rem;
            width: 1.75rem;
            display: block;
        }

        // The two states are drawn to very different scales: the plus fills
        // ~52% of its viewBox, the check-circle fills 100% of its own (a solid
        // r=14 circle in a 28 box). At one CSS size the glyph therefore JUMPED
        // from ~13px to ~24px the moment a track was favourited, and the circle
        // sat flush against the edges of its button with no breathing room.
        // Trim the circle to the same optical weight; a disc reads slightly
        // larger than an outline glyph of equal height, so it keeps a little
        // more than the plus.
        .check-circle {
            height: 78%;
            width: 78%;
        }
    }

    &:hover {
        background: $candy-pink-soft;
        border: none;
    }

    // Favorited state: teal check circle (drives the SVG's currentColor
    // circle; the check itself is fixed white in the asset). Teal is the
    // theme-invariant "active" accent — readable on light and dark chrome
    // and on the yellow playing row.
    &.is-fav {
        color: $mem-teal;
    }
}
</style>
