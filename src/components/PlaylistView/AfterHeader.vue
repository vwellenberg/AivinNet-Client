<template>
    <div class="p-after-header" :class="{ 'with-date': showDateHeading }">
        <div class="ah-label">All Tracks</div>
        <div v-if="showDateHeading" class="date-added-heading">Date added</div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { isMedium, isSmall } from '@/stores/content-width'

const props = defineProps<{
    // Whether the track list below shows the "Date added" column (regular
    // playlists on wide layouts only), so the caption lines up with it.
    show_date_added?: boolean
}>()

const showDateHeading = computed(() => Boolean(props.show_date_added) && !isSmall.value && !isMedium.value)
</script>

<style lang="scss">
.isSmall .p-after-header {
    padding-left: 0.5rem;
}

.p-after-header {
    display: flex;
    align-items: center;
    height: 64px;
    padding: 0 1rem;
    margin-top: $small;

    font-size: 14px;
    font-weight: 500;
    // Column-caption row ("All Tracks" / "Date added") sits on the page ground
    // -> theme-aware muted.
    color: $mem-content-muted;

    // Column-caption mode: same grid as .songlist-item.with-date (shared
    // variable) so the "Date added" caption sits exactly above its column.
    // The last (10rem) cell stays empty — it belongs to the duration column.
    &.with-date {
        display: grid;
        grid-template-columns: $songlist-columns-with-date;
        gap: 1rem;
        padding: 0 0 0 $small;

        .ah-label {
            grid-column: 1 / 4;
        }

        .date-added-heading {
            font-size: small;
            white-space: nowrap;
        }
    }

    @media only screen and (max-width: 724px) {
        padding-left: 0.5rem;
    }

    /* Somehow has to be replaced by above now
  @include largePhones {
    padding-left: 0.5rem;
  }
  */
}
</style>
