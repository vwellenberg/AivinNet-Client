<template>
  <div class="album-buttons">
    <PlayBtnRect :source="playSources.album" :bg_color="'#1D9E75'" /><!-- brand-green -->

    <HeartSvg
      :state="album.is_favorite"
      :color="colors.bg ? colors.bg : ''"
      @handleFav="handleFav"
    />
    <button
      class="mb-cover"
      :class="{ loading: mbLoading }"
      :title="mbLoading ? 'Loading…' : 'Find cover via MusicBrainz'"
      :disabled="mbLoading"
      @click.prevent="fetchCover"
    >
      <DownloadSvg :style="{ color: textColor }" />
    </button>
    <button
      class="options"
      :class="{ context_menu_showing }"
      @click.prevent="showContextMenu"
    >
      <MoreSvg
        :style="{
          color: textColor,
        }"
      />
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
import HeartSvg from "@/components/shared/HeartSvg.vue";
import PlayBtnRect from "@/components/shared/PlayBtnRect.vue";
import favoriteHandler from "@/helpers/favoriteHandler";
import { showAlbumContextMenu } from "@/helpers/contextMenuHandler";
import { fetchCoverFromMusicBrainz } from "@/requests/musicbrainz";
import { NotifType, Notification } from "@/stores/notification";

const store = useAlbumStore();
const { info: album, colors } = storeToRefs(store);

defineProps<{
  textColor: string;
}>();

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
