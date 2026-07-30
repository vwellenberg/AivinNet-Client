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

  svg {
    display: block;
  }

  // No button-level `opacity` here. It used to dim the unpinned state to 0.7,
  // which was fine while the mixin drew nothing — but opacity fades the whole
  // element, so once the mixin gained a border and an offset shadow it washed
  // those out too and the button read as unfinished next to its siblings.
  //
  // "Pinned" is carried by the GLYPH, not by a fill: the filled pin plus the
  // teal accent, exactly how the favourite toggle signals "on". It used to take
  // the blush fill — the same fill the mixin uses for HOVER — so a pinned
  // button looked permanently hovered and the two states were indistinguishable.
  // Blush now means "the pointer is here"; teal means "this is on".
  // `:hover` is restated because the mixin sets `color` there and would
  // otherwise flip the teal back to ink.
  &.pinned,
  &.pinned:hover {
    color: $mem-teal;
  }
}
</style>
