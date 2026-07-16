<template>
  <div class="switch rounded" :class="{ toggled: state }">
    <div class="circle circular"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  state: undefined | boolean;
}>();
</script>

<style lang="scss">
.switch {
  height: 1.5rem;
  background-color: $candy-pink-soft;
  border: 1px solid $mem-line;
  width: 2.5rem;
  padding: $smaller;
  position: relative;
  transition: all 0.25s ease;
  cursor: pointer;

  .circle {
    transition: all 0.25s ease;
    height: 1rem;
    aspect-ratio: 1;
    // Static-white knob with a static ink ring: the knob rides ON the track
    // fill, so a paper (var) border would vanish in dark — keep it ink.
    background-color: $mem-panel-static;
    border: 1px solid $mem-ink;
    position: absolute;
    left: $smaller;
  }
}

.toggled {
  background-color: $candy-pink-deep;
  transition-delay: 0.15s;

  .circle {
    background-color: $mem-panel-static;
    left: calc((100% - ($smaller + 1rem)));
  }
}
</style>
