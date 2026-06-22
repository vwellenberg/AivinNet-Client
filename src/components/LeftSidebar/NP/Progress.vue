<template>
    <input
        id="progress"
        type="range"
        :value="time.current"
        min="0"
        :max="time.full"
        step="0.1"
        :style="{
            background: `#3a3a3c linear-gradient(90deg, ${accent} ${currentPercent}%, #48484a ${currentPercent}%, #48484a ${maxSeekPercent}%, #3a3a3c ${maxSeekPercent}%)`,
        }"
        @change="seek"
        @click="seek"
    />
</template>

<script setup lang="ts">
import { maxSeekPercent } from '@/stores/player'
import useQStore from '@/stores/queue'
import useColorStore from '@/stores/colors'
import { computed } from 'vue'

const q = useQStore()
const colors = useColorStore()

const { duration: time } = q

// Played portion glows in the current track's cover accent (#32, colors.theme1
// = LightVibrant); brand-red fallback before colour extraction finishes.
const accent = computed(() => colors.theme1 || '#FF284E')

let prevHash = ''

const seek = (e: Event) => {
    if (prevHash && prevHash !== q.currenttrackhash) {
        prevHash = ''
        return
    }

    const elem = e.target as HTMLInputElement
    const value = elem.value

    prevHash = q.currenttrackhash
    q.seek(value as unknown as number)
}

const currentPercent = computed(() => (time.current / (time.full || 1)) * 100)
</script>
