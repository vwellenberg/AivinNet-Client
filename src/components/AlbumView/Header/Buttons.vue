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
  gap: $small;

  .options,
  .mb-cover {
    background-color: transparent;
    border: none;

    svg {
      color: $candy-black;
    }
  }

  .options {
    &.context_menu_showing {
      background-color: $darkblue;

      svg {
        color: $white !important;
      }
    }

    svg {
      transform: scale(1.25);
    }
  }

  .mb-cover {
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover { opacity: 0.7; }
    &:disabled { cursor: default; }
    &.loading {
      svg { animation: mb-cover-spin 1s linear infinite; }
    }

    svg { transform: scale(1.1); }
  }
}

@keyframes mb-cover-spin {
  to { transform: scale(1.1) rotate(360deg); }
}
</style>
