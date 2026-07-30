<template>
  <div class="recent-searches">
    <template v-if="recents.length">
      <div class="recent-head">
        <h3>Recent searches</h3>
        <button type="button" class="recent-clear" @click="clearAll">Clear</button>
      </div>
      <div class="recent-chips">
        <button v-for="term in recents" :key="term" type="button" class="recent-chip" @click="apply(term)">
          <SearchSvg class="chip-search" />
          <span class="ellip">{{ term }}</span>
          <span class="chip-remove" title="Remove" @click.stop="remove(term)">
            <CancelSvg />
          </span>
        </button>
      </div>
    </template>

    <NoItems
      v-else
      :icon="SearchSvg"
      :flag="true"
      :title="'Search your library'"
      :description="'Find songs, albums, artists, playlists and folders.'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import useSearchStore from "@/stores/search";
import { clearRecentSearches, getRecentSearches, removeRecentSearch } from "@/utils/recentSearches";

import SearchSvg from "@/assets/icons/search.svg";
import CancelSvg from "@/assets/icons/a.svg";
import NoItems from "@/components/shared/NoItems.vue";

const search = useSearchStore();
const recents = ref<string[]>(getRecentSearches());

function refresh() {
  recents.value = getRecentSearches();
}
function apply(term: string) {
  search.query = term;
}
function remove(term: string) {
  removeRecentSearch(term);
  refresh();
}
function clearAll() {
  clearRecentSearches();
  refresh();
}
</script>

<style lang="scss">
.recent-searches {
  height: 100%;
  padding: 0 $padright $padbottom $padleft;

  .recent-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: $small;

    h3 {
      margin: 0;
      // "Recent searches" heading on the page ground -> theme-aware.
      color: $mem-content-text;
    }

    .recent-clear {
      background: transparent;
      // Transparent text button on the page ground -> theme-aware muted.
      color: $mem-content-muted;
      font-size: 0.85rem;
      text-decoration: underline;
      cursor: pointer;
    }
  }

  .recent-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $small;
    padding: 0 $small;
  }

  // The pill role, so these chips carry the same frame and the same hard
  // offset as the filter chips right above them. Hand-built, they had a 1px
  // border (while the app is on $candy-border-w) and no shadow at all — the
  // one row of chips on the page that sat flat.
  .recent-chip {
    @include btn-pill($h: 2.25rem, $radius: $candy-radius-pill, $fill: $candy-pink-soft);
    // The soft fill is theme-aware (dark in the dark theme), so the label has
    // to be too — the role's static ink is only legal on a static accent.
    color: $candy-text;
    // Asymmetric on purpose: the remove button needs less room on the right
    // than the search glyph does on the left.
    padding: 0 0.5rem 0 0.85rem;
    gap: $smaller;
    max-width: 16rem;
    font-weight: 500;

    // Blush, not the role's default yellow: yellow means "active" in this
    // design and a recent search is not a state — it is a thing you can click.
    &:hover {
      background-color: $mem-hover;
    }

    .chip-search {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      opacity: 0.7;
    }

    .chip-remove {
      display: grid;
      place-items: center;
      width: 1.35rem;
      height: 1.35rem;
      flex-shrink: 0;
      border-radius: 50%;
      opacity: 0.6;
      transition: background-color 0.15s ease, opacity 0.15s ease;

      svg {
        width: 0.7rem;
        height: 0.7rem;
      }

      &:hover {
        background-color: $candy-pink-deep;
        // Yellow accent fill -> pin ink for the glyph.
        color: $mem-ink;
        opacity: 1;
      }
    }
  }

  @include allPhones {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
