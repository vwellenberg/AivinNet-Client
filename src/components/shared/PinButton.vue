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
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  padding: 0.5rem;
  transition: opacity 0.15s, background 0.15s;

  &:hover {
    opacity: 1;
    background: $candy-pink-soft;
  }

  svg {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
  }

  &.pinned {
    opacity: 1;

    svg {
      color: $candy-black;
    }
  }
}
</style>
