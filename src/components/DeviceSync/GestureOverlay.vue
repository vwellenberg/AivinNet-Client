<template>
    <!-- Autoplay-blocked group join: any tap counts as the unlocking gesture. -->
    <div v-if="ds.needsGesture" class="gesture-overlay" @click="ds.completeGestureJoin()">
        <div class="card rounded">
            <p>This device was invited to group playback, but the browser blocked autoplay.</p>
            <button class="rounded-sm" @click.stop="ds.completeGestureJoin()">Tap to join playback</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import useDeviceSync from '@/stores/devicesync'

const ds = useDeviceSync()
</script>

<style lang="scss">
.gesture-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: grid;
    place-items: center;
    background-color: rgba(0, 0, 0, 0.6);

    .card {
        max-width: 22rem;
        margin: 1rem;
        padding: 1.5rem;
        text-align: center;
        background-color: var(--mem-ground, #1d1d1d);
        display: grid;
        gap: 1rem;

        button {
            padding: 0.85rem 1.25rem;
            border: none;
            cursor: pointer;
            font-weight: 700;
            background-color: $brand-green;
            color: white;
        }
    }
}
</style>
