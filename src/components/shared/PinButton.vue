<template>
  <button
    class="pin-button circular"
    :class="{ pinned }"
    :title="pinned ? 'Unpin from library' : 'Pin to library'"
    @click.prevent="$emit('toggle')"
  >
    <PinFillSvg v-if="pinned" />
    <PinSvg v-else />
  </button>
</template>

<script setup lang="ts">
import PinSvg from '@/assets/icons/pin.svg'
import PinFillSvg from '@/assets/icons/pin.fill.svg'

defineProps<{
  pinned: boolean | undefined
}>()

defineEmits<{
  // eslint-disable-next-line no-unused-vars
  (event: 'toggle'): void
}>()
</script>

<style lang="scss">
.pin-button {
  // Shared header-action anatomy (44px square, theme-aware glyph, no squeeze).
  // The glyph used to inherit the global button base's STATIC ink, which made
  // the pin invisible on the dark page ground.
  //
  // The pin art itself carries padding in its viewBox (see pin.svg): its glyph
  // filled 95% of the old 28x29 box while every neighbouring glyph fills ~67% of
  // its own, so at an identical CSS size the pin rendered 23px tall next to
  // 14-16px siblings — visibly oversized, and its needle tip aliased badly.
  @include mem-header-action;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }

  svg {
    display: block;
  }

  // Pinned reads as "on": full strength, and the accent fill behind it.
  &.pinned {
    opacity: 1;
    background-color: $mem-blush;
    color: $mem-ink;
  }
}
</style>
