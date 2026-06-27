<template>
  <div
    v-if="$route.params.tab == 'home'"
    class="now-playing-view v-scroll-page"
    :class="{ isSmall, isMedium }"
    style="position: relative"
    :style="{ background: pageGradient(gradientBg) }"
  >
    <DynamicScroller
      :items="scrollerItems"
      :min-item-size="64"
      class="scroller"
      style="height: 100%"
    >
      <template #before>
        <Header />
      </template>
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.props]"
          :data-index="index"
        >
          <component
            :is="item.component"
            :key="index"
            v-bind="item.props"
            @playThis="playFromQueue(item.props.index - 1)"
          ></component>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { ScrollerItem } from "@/interfaces";

import useQueueStore from "@/stores/queue";
import useTracklist from "@/stores/queue/tracklist";
import useColorStore from "@/stores/colors";
import { isMedium, isSmall } from "@/stores/content-width";

import Header from "@/components/NowPlaying/Header.vue";
import SongItem from "@/components/shared/SongItem.vue";
import updatePageTitle from "@/utils/updatePageTitle";
import { pageGradient } from "@/utils/colortools/pageGradient";
import { darkenHex } from "@/utils/colortools";


const queue = useQueueStore();
const store = useTracklist();
const colors = useColorStore();

// Spotify-style page fade like the Album/Playlist views, tinted by the current
// track's cover (colors.bg, set per track in stores/player.ts). When the cover
// has no colour to tint with — greyscale art or the no-cover placeholder —
// colors.bg is '' and we fall back to the brand green ($brand-green #1D9E75),
// darkened to the same gradient base.
const BRAND_GREEN = "#1D9E75";
const gradientBg = computed(() => colors.bg || darkenHex(BRAND_GREEN, 16));

function playFromQueue(index: number) {
  queue.play(index);
}

const scrollerItems = computed(() => {
  const items: ScrollerItem[] = [];

  const trackComponents = store.tracklist.map((track, index) => {
    track.index = index; // used in context menu to remove from queue
    return {
      id: index,
      component: SongItem,
      props: {
        track,
        index: index + 1,
        isCurrent: index === queue.currentindex,
        isCurrentPlaying: index === queue.currentindex && queue.playing,
        isQueueTrack: true,
        source: store.from.type,
      },
    };
  });

  return items.concat(trackComponents);
});

onMounted(() => updatePageTitle("Now Playing"));
</script>

<style lang="scss">
.now-playing-view {
  height: 100%;
}
</style>
