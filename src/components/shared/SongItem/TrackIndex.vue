<template>
  <div
    class="index t-center ellip"
    @dblclick.prevent.stop="() => {}"
  >
    <div
      v-if="is_current"
      class="now-playing-wave"
      :class="{ paused: !is_current_playing }"
      aria-hidden="true"
    >
      <svg id="wave" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 30">
        <title>Now playing</title>
        <rect id="Line_1" x="1" y="11" width="2" height="8" rx="1" ry="1" />
        <rect id="Line_2" x="4" y="8" width="2" height="14" rx="1" ry="1" />
        <rect id="Line_3" x="7" y="4" width="2" height="22" rx="1" ry="1" />
        <rect id="Line_4" x="10" y="6" width="2" height="18" rx="1" ry="1" />
        <rect id="Line_5" x="13" y="11" width="2" height="8" rx="1" ry="1" />
        <rect id="Line_6" x="16" y="6" width="2" height="18" rx="1" ry="1" />
        <rect id="Line_7" x="19" y="4" width="2" height="22" rx="1" ry="1" />
        <rect id="Line_8" x="22" y="8" width="2" height="14" rx="1" ry="1" />
        <rect id="Line_9" x="25" y="11" width="2" height="8" rx="1" ry="1" />
      </svg>
    </div>
    <div v-else class="text">
      {{ index }}
    </div>
  </div>
</template>

<script setup lang="ts">
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

  // Now-playing equalizer shown in place of the track number (issue #67).
  // Animates while playing; freezes (static bars) when paused.
  .now-playing-wave {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    svg {
      width: 1.05rem;
      height: auto;
      fill: $candy-black;
    }

    @for $i from 1 through 9 {
      #Line_#{$i} {
        animation: nowPlayingWave 0.6s infinite;
        animation-delay: $i * 0.12s;
        transform: scaleY(0.8);
        transform-origin: center;
      }
    }

    &.paused {
      @for $i from 1 through 9 {
        #Line_#{$i} {
          animation-play-state: paused;
        }
      }
    }
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

@keyframes nowPlayingWave {
  0% {
    transform: scaleY(0.8);
    transform-origin: 50% 50%;
  }

  50% {
    transform: scaleY(0.6);
    transform-origin: 50% 50%;
  }

  100% {
    transform: scaleY(0.8);
    transform-origin: 50% 50%;
  }
}
</style>
