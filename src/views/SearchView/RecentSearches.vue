<template>
  <div class="recent-searches">
    <template v-if="recents.length">
      <!-- The head sits ON the plate's top edge: a caption sticker plus the
        clear button, both half over the frame. It is one flow row with the
        plate pulled up under it — not an absolutely positioned overlay — so a
        narrow window wraps the row and the plate simply follows. -->
      <div class="recent-head">
        <h3 class="recent-title">
          <SearchSvg class="title-search" />
          <!-- The label is its own box: `text-overflow` needs a block to
            work on, and on the flex sticker itself it clipped mid-word. -->
          <span class="ellip">Recent searches</span>
        </h3>
        <button type="button" class="recent-clear" @click="clearAll">Clear all</button>
      </div>
      <div class="recent-plate">
        <div class="recent-chips">
          <button v-for="term in recents" :key="term" type="button" class="recent-chip" @click="apply(term)">
            <span class="ellip">{{ term }}</span>
            <span class="chip-remove" title="Remove" @click.stop="remove(term)">
              <CancelSvg />
            </span>
          </button>
        </div>
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
    // NOT `wrap`: the plate below is lifted by exactly half of this row's
    // height, so a second line would leave the caption floating above the edge
    // it is supposed to sit on. The caption ellipses instead (it is the only
    // element here that can afford to).
    flex-wrap: nowrap;
    gap: $small;
    // Above the plate, which is pulled up underneath it.
    position: relative;
    z-index: 1;
    padding: 0 $medium;
  }

  // The caption is a STICKER, like every other section head on the ground
  // (styling.md: text on the ground needs a plate). Blush rather than the
  // role's panel fill: it is the label colour of this design, and this
  // caption sits half on a plate that is itself panel-coloured — on panel the
  // sticker would have dissolved into the surface it is supposed to sit on.
  .recent-title {
    @include mem-sticker($radius: $candy-radius-pill, $pad: 0.3rem 0.85rem);
    display: inline-flex;
    align-items: center;
    gap: $smaller;
    // The one flexible item in the head, so a narrow window shortens the
    // caption instead of wrapping the row (see .recent-head).
    min-width: 0;
    margin: 0;
    background-color: $candy-pink;
    // Static blush fill -> static ink, in both themes.
    color: $mem-ink;
    font-size: 0.95rem;
    font-weight: 700;

    .title-search {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }
  }

  // Was a plain underlined text link — the only one in an app where every
  // control carries an ink frame, and parked at the far right edge where the
  // screenshot that started this round did not even include it. No `$h`: the
  // role IS the 44px touch target, and this is the head's only control.
  .recent-clear {
    @include btn-pill($radius: $candy-radius-pill, $fill: $mem-panel);
    color: $mem-content-text;
    // The head does not wrap, so this button must not be the thing that gives:
    // a squeezed "Clear all" is how header rows ended up at 16x36 (styling.md).
    flex-shrink: 0;
  }

  // The plate the chips sit on. Content on the ground reads on `--mem-veil`
  // (styling.md), never on the bare doodle tile; the negative margin lifts it
  // under the head so the sticker sits ON its edge. Half the head's height,
  // which is the pill role's 2.75rem — the two numbers move together.
  .recent-plate {
    margin-top: -1.375rem;
    padding: 2.375rem $medium $medium;
    background-color: var(--mem-veil);
    border: $candy-border;
    border-radius: $candy-radius;
    @include candy-shadow;
  }

  .recent-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $small;
  }

  // The pill role, so these chips carry the same frame, the same hard offset
  // AND the same footprint as the filter chips right above them. Hand-built,
  // they had a 1px border (while the app is on $candy-border-w) and no shadow
  // at all — the one row of chips on the page that sat flat. The `$h: 2.25rem`
  // that followed made the comment above half true: same frame, 4px shorter,
  // and both rows are on screen together in the empty state.
  .recent-chip {
    @include btn-pill($radius: $candy-radius-pill, $fill: $candy-pink-soft);
    // The soft fill is theme-aware (dark in the dark theme), so the label has
    // to be too — the role's static ink is only legal on a static accent.
    color: $candy-text;
    gap: $small;
    max-width: 16rem;
    // Lighter than the role, and that is the one difference worth keeping:
    // a filter chip is a label, this one carries back a phrase the user typed.
    font-weight: 500;
    // No hover of its own: the role reads the shared token (#422). The
    // override this replaces predates that and existed to dodge the role's
    // then-yellow hover — yellow means "active", and a recent search is not
    // a state.
    //
    // The magnifier glyph these chips used to carry is gone: eight copies of
    // the same icon on the SEARCH page say nothing, and they were what made
    // the row read as a strip of controls instead of a row of words.

    .chip-remove {
      display: grid;
      place-items: center;
      width: 1.35rem;
      height: 1.35rem;
      flex-shrink: 0;
      // Reserved on both sides of the pointer state, so revealing it can never
      // resize the chip under the pointer.
      margin-right: -0.45rem;
      border-radius: 50%;
      transition: opacity 0.15s ease;

      svg {
        width: 0.7rem;
        height: 0.7rem;
      }
    }

    // Pointer-gated, and the gate has a touch answer (styling.md): `:hover`
    // latches after the first tap, so hiding a control behind it would leave
    // the phone with a remove button that is either invisible or stuck open.
    //
    // `pointer-events` travels WITH the opacity, and not as a nicety: this
    // query also matches a touch-capable mouse-primary device (a 2-in-1), and
    // there an invisible-but-live hit area at the chip's trailing edge deletes
    // the entry the finger meant to search for.
    @media (hover: hover) {
      .chip-remove {
        opacity: 0;
        pointer-events: none;
      }

      &:hover .chip-remove {
        opacity: 0.75;
        pointer-events: auto;
      }
    }

    @media (hover: none) {
      .chip-remove {
        opacity: 0.6;
      }
    }
  }

  @include allPhones {
    padding-left: 1rem;
    padding-right: 1rem;

    .recent-head {
      padding: 0 $small;
    }
  }
}
</style>
