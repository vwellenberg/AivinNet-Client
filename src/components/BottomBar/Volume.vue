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

    // Always-visible horizontal volume slider (Spotify-style).
    .volume-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 6rem;
        min-width: 4rem;
        height: 4px;
        border-radius: 2px;
        cursor: pointer;
        outline: none;
        background-color: $gray4;
        background-image: linear-gradient(#fff, #fff);
        background-repeat: no-repeat;
        // background-size set inline from the current volume.

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 12px;
            width: 12px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        &::-moz-range-thumb {
            height: 12px;
            width: 12px;
            border: none;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            opacity: 0;
        }

        &:hover {
            background-image: linear-gradient($brand-green, $brand-green);

            &::-webkit-slider-thumb {
                opacity: 1;
            }
            &::-moz-range-thumb {
                opacity: 1;
            }
        }
    }

    @include allPhones {
        .volume-slider {
            display: none;
        }
    }
}
</style>
