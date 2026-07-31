<template>
    <!-- Status text only. Edit and Delete used to live here too, and that was
         the bug: this box is absolutely positioned in the header's bottom-right
         corner, so on a phone — where the status text hides — the two buttons
         landed beside the action row without belonging to it (4px higher, 30px
         away instead of the row's 8px). They are overflow actions and sit in
         the header's own row now, behind the ⋯ button in Header/Info.vue. -->
    <div v-if="!isHeaderSmall" class="last-updated">
        <span class="status">Last updated {{ playlist.info._last_updated }}</span>
    </div>
</template>
<script setup lang="ts">
import { isHeaderSmall } from '@/stores/content-width'

import usePStore from '@/stores/pages/playlist'

const playlist = usePStore()
</script>

<style lang="scss">
.last-updated {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    padding: $smaller $small;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: $smaller;
    z-index: 12;

    // Sits on the playlist header ground (square-image mode) -> theme-aware.
    // Banner-image mode overrides to $candy-white in Header.vue.
    color: $mem-content-text;

    display: flex;
    align-items: center;
    gap: $smaller;
}
</style>
