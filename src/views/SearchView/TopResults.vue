<template>
  <div class="search-page-top-results">
    <!-- No query yet: invite the user with recent searches / an idle prompt -->
    <RecentSearches v-if="!hasQuery" />

    <template v-else>
      <NoItems
        :title="'No results'"
        :description="'We can\'t find any results for your search.'"
        :icon="SearchSvg"
        :flag="noResults"
      />
      <RecentItems
        v-if="search.top_results.playlists.length"
        :title="'Playlists'"
        :items="
          search.top_results.playlists.map((i) => ({
            type: 'playlist',
            item: i,
          }))
        "
      />
      <div v-if="search.top_results.top_result && search.top_results.top_result.type" class="header">
        <div class="top">
          <h3 class="section-title">Top Result</h3>
          <TopItem />
        </div>
        <div class="tracks">
          <h3 class="section-title">Tracks</h3>
          <TopTracks />
        </div>
      </div>
      <RecentItems
        v-if="search.top_results.artists.length"
        :title="'Artists'"
        :items="
          search.top_results.artists.map((i) => ({
            type: 'artist',
            item: i,
          }))
        "
      />
      <RecentItems
        v-if="search.top_results.albums.length"
        :title="'Albums'"
        :items="
          search.top_results.albums.map((i) => ({
            type: 'album',
            item: i,
          }))
        "
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import useSearchStore from "@/stores/search";

import SearchSvg from "@/assets/icons/search.svg";
import TopItem from "@/components/RightSideBar/Search/Top/TopItem.vue";
import TopTracks from "@/components/RightSideBar/Search/Top/TopTracks.vue";
import RecentItems from "@/components/shared/CardScroller.vue";
import NoItems from "@/components/shared/NoItems.vue";
import RecentSearches from "./RecentSearches.vue";

const search = useSearchStore();

const hasQuery = computed(() => (search.query || "").trim().length > 0);
const noResults = computed(
  () =>
    (!search.top_results.top_result || !search.top_results.top_result.type) &&
    !search.top_results.playlists.length
);
</script>

<style lang="scss">
.search-page-top-results {
  height: 100%;
  overflow: auto;
  padding: 0 $padright $padbottom $padleft;

  .header {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 1rem;

    @include largePhones {
      grid-template-columns: 1fr;
    }
  }

  // The two section captions of this page. They were the last ones in the app
  // still standing free on the doodle ground — every other one (the card-row
  // captions, "Top Tracks", "Browse Library", "Up Next"/"Queue", the chart
  // groups, the recent-searches head next door) had already opted into
  // `mem-sticker`; these two were simply never added to that list, and a
  // theme-aware `color` does nothing about a saturated shape running behind
  // the word.
  //
  // Scoped to the class, NOT to `h3`: the bare element selector in this file
  // also reaches the title *inside* the top-result card, which sits on a panel
  // and must not become a sticker on a plate.
  .section-title {
    @include mem-sticker;
    // On a sticker the inset is a MARGIN — as padding it would fatten the chip
    // instead of moving it (styling.md). The left value keeps the caption on
    // the same edge as the plate below it.
    margin: 0 0 $small;
    font-size: 1.15rem;
    font-weight: 700;
  }

  // Search results are content, so they read on `--mem-veil` like the folder
  // list and the song lists — the rows themselves are transparent, so without
  // it the titles sat straight on the doodle tile (styling.md). Scoped to this
  // page rather than written into TopTracks.vue: the same component also
  // renders inside the right sidebar, which is already a panel and needs no
  // plate of its own.
  .right-search-top-tracks {
    background-color: var(--mem-veil);
    border: $candy-border;
    border-radius: $candy-radius-sm;
    // Keeps a row's own hover frame from doubling up with this one — same
    // reasoning as the folder list.
    padding: $smaller;
  }

  h3 {
    margin: $small;
    // The top-result card's own title. It sits on the card's panel, so it keeps
    // the theme-aware content colour rather than a plate.
    color: $mem-content-text;
  }

  .top-result-item {
    height: max-content;
    margin: 0;

    h3 {
      margin-left: 0;
    }

    @include largePhones {
      max-width: 100%;
    }

    @include mediumPhones {
      min-width: unset;
      max-width: 100%;
    }
  }

  .track-item {
    border-radius: $small;
    padding-left: $small;
    margin-top: $smaller;
  }

  .right-search-top-albums-or-artists {
    display: flex;
    width: calc(100% - 1.25rem);
    overflow-x: auto;

    @include hideScrollbars;
  }

  @include allPhones {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
