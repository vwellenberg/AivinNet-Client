<template>
  <!-- The tiles are the shared `StatItem` — same anatomy, same icon per kind
    as the charts screen. What is NOT reused is `Stats.vue` around them: it
    splits its list into "all but the last" and "the last", which is how the
    charts screen sets the top track apart. Four equal numbers have nothing to
    set apart, and the split showed up as a gap in the middle of the row. -->
  <div v-if="items.length" class="library-numbers">
    <StatItem
      v-for="item in items"
      :key="item.cssclass"
      :value="item.value"
      :text="item.text"
      :icon="item.cssclass"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { getStats } from "@/requests/stats";

import StatItem from "@/components/Stats/StatItem.vue";

interface StatItemData {
  cssclass: string;
  value: string;
  text: string;
}

/**
 * The numeric ones only. `/logger/stats` also returns "Top track this week"
 * with its cover — a recommendation, and the charts screen is where those
 * belong; here it would be the one entry that is not a number.
 */
const WANTED = ["trackcount", "streams", "playtime", "favorites"];

/**
 * Module-level, so it survives the component. This block mounts behind
 * `v-if="!hasQuery"`, which means it is destroyed and rebuilt on every search
 * and every clearing of the field — and `/logger/stats` aggregates the whole
 * play history, so re-issuing it per keystroke-pause is not a rounding error.
 * The numbers move once a day at most; a session's first answer is good enough
 * for the rest of it.
 */
let cached: StatItemData[] | null = null;

const items = ref<StatItemData[]>(cached || []);

onMounted(async () => {
  if (cached) return;

  const res = await getStats();
  if (res.status !== 200) return;

  const stats: StatItemData[] = res.data?.stats || [];
  // Ordered by WANTED rather than by the response, so the row reads the same
  // whatever order the backend happens to send.
  cached = WANTED.map(kind => stats.find(s => s.cssclass === kind)).filter(
    (s): s is StatItemData => Boolean(s)
  );
  items.value = cached;
});
</script>

<style lang="scss">
.library-numbers {
  display: flex;
  gap: $medium;
  // The tiles scroll sideways on a narrow window rather than shrinking below
  // what their numbers need — the same answer the charts row gives, minus its
  // scrollbar (it would sit on top of the tiles).
  overflow-x: auto;
  @include hideScrollbars;

  .statitem {
    flex-shrink: 0;
  }
}
</style>
