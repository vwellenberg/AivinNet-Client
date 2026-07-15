<template>
    <div class="statshead" v-if="statItems.length">
        <div class="left">
            <StatItem
                v-for="item in statItems.slice(0, statItems.length - 1)"
                :key="item.cssclass"
                :value="item.value"
                :text="item.text"
                :icon="item.cssclass"
                :image="item.image"
            />
        </div>
        <div class="right">
            <StatItem
                :value="statItems[statItems.length - 1].value"
                :text="statItems[statItems.length - 1].text"
                :icon="statItems[statItems.length - 1].cssclass"
                :image="statItems[statItems.length - 1].image"
            />
        </div>
    </div>
    <div class="statsdates" v-if="date">
        <CalendarSvg />
        {{ date }}
    </div>
</template>

<script setup lang="ts">
import { getStats } from '@/requests/stats'
import { onMounted, ref } from 'vue'
import StatItem from './StatItem.vue'
import CalendarSvg from '@/assets/icons/calendar.svg'

interface StatItemData {
    cssclass: string
    value: string
    text: string
    image?: string
}

const props = defineProps<{
    items?: StatItemData[]
}>()

const statItems = ref<StatItemData[]>([])
const date = ref<string | null>(null)

onMounted(async () => {
    if (props.items) {
        statItems.value = props.items
        return
    }

    const res = await getStats()
    if (res.status == 200) {
        statItems.value = res.data.stats
        date.value = res.data.dates
    }
})

defineOptions({
    inheritAttrs: false,
})
</script>

<style lang="scss">
.statshead {
    display: grid;
    grid-template-columns: 1fr max-content;
    overflow-x: auto;
    gap: 1.5rem;
    padding: 1rem;

    // The stat cards scroll horizontally by touch/drag; never show the
    // scrollbar (it overlaps the cards on mobile — same treatment as the
    // genre banner next to it and the search tab chips).
    @include hideScrollbars;

    .left {
        display: flex;
        gap: 2rem;
    }

    .streamduration {
        padding: 1rem;
    }
}

.statsdates {
    display: flex;
    align-items: center;
    gap: $small;
    // Date range caption sits on the page ground -> theme-aware muted.
    color: $mem-content-muted;
    padding: 1rem;
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 900;

    svg {
        width: 1.25rem;
    }
}
</style>
