<template>
  <button
    type="button"
    class="pluginfindlyricsbtn"
    :class="{ showError: plugin.error }"
    @click="!plugin.error ? plugin.searchLyrics() : null"
  >
    <span v-if="plugin.error">{{ plugin.error }}</span>
    <span v-else-if="plugin.loading"> Searching... </span>
    <span v-else>Search online</span>
    <span v-if="plugin.loading" class="spinner"></span>
  </button>
</template>

<script setup lang="ts">
import useLyricsPlugin from "@/stores/plugins/lyrics";

const plugin = useLyricsPlugin();
</script>

<style lang="scss">
.pluginfindlyricsbtn {
  // The action on the empty state is a primary CTA, so it takes the role
  // instead of hand-writing a surface ($white/$black are the legacy aliases
  // this file still carried, and they point at theme vars now — the label was
  // the same colour as the fill in one of the two themes).
  @include btn-primary($h: auto);
  min-height: 2.75rem;
  margin-top: $medium;
  padding: $small 1.25rem;

  &.showError {
    // Still a plate, but the failure colour. Ink on coral in both themes.
    background-color: $mem-coral;
    cursor: default;
  }

  .spinner {
    margin-left: $medium;
    height: 1rem;
    width: 1rem;
  }
}
</style>
