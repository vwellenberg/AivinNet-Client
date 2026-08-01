<template>
  <div
    class="index t-center ellip"
    @dblclick.prevent.stop="() => {}"
  >
    <div v-if="is_current" class="now-playing-meter">
      <PlayingMeter :playing="is_current_playing" />
    </div>
    <div v-else class="text">
      {{ index }}
    </div>
  </div>
</template>

<script setup lang="ts">
import PlayingMeter from '@/components/shared/PlayingMeter.vue';

defineProps<{
  index: number | string;
  is_fav: boolean | undefined;
  showInlineFavIcon: boolean;
  is_current?: boolean;
  is_current_playing?: boolean;
}>();

defineEmits<{
  (e: "addToFav"): void;
}>();
</script>

<style lang="scss">
.songlist-item > .index {
  font-size: 0.8rem;
  width: 100%;
  position: relative;
  height: 3rem;
  display: flex;
  justify-content: center;

  .text {
    opacity: 0.5;
    margin: auto 0;
    transform: translateX($smaller);

    transition: all 0.25s;
    width: 100%;
  }

  // Now-playing meter shown in place of the track number (#67, redrawn in #357).
  // Animation, geometry and the paused state all live in PlayingMeter.vue.
  .now-playing-meter {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    // This row is always `.songlist-item.current`, i.e. $mem-yellow. Measured
    // against that fill, $mem-coral is 1.98:1 and misses the 3:1 WCAG 1.4.11
    // floor for graphics, so the peak drops back to the row ink (9.64:1). The
    // accent lives where it reads: on the dark player bar.
    --meter-peak: currentColor;
  }

  .heart-icon {
    position: absolute;
    left: -2px;
    display: grid;
    height: 100%;
    align-content: center;
    transition: all 0.2s;
    transform: translateX(-1.5rem);

    button {
      border: none;
      width: 2rem;
      height: 2rem;
      padding: 0;
      background-color: transparent;
    }
  }
}
</style>
