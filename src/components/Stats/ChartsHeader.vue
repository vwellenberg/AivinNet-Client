<template>
    <div class="chartheader">
        <div class="seg" role="group" aria-label="Chart type">
            <button
                v-for="g in groups"
                :key="g"
                type="button"
                :class="{ active: g === name }"
                :aria-pressed="g === name"
                @click="$emit('changeGroup', g)"
            >
                {{ g }}
            </button>
        </div>
        <div class="seg" role="group" aria-label="Chart period">
            <button
                v-for="p in periods"
                :key="p"
                type="button"
                :class="{ active: p === period }"
                :aria-pressed="p === period"
                @click="$emit('changePeriod', p)"
            >
                {{ p }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    name: string
    period: string
}>()

defineEmits<{
    (e: 'changePeriod', period: string): void
    (e: 'changeGroup', group: string): void
}>()

const groups = ['artists', 'albums', 'tracks', 'playlists']
const periods = ['week', 'month', 'year', 'alltime']
</script>

<style lang="scss">
.chartheader {
    padding: $smaller 0 1rem 0;
    margin: 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $small;

    // One segmented plate per tab group — the anatomy itself lives in
    // `mem-seg-tabs` (_candy.scss), shared with the discography tabs.
    .seg {
        @include mem-seg-tabs;
    }
}
</style>
