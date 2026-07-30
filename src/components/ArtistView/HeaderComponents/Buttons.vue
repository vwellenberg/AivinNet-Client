<template>
  <div class="artist-buttons">
    <PlayBtnRect :source="playSources.artist" />
    <HeartSvg :state="artist.info.is_favorite" @handleFav="handleFav" />
    <button
      class="options"
      :class="{ context_menu_showing }"
      @click="showContext"
    >
      <MoreSvg />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { favType, playSources } from "@/enums";
import { showArtistContextMenu } from "@/helpers/contextMenuHandler";
import favoriteHandler from "@/helpers/favoriteHandler";
import useArtistPageStore from "@/stores/pages/artist";

import MoreSvg from "@/assets/icons/more.svg";
import HeartSvg from "@/components/shared/HeartSvg.vue";
import PlayBtnRect from "@/components/shared/PlayBtnRect.vue";

const artist = useArtistPageStore();
const context_menu_showing = ref(false);

function handleFav() {
  favoriteHandler(
    artist.info.is_favorite,
    favType.artist,
    artist.info.artisthash,
    artist.makeFavorite,
    artist.removeFavorite
  );
}

function showContext(e: MouseEvent) {
  showArtistContextMenu(
    e,
    context_menu_showing,
    artist.info.artisthash,
    artist.info.name
  );
}
</script>

<style lang="scss">
.artist-buttons {
  display: flex;
  align-items: center;
  gap: $small;
  // Wrap rather than squeeze, like the album and playlist header rows.
  flex-wrap: wrap;

  // This row was the odd one out: it never adopted the shared header-action
  // anatomy, so the overflow button kept the global button base (a box, but
  // ~36px tall next to the 44px Play CTA) and the favourite was a bare glyph
  // with no button surface at all. Both now match their album-header twins.
  .options,
  .heart-button {
    @include btn-action;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // The favourite owns its colour — the mixin sets `color`, which outranks a
  // bare `.is-fav` in HeartSvg, so a favourited artist turned ink. Re-assert
  // with the compound that wins (same fix as AlbumView/Header/Buttons.vue).
  .heart-button {
    &.is-fav,
    &.is-fav:hover {
      color: $mem-teal;
    }
  }

  .options {
    &.context_menu_showing {
      background-color: $darkblue;

      svg {
        // Yellow accent fill while the menu is open -> pin static ink.
        color: $mem-ink !important;
      }
    }
  }
}
</style>
