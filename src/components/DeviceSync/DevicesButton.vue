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
