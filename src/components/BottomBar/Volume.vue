<template>
    <div class="volume-control" @wheel.passive="handleMouseWheel">
        <button class="speaker-icon" title="Stummschalten" @click="settings.toggleMute">
            <VolumeMuteSvg v-if="settings.mute || settings.volume == 0.0" />
            <VolumeMidSvg v-else-if="settings.volume > 0.5" />
            <VolumeLowSvg v-else />
        </button>
        <input
            class="volume-slider"
            type="range"
            name="volume"
            max="1"
            min="0"
            step="0.01"
            :value="settings.mute ? 0 : settings.volume"
            @input="changeVolume"
            :style="{
                backgroundSize: `${(settings.mute ? 0 : settings.volume) * 100}% 100%`,
            }"
        />
    </div>
</template>

<script setup lang="ts">
import VolumeLowSvg from '@/assets/icons/volume-low.svg'
import VolumeMidSvg from '@/assets/icons/volume-mid.svg'
import VolumeMuteSvg from '@/assets/icons/volume-mute.svg'
import useSettingsStore from '@/stores/settings'

const settings = useSettingsStore()

const changeVolume = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (settings.mute) settings.toggleMute()
    settings.setVolume(parseFloat(target.value))
}

const handleMouseWheel = (event: WheelEvent) => {
    const delta = event.deltaY / 1000
    let newVolume = settings.volume - delta / 3

    if (newVolume > 1) newVolume = 1
    if (newVolume < 0) newVolume = 0

    settings.setVolume(newVolume)
}
</script>

<style lang="scss">
.b-bar .right-group .volume-control {
    display: flex;
    align-items: center;
    gap: 2px;

    .speaker-icon {
        height: 2.25rem !important;
        width: 2.25rem !important;
        background-color: transparent;
        border: none !important;

        svg {
            transform: scale(0.72);
        }

        &:hover {
            background-color: transparent !important;
            opacity: 0.85;
        }
    }

    // Horizontal volume slider. Track pill, 2px black border and the white
    // bordered thumb all come from the global candy range styling
    // (ProgressBar.scss). Only the played-volume fill is painted here — a flat
    // deeper-pink band (no stripes for volume) clipped by the inline
    // background-size from the current volume level.
    .volume-slider {
        width: 6rem;
        min-width: 4rem;
        margin-right: 0; // neutralise the global range's 15px right margin
        background-image: linear-gradient($candy-pink-deep, $candy-pink-deep);
        background-repeat: no-repeat;
        // background-size set inline from the current volume.
    }

    @include allPhones {
        .volume-slider {
            display: none;
        }
    }
}
</style>
