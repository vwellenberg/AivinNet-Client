<template>
    <button class="devices-btn" :class="{ 'ds-joined': ds.joined }" :title="title" @click="modal.showDevicesModal()">
        <DevicesSvg />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import DevicesSvg from '@/assets/icons/devices.svg'
import useDeviceSync from '@/stores/devicesync'
import useModal from '@/stores/modal'

const ds = useDeviceSync()
const modal = useModal()

const title = computed(() => (ds.joined ? 'Devices — group playback active' : 'Devices'))
</script>

<style lang="scss">
// The "group session active" look lives HERE, not in the bars that host this
// button — it is a state of the button, and the two hosts (BottomBar/Right.vue
// on desktop, BottomBar/Left.vue on small phones) had drifted into two
// different treatments (green fill vs. green glyph, neither with a frame).
//
// Every other filled control in this design carries the ink frame; the joined
// state is the app's loudest "on" and was the one that did not.
.devices-btn.ds-joined {
    @include candy-box($brand-green, $candy-radius-sm);

    // White glyph on the green fill — static in both themes, like the ink
    // glyph on the yellow transport boxes.
    svg path {
        fill: $mem-panel-static;
    }
}
</style>
