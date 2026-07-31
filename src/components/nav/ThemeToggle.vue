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
    // One chrome footprint, desktop and phone. It used to be 2.25rem on the
    // desktop (sized to the avatar beside it) and 2.75rem on phones, which put
    // a 36px control next to a 48px home button in the same row and made the
    // touch target a breakpoint's job rather than the control's.
    //
    // Nothing but the fill is stated here: the role owns border, shadow, glyph
    // size and BOTH pointer answers. The local `svg { 1.3rem }` made this the
    // one 20.8px glyph in a bar of 24px ones, and the local
    // `:active { scale(0.94) }` was a third press behaviour next to the role's
    // 0.98 and the home button's push-into-the-shadow.
    @include btn-action($size: $bar-control);
    background-color: $candy-pink;
    color: $candy-black;

    &:hover {
        background-color: $candy-pink-deep;
    }
}
</style>
