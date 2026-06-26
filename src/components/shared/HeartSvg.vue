<template>
    <button
        v-wave
        class="heart-button circular"
        :class="{ 'is-fav': state }"
        :style="{
            color: state ? '' : color ? getTextColor(color) : '',
        }"
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
            <CheckCircleSvg v-if="state" />
            <PlusSvg v-else />
        </Motion>
    </button>
</template>

<script setup lang="ts">
import { Motion } from 'motion/vue'

import CheckCircleSvg from '@/assets/icons/check.circle.fill.svg'
import PlusSvg from '@/assets/icons/plus.svg'

import { getTextColor } from '@/utils/colortools/shift'

defineProps<{
    state: Boolean | undefined
    no_emit?: Boolean
    color?: string
}>()

defineEmits<{
    // eslint-disable-next-line no-unused-vars
    (event: 'handleFav'): void
}>()
</script>

<style lang="scss">
$bg: rgb(255, 255, 255);

.heart-button {
    line-height: normal;
    align-items: center;
    gap: $smaller;
    border: none;
    color: $bg;
    aspect-ratio: 1.5;
    background: rgba(255, 255, 255, 0.13);

    div {
        height: max-content;
        transform: scale(1);

        svg {
            height: 1.75rem;
            width: 1.75rem;
            display: block;
        }
    }

    &:hover {
        background: transparent;
        border: none;
    }

    // Favorited state: brand-green check circle (drives the SVG's
    // currentColor circle; the check itself is fixed white in the asset).
    &.is-fav {
        color: $brand-green;
    }
}
</style>
