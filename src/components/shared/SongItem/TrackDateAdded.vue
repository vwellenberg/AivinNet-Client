<template>
    <div class="song-date-added" :title="tooltip">{{ text }}</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { formatDate, formatDateAdded } from '@/utils/dates'

const props = defineProps<{
    // Unix timestamp (seconds). Null/undefined = added before the backend
    // started recording dates -> placeholder.
    timestamp?: number | null
}>()

const text = computed(() => (props.timestamp ? formatDateAdded(props.timestamp) : '—'))
const tooltip = computed(() => (props.timestamp ? `Added on ${formatDate(props.timestamp)}` : 'Added before dates were tracked'))
</script>

<style lang="scss">
.songlist-item > .song-date-added {
    font-size: small;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.6;

    @include mediumPhones {
        display: none;
    }
}
</style>
