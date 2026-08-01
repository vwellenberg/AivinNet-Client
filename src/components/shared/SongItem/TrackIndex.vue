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

  // No transition: the number is not animated into anything. It is swapped for
  // the meter by `v-if`, and a node that enters the DOM has no previous value
  // to travel from. Measured on a hovered row: nothing on `.text` changes.
  .text {
    opacity: 0.5;
    margin: auto 0;
    transform: translateX($smaller);
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

  // NOTE: A `.heart-icon` block used to sit here, from when the favourite
  // marker lived next to the track number. It moved to the duration column
  // long ago — the element this styled never appears inside `.index`, so the
  // rules (including a `transition: all`) applied to nothing. The live one is
  // in TrackDuration.vue; do not restore a second copy here.
}
</style>
