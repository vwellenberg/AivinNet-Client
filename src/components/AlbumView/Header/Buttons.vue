<template>
  <div class="album-buttons">
    <PlayBtnRect :source="playSources.album" />

    <HeartSvg :state="album.is_favorite" @handleFav="handleFav" />
    <PinButton :pinned="album.is_pinned" @toggle="handlePin" />
    <button
      class="mb-cover"
      :class="{ loading: mbLoading }"
      :title="mbLoading ? 'Loading…' : 'Find cover via MusicBrainz'"
      :disabled="mbLoading"
      @click.prevent="fetchCover"
    >
      <DownloadSvg />
    </button>
    <button
      class="options"
      :class="{ context_menu_showing }"
      @click.prevent="showContextMenu"
    >
      <MoreSvg />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";

import { favType, playSources } from "@/enums";
import useAlbumStore from "@/stores/pages/album";

import MoreSvg from "@/assets/icons/more.svg";
import DownloadSvg from "@/assets/icons/download.svg";
import PinButton from "@/components/shared/PinButton.vue";
import HeartSvg from "@/components/shared/HeartSvg.vue";
import PlayBtnRect from "@/components/shared/PlayBtnRect.vue";
import favoriteHandler from "@/helpers/favoriteHandler";
import { toggleAlbumPin } from "@/helpers/pinAlbum";
import { showAlbumContextMenu } from "@/helpers/contextMenuHandler";
import { fetchCoverFromMusicBrainz } from "@/requests/musicbrainz";
import { NotifType, Notification } from "@/stores/notification";

const store = useAlbumStore();
const { info: album } = storeToRefs(store);

const context_menu_showing = ref(false);
const mbLoading = ref(false);

function showContextMenu(e: MouseEvent) {
  showAlbumContextMenu(e, context_menu_showing);
}

function handleFav() {
  favoriteHandler(
    album.value.is_favorite,
    favType.album,
    album.value.albumhash,
    store.makeFavorite,
    store.removeFavorite
  );
}

function handlePin() {
  toggleAlbumPin(album.value);
}

async function fetchCover() {
  if (mbLoading.value) return;
  mbLoading.value = true;
  try {
    const res = await fetchCoverFromMusicBrainz(album.value.albumhash);
    if (res.success) {
      store.bumpCoverVersion();
      new Notification("Cover found via MusicBrainz", NotifType.Success);
    } else {
      new Notification(
        res.error || "No cover found on MusicBrainz",
        NotifType.Error
      );
    }
  } finally {
    mbLoading.value = false;
  }
}
</script>

<style lang="scss">
.album-buttons {
  display: flex;
  align-items: center;
  gap: $small;
  // The row wraps instead of squeezing its buttons — on a 390px phone the
  // five controls used to be compressed until the cover-fetch button was a
  // 16px sliver.
  flex-wrap: wrap;

  .options,
  .mb-cover {
    @include btn-action;
  }

  // The favourite toggle brings its own colour logic (plus glyph vs. green
  // check) — the shared anatomy aligns its footprint and its corner radius with
  // the row, not its palette. Without this it kept the global `.circular` pill
  // and sat as the one round control among rounded squares.
  .heart-button {
    @include btn-action;

    // ...but the favourite owns its colour. The mixin sets `color` on hover so
    // its own glyphs stay readable on the light hover fill, and that rule is
    // more specific than a bare `.is-fav` in HeartSvg — a favourited album
    // turned ink the moment the pointer touched it. Re-assert here, where the
    // collision is actually created, with the compound that outranks it.
    &.is-fav,
    &.is-fav:hover {
      color: $mem-teal;
    }
  }

  .options {
    &.context_menu_showing {
      background-color: $darkblue;
      // Yellow accent fill while the menu is open -> pin static ink.
      color: $mem-ink;
    }
  }

  .mb-cover {
    &:disabled { cursor: default; }
    &.loading svg { animation: mb-cover-spin 1s linear infinite; }
  }
}

@keyframes mb-cover-spin {
  to { transform: rotate(360deg); }
}
</style>
