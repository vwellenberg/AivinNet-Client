<template>
    <div class="devices-modal">
        <p v-if="ds.joined" class="group-hint">Group listening — playback is synced across joined devices.</p>

        <div v-if="sortedDevices.length === 0" class="empty">No devices online. Open AivinNet on another device to see it here.</div>

        <div v-for="device in sortedDevices" :key="device.device_id" class="device-row rounded-sm" :class="{ offline: !device.online }">
            <div class="info">
                <div class="name">
                    {{ device.name }}
                    <span v-if="device.device_id === ds.deviceId" class="tag this-device">This device</span>
                </div>
                <div class="meta">
                    <span class="dot" :class="{ online: device.online }"></span>
                    {{ device.online ? 'Online' : 'Offline' }} · {{ device.type === 'mobile' ? 'Mobile' : 'Desktop' }}
                </div>
            </div>

            <div class="controls">
                <template v-if="device.joined">
                    <input
                        class="vol"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        :value="volumeFor(device)"
                        :title="'Volume'"
                        @change="onVolumeChange(device, $event)"
                    />
                    <button class="mute" :class="{ active: muteFor(device) }" :title="muteFor(device) ? 'Unmute' : 'Mute'" @click="toggleMute(device)">
                        {{ muteFor(device) ? 'Muted' : 'Mute' }}
                    </button>
                </template>

                <button
                    v-if="device.device_id === ds.deviceId"
                    class="join"
                    :class="{ leave: ds.joined }"
                    @click="ds.joined ? ds.leave() : ds.join()"
                >
                    {{ ds.joined ? 'Leave' : 'Join group' }}
                </button>
                <button
                    v-else-if="device.online && !device.joined"
                    class="join"
                    title="Ask this device to join group playback"
                    @click="invite(device)"
                >
                    Invite
                </button>
            </div>
        </div>

        <button v-if="ds.joined && joinedOthers.length > 0" class="play-here rounded-sm" @click="playHereOnly">
            Play here only
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

import useDeviceSync from '@/stores/devicesync'
import useSettings from '@/stores/settings'
import type { DeviceSummary } from '@/requests/devicesync'

const emit = defineEmits<{
    (event: 'setTitle', title: string): void
}>()

const ds = useDeviceSync()
const settings = useSettings()

onMounted(() => emit('setTitle', 'Devices'))

// This device first, then online before offline.
const sortedDevices = computed(() =>
    [...ds.devices].sort((a, b) => {
        if (a.device_id === ds.deviceId) return -1
        if (b.device_id === ds.deviceId) return 1
        return Number(b.online) - Number(a.online)
    })
)

const joinedOthers = computed(() => ds.devices.filter(d => d.joined && d.device_id !== ds.deviceId))

function volumeFor(device: DeviceSummary): number {
    if (device.device_id === ds.deviceId) return settings.volume
    return device.volume ?? 1
}

function muteFor(device: DeviceSummary): boolean {
    if (device.device_id === ds.deviceId) return settings.mute
    return !!device.mute
}

function onVolumeChange(device: DeviceSummary, e: Event) {
    const volume = parseFloat((e.target as HTMLInputElement).value)
    if (device.device_id === ds.deviceId) {
        settings.setVolume(volume)
        return
    }
    void ds.sendCmd('set_volume', { volume }, device.device_id)
}

function toggleMute(device: DeviceSummary) {
    if (device.device_id === ds.deviceId) {
        settings.toggleMute()
        return
    }
    void ds.sendCmd('set_mute', { mute: !device.mute }, device.device_id)
}

function invite(device: DeviceSummary) {
    void ds.sendCmd('join_invite', {}, device.device_id)
}

function playHereOnly() {
    for (const device of joinedOthers.value) {
        void ds.sendCmd('play_here', {}, device.device_id)
    }
}
</script>

<style lang="scss">
.devices-modal {
    display: grid;
    gap: $small;

    .group-hint {
        font-size: 0.85rem;
        color: $brand-green;
        margin: 0;
    }

    .empty {
        opacity: 0.75;
        font-size: 0.9rem;
        padding: 1rem 0;
    }

    .device-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: $small;
        padding: $small 1rem;
        background-color: rgba(125, 125, 125, 0.12);

        &.offline {
            opacity: 0.55;
        }

        // Flex children default to min-width:auto, which lets a long name
        // widen the row instead of ellipsizing.
        .info {
            min-width: 0;
        }

        .name {
            font-weight: 600;
            // Long device names must ellipsize instead of pushing the row's
            // controls off a narrow phone screen.
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            .tag.this-device {
                // Never split "This device" across two lines on a phone.
                white-space: nowrap;
                font-size: 0.7rem;
                font-weight: 700;
                text-transform: uppercase;
                color: $brand-green;
                margin-left: 0.35rem;
            }
        }

        .meta {
            font-size: 0.8rem;
            opacity: 0.8;
            display: flex;
            align-items: center;
            gap: 0.35rem;

            .dot {
                width: 0.5rem;
                height: 0.5rem;
                border-radius: 50%;
                background-color: grey;

                &.online {
                    background-color: $brand-green;
                }
            }
        }

        .controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-shrink: 0;

            .vol {
                width: 6rem;
                accent-color: $brand-green;
            }

            button {
                border: none;
                cursor: pointer;
                padding: 0.4rem 0.8rem;
                border-radius: 0.5rem;
                background-color: rgba(125, 125, 125, 0.2);

                &.join {
                    background-color: $brand-green;
                    color: white;

                    &.leave {
                        background-color: rgba(125, 125, 125, 0.25);
                        color: inherit;
                    }
                }

                &.mute.active {
                    background-color: $brand-red;
                    color: white;
                }
            }
        }
    }

    .play-here {
        border: none;
        cursor: pointer;
        padding: 0.6rem 1rem;
        justify-self: start;
        background-color: rgba(125, 125, 125, 0.2);

        &:hover {
            background-color: $brand-green;
            color: white;
        }
    }
}
</style>
