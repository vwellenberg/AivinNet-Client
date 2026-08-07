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

    // One segmented PLATE per tab group ("a folder is ONE plate"): panel
    // fill, ink frame, offset shadow, hatch — the pressable statement the
    // old text-only tabs never made. Active is yellow, the design's "on"
    // signal, exactly like the pager chips at the bottom of this screen.
    // No separate underline: the plate is its own divider (#422 — no more
    // 1px hairlines in a 3px ink world).
    .seg {
        display: inline-flex;
        background-color: $mem-panel;
        // NO hatch (#476). It sat on the CONTAINER and therefore ran behind all
        // four labels at once — the tabs are nothing but their words, so there
        // is no area beside the text to hold a texture. Plate, ink frame,
        // offset, the yellow ON fill and the hover cut carry it (styling.md).
        border: $candy-border;
        border-radius: $candy-radius-sm;
        box-shadow: 3px 3px 0 var(--mem-shadow);
        overflow: hidden;

        button {
            // 44px interior — the chrome touch-target floor (styling.md).
            height: $bar-control;
            padding: 0 $medium;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            color: $mem-content-text;
            background-color: transparent;
            border: none;
            border-right: $candy-border;
            border-radius: 0;
            cursor: pointer;

            &:last-child {
                border-right: none;
            }

            // The pointer flip is a CUT (styling.md): fill and text swap in one
            // frame, --mem-hover-text travels with the fill. No texture in
            // either state (#476) — it would only reappear behind the label.
            &:hover {
                background-color: var(--mem-hover);
                color: var(--mem-hover-text);
            }

            &.active,
            &.active:hover {
                background-color: $mem-yellow;
                color: $mem-ink;
            }
        }

        @include allPhones {
            button {
                padding: 0 0.55rem;
                font-size: 0.8rem;
            }
        }
    }
}
</style>
