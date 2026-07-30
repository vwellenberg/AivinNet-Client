<template>
  <!-- Reading order, top to bottom — the same order the album header uses.
       This block used to be written BACKWARDS (buttons first, type label last)
       and flipped with `flex-direction: column-reverse`, purely to pin it to
       the bottom of the header. `justify-content: flex-end` does that without
       making the markup lie about what comes first. -->
  <div class="playlist-info">
    <div class="type">Playlist</div>
    <div ref="test_elem"></div>
    <div class="title ellip2">
      <span v-for="t in balanceText(playlist.info.name, test_elem?.offsetWidth || 0, '2.75rem')" :key="t">
        {{ t }}
        <br />
      </span>
    </div>
    <div class="duration">
      {{ playlist.info.count.toLocaleString() + ` ${playlist.info.count == 1 ? "Track" : "Tracks"}` }}
      •
      {{ formatSeconds(playlist.info.duration, true) }}
    </div>
    <div class="btns">
      <PlayBtnRect :source="playSources.playlist" />
      <button class="download-btn" @click="downloadPlaylist" title="Download as ZIP">
        <span v-html="DownloadIcon" class="icon"></span>
      </button>
      <PinButton
        v-if="Number.isInteger(playlist.info.id)"
        :pinned="playlist.info.pinned"
        @toggle="pinPlaylist(playlist.info.id)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { playSources } from "@/enums";
import { formatSeconds } from "@/utils";
import { getBaseUrl, paths } from "@/config";
import { DownloadIcon } from "@/icons";

import PlayBtnRect from "@/components/shared/PlayBtnRect.vue";
import PinButton from "@/components/shared/PinButton.vue";
import usePStore from "@/stores/pages/playlist";
import { togglePlaylistPin } from "@/helpers/pinPlaylist";
import { balanceText } from "@/utils/balanceText";
import { Ref, ref } from "vue";

const playlist = usePStore();

const test_elem: Ref<HTMLElement | null> = ref(null);

function downloadPlaylist() {
    const a = document.createElement('a')
    a.href = getBaseUrl() + paths.api.download + `/playlist/${playlist.info.id}`
    a.click()
}

function pinPlaylist(pid: number) {
  // Shared helper keeps the sidebar list + this page in sync.
  togglePlaylistPin(pid);
}
</script>

<style lang="scss">
.playlist-info {
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  // Normal order, pinned to the bottom — see the note on the markup. The
  // padding is the album header's (its text column has none of its own; the
  // 1.25rem here is what made the two text columns start 4px apart).
  flex-direction: column;
  justify-content: flex-end;
  // Square-image / gradient mode: title/meta sit on the page ground -> theme
  // aware (type & duration mute via opacity). Banner-image mode overrides this
  // to $candy-white in Header.vue (higher specificity), which is preserved.
  color: $mem-content-text;

  // The same treatment the album header already arrived at
  // (AlbumView/Header/Info.vue `.albumtype`): full-strength adaptive text plus
  // a soft ground halo. `opacity: 0.85` made the label's contrast depend on
  // whatever memphis shape happened to sit behind it — over a saturated doodle
  // it was barely legible, and no opacity value fixes that, because the problem
  // is the pattern, not the darkness.
  .type {
    font-size: 14px;
    font-weight: 700;
    color: $mem-content-text;
    text-shadow: 0 0 8px var(--mem-ground);
  }

  .title {
    font-size: $detail-title-size;
    font-weight: $detail-title-weight;
    width: fit-content;
    cursor: text;
  }

  // The meta line — "40 Tracks • 2 hrs, 24 minutes" — is the album header's
  // Stats row by another name, so it reads at the same size and weight.
  .duration {
    font-size: $detail-meta-size;
    font-weight: $detail-meta-weight;
    padding: $smaller 0;
    cursor: text;
    text-shadow: 0 0 8px var(--mem-ground);
  }

  .btns {
    margin-top: $smaller;
    display: flex;
    gap: $small;
    align-items: center;
    // Wrap rather than squeeze (see AlbumView/Header/Buttons.vue).
    flex-wrap: wrap;

    .download-btn {
      // Shared header-action anatomy: 44px touch target, theme-aware glyph
      // (it was static ink and vanished on the dark ground), no squeezing.
      @include btn-action;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        display: flex;
        color: inherit;

        svg {
          width: 1.5rem;
          height: 1.5rem;
        }
      }
    }
  }
}
</style>
