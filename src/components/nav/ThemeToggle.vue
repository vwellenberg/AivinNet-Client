<template>
    <button class="theme-toggle" :title="title" @click="settings.toggleTheme">
        <MoonSvg v-if="settings.theme === 'light'" />
        <SunSvg v-else />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import useSettings from '@/stores/settings'

import MoonSvg from '@/assets/icons/moon.svg'
import SunSvg from '@/assets/icons/sun.svg'

const settings = useSettings()

// The glyph shows what the click will DO (moon = switch to dark), so the title
// has to say the same thing or the two contradict each other. Mentioning the
// side effect matters: toggling by hand turns automatic switching off.
const title = computed(() => {
    const target = settings.theme === 'light' ? 'dark' : 'light'
    return settings.auto_theme ? `Switch to ${target} mode (turns off Auto dark mode)` : `Switch to ${target} mode`
})
</script>

<style lang="scss">
.theme-toggle {
    flex-shrink: 0;
    // Sized to the 36px avatar it sits next to so the two read as a pair,
    // matching how .mobile-header-action pairs with it.
    width: 2.25rem;
    height: 2.25rem;
    @include candy-box($candy-pink, $candy-radius-sm);
    display: grid;
    place-items: center;
    color: $candy-black;
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.15s ease;

    svg {
        width: 1.3rem;
        height: 1.3rem;
    }

    &:hover {
        background-color: $candy-pink-deep;
    }

    &:active {
        transform: scale(0.94);
    }
}
</style>
