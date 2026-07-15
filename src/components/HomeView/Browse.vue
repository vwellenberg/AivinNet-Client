<template>
  <div class="homebrowse">
    <div class="btitle"><b>Browse Library</b></div>
    <div class="browselist">
      <RouterLink
        v-for="i in browselist"
        :key="i.title"
        class="browseitem rounded-sm"
        :to="{ name: i.route || '', params: i.params }"
        :style="{ width: `${album_card_with - 24}px` }"
        @click="i.action && i.action()"
        :class="i.class"
      >
        <div class="icon" v-html="i.icon"></div>
        <div style="width: 100%">
          {{ i.title }}
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RouteParamsRaw } from "vue-router";

import {
  AlbumIcon,
  ArtistIcon,
  BookmarkIcon,
  PlaylistIcon,
} from "@/icons";
import { Routes } from "@/router";
import { album_card_with } from "@/stores/content-width";

// A library shortcut card. `icon` is a raw svg string rendered via `v-html`.
interface BrowseItem {
  title: string;
  route: string;
  icon: string;
  class?: string;
  params?: RouteParamsRaw;
  action?: () => void;
}

// INFO: Library shortcuts on the home page.
const browselist: BrowseItem[] = [
  {
    title: "Albums",
    route: Routes.AlbumList,
    icon: AlbumIcon,
  },
  {
    title: "Artists",
    route: Routes.ArtistList,
    icon: ArtistIcon,
  },
  {
    title: "Playlists",
    route: Routes.playlists,
    icon: PlaylistIcon,
  },
  {
    title: "Fav. tracks",
    route: Routes.favoriteTracks,
    icon: BookmarkIcon,
    class: "favorite",
  },
  {
    title: "Fav. artists",
    route: Routes.favoriteArtists,
    icon: ArtistIcon,
    class: "favorite",
  },
  {
    title: "Fav. albums",
    route: Routes.favoriteAlbums,
    icon: AlbumIcon,
    class: "favorite",
  },
];
</script>

<style lang="scss">
.homebrowse {
  padding: 1.5rem 0;
  padding-left: $small;

  .btitle {
    font-size: 1.15rem;
    margin-bottom: 1rem;
    padding-left: 0.25rem;
    // "Browse Library" heading sits on the page ground -> theme-aware.
    // (The .browseitem tiles below are white candy-boxes -> stay ink.)
    color: $mem-content-text;
  }

  .browselist {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: $small;
  }

  .browseitem {
    font-weight: 500;
    padding: 1.25rem 1rem;
    @include candy-box($mem-panel, $candy-radius-sm);
    color: $candy-text;
    transition: background-color 0.2s ease-out;

    display: grid;
    grid-template-columns: max-content 1fr;
    place-items: center;
    gap: $small;

    .icon {
      height: 1.75rem;
    }

    svg {
      height: 1.75rem;
      color: $candy-black;
    }
  }

  .settings svg {
    color: $candy-black;
  }

  .reload svg {
    // INFO: The icons is a bit larger than the others
    width: 1.25rem;
  }

  .browseitem:hover {
    background-color: $mem-blush;
  }
}
</style>
