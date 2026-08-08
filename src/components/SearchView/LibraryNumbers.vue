<template>
  <!-- Not a second implementation of a stat card: this is the SAME `Stats`
    component the charts screen renders, handed a filtered list. It already
    owns the tile, the icon per kind and the horizontal scroll.
    The wrapper is not decoration: `Stats` declares `inheritAttrs: false`, so a
    class put on the component itself never reaches an element — measured, the
    padding reset below simply did not apply and the row stood 1rem right of
    the two blocks above it. -->
  <div v-if="items.length" class="library-numbers">
    <Stats :items="items" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { getStats } from "@/requests/stats";

import Stats from "@/components/Stats/Stats.vue";

interface StatItemData {
  cssclass: string;
  value: string;
  text: string;
  image?: string;
}

/**
 * The numeric ones only. `/logger/stats` also returns "Top track this week"
 * with its cover — a recommendation, and the charts screen is where those
 * belong; here it would be the one entry that is not a number.
 */
const WANTED = ["trackcount", "streams", "playtime", "favorites"];

const items = ref<StatItemData[]>([]);

onMounted(async () => {
  const res = await getStats();
  if (res.status !== 200) return;

  const stats: StatItemData[] = res.data?.stats || [];
  // Ordered by WANTED rather than by the response, so the row reads the same
  // whatever order the backend happens to send.
  items.value = WANTED.map(kind => stats.find(s => s.cssclass === kind)).filter(
    (s): s is StatItemData => Boolean(s)
  );
});
</script>

<style lang="scss">
// `Stats` pads its own tiles; the page indent belongs to the idle column, so
// all three blocks stand on one left edge.
.library-numbers .statshead {
  padding-left: 0;
  padding-right: 0;
}
</style>
