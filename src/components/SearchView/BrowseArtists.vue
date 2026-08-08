<template>
  <div v-if="browse.artists.length" class="browse-artists">
    <!-- The band sits on a plate: it is a row of small controls on the doodled
      ground, and the ground is exactly what makes a 2.4rem key unreadable
      (styling.md). The card row below brings its own plates per tile. -->
    <div class="band-plate">
      <div class="band" role="group" aria-label="Browse artists by first letter">
        <button
          v-for="key in LETTERS"
          :key="key"
          type="button"
          class="band-key"
          :class="{ on: browse.letter === key, off: !browse.counts[key] }"
          :disabled="!browse.counts[key]"
          :aria-pressed="browse.letter === key"
          :title="bandTitle(key)"
          @click="browse.selectLetter(key)"
        >
          <span class="k">{{ key }}</span>
          <!-- The count is what turns the band from navigation into an answer:
            it says how much is behind a key BEFORE it is pressed. Absent keys
            stay visible and disabled rather than disappearing, so the band
            keeps one shape across libraries. -->
          <span v-if="browse.counts[key]" class="n">{{ browse.counts[key] }}</span>
        </button>
      </div>
    </div>

    <!-- `route` is what makes CardScroller show its SEE ALL link, and without
      it a letter with 62 artists offered the six the row happens to fit and no
      way to the other 56. The link lands on the full artist list — the band
      narrows, the list is where the whole library lives. -->
    <CardScroller
      :title="rowTitle"
      :items="items"
      :route="artistListRoute"
      :see-all-text="'artists'"
      :play-source="playSources.artist"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

import { playSources } from "@/enums";
import useBrowseStore, { LETTERS } from "@/stores/searchBrowse";

import CardScroller from "@/components/shared/CardScroller.vue";

const browse = useBrowseStore();

const items = computed(() => browse.shown.map(item => ({ type: "artist", item })));

// The caption names the kind first and the selection second, so the row keeps
// saying what it is once a letter has been pressed a few times.
const rowTitle = computed(() => `Artists · ${browse.letter} · ${browse.shown.length}`);

const artistListRoute = "/artists";

function bandTitle(key: string) {
  const count = browse.counts[key];
  if (!count) return `No artists under ${key}`;
  return `${count} ${count === 1 ? "artist" : "artists"} under ${key}`;
}

onMounted(browse.fetchArtists);
</script>

<style lang="scss">
.browse-artists {
  // No horizontal padding of its own: the idle column owns the page indent,
  // so all three blocks stand on ONE left edge. Measured, not assumed — the
  // host and the recent-searches block both carried $padleft before this.
  .band-plate {
    padding: $small;
    background-color: var(--mem-veil);
    border: $candy-border;
    border-radius: $candy-radius;
    @include candy-shadow;
  }

  .band {
    display: flex;
    flex-wrap: wrap;
    // The offset shadow falls to the bottom and the right of every key, so the
    // gap has to clear those 3px — otherwise a wrapped second row reads as
    // touching the first. ($smaller + 3px would be a Sass unit error: rem and
    // px do not add.)
    gap: $small;
  }

  // A key is a pill like every other small control here, but square-ish rather
  // than wide: it carries one character, and a 44px-wide pill per letter would
  // make the band wider than the page on a phone. The 44px target is kept on
  // the axis it can be kept on — see the touch branch below.
  .band-key {
    @include btn-pill($h: 2.25rem, $radius: $candy-radius-pill, $fill: $candy-pink-soft);
    min-width: 2.25rem;
    padding: 0 0.5rem;
    gap: 0.2rem;
    color: $candy-text;
    font-size: 0.85rem;

    .n {
      font-size: 0.68rem;
      font-weight: 500;
      opacity: 0.65;
    }

    // Static blush -> static ink, in both themes.
    &.on {
      background-color: $candy-pink;
      color: $mem-ink;

      .n {
        opacity: 0.8;
      }
    }

    // An empty letter is shown and disabled, not hidden: the band is easier to
    // aim at when its keys never move. No shadow, because nothing here is
    // raised — it cannot be pressed.
    &.off {
      opacity: 0.4;
      box-shadow: none;
      cursor: default;

      &:hover {
        background-color: $candy-pink-soft;
        color: $candy-text;
        transform: none;
      }
    }
  }

  // Touch has no aim assist, so the key grows to the app's 44px floor there.
  // Gated on POINTER, not on width (styling.md: a narrow desktop window is not
  // a touch device and a touch tablet is not narrow) — and only the two numbers
  // change, so the role stays the one source for everything else.
  @media (hover: none) {
    .band-key {
      height: 2.75rem;
      min-width: 2.75rem;
    }
  }

}
</style>
