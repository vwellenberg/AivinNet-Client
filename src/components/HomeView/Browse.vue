<template>
  <div class="homebrowse">
    <div class="btitle"><b>Browse Library</b></div>
    <div class="browselist">
      <RouterLink
        v-for="i in browselist"
        :key="i.title"
        class="browseitem rounded-sm"
        :to="{ name: i.route || '', params: i.params }"
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
    // A sticker, like every other section caption: it stood free on the doodle
    // ground, where the shape behind it decided how well it read.
    @include mem-sticker;
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .browselist {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: $small;
  }

  .browseitem {
    // Fixed width: these tiles are a free-wrapping flex row with no alignment
    // contract to the card grid. They used to borrow the MEASURED card width
    // from content-width.ts, which made them jump between ~137px (unmeasured
    // default) and ~200px depending on which page had measured last.
    width: calc(#{$cardwidth} - 24px);
    font-weight: 500;
    padding: 1.25rem 1rem;
    @include candy-box($mem-panel, $candy-radius-sm);
    // Hard offset shadow: the tile sits above the grid ground (memphis).
    @include candy-raised(3px, 3px, $press: false);
    color: $candy-text;
    transition: background-color 0.2s ease-out, color 0.2s ease-out, box-shadow 0.12s ease-out;

    display: grid;
    grid-template-columns: max-content 1fr;
    place-items: center;
    gap: $small;

    .icon {
      height: 1.75rem;
    }

    svg {
      height: 1.75rem;
      // No colour of its own: it inherits the tile's, so the hover flip below
      // reaches the glyph too. A pinned `$candy-text` here sat ink-on-ink the
      // moment the hover fill became the contrast surface (#422).
    }
  }

  .settings svg {
    color: $candy-text;
  }

  .reload svg {
    // INFO: The icons is a bit larger than the others
    width: 1.25rem;
  }

  .browseitem:hover {
    background-color: $mem-hover;
    // The text token travels with the fill (#422) — the fill is the contrast
    // surface now, so without this the tile is an unreadable solid plate.
    color: var(--mem-hover-text);
  }
}
</style>
