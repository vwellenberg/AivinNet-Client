<template>
  <!-- No .rounded utility here: it overrode the candy-box radius (16px vs the
       14px every other card uses) and made playlist tiles a different shape. -->
  <router-link :to="{ name: 'PlaylistView', params: { pid: playlist.id } }" class="p-card no-scroll">
    <div v-if="!playlist.has_image && playlist.images.length" class="image rounded-sm no-scroll">
      <PlaylistImages :images="playlist.images" size="large" class="rounded-sm" />
      <PlayBtn :source="playSources.playlist" :playlist="playlist.id.toString()"/>
    </div>
    <div v-else class="image">
      <img :src="imguri + playlist.thumb" class="rounded-sm" :class="{ border: !playlist.thumb }" />
      <PlayBtn :source="playSources.playlist" :playlist="playlist.id.toString()"/>
    </div>
    <div class="overlay">
      <div v-if="playlist.help_text" class="rhelp playlist">
        <span class="help">{{ playlist.help_text }}</span>
        <span class="time">{{ playlist.time }}</span>
      </div>
      <div class="p-name ellip">{{ playlist.name }}</div>
      <div class="p-count">
        <b>{{ playlist.count.toLocaleString() + ` Track${playlist.count === 1 ? "" : "s"}` }}</b>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { paths } from "../../config";
import { Playlist } from "../../interfaces";
import { playSources } from '@/enums'
import PlayBtn from '../shared/PlayBtn.vue'
import PlaylistImages from '../shared/PlaylistImages.vue'

const imguri = paths.images.playlist;
defineProps<{
  playlist: Playlist;
}>();
</script>

<style lang="scss">
.p-card {
  display: grid;
  grid-template-rows: 1fr max-content;
  padding: $medium;
  gap: $small;
  user-select: none;
  height: max-content;
  transition: background-color 0.2s ease-out;
  @include candy-box($mem-panel, $candy-radius);
  // Hard offset shadow: the tile sits above the grid ground (memphis).
  @include candy-raised(3px, 3px, $press: false);

  .image {
    position: relative;
    overflow: hidden;
    border: $candy-border;
    border-radius: $candy-radius-sm;
  }

  @include card-play-btn;

  &:hover {
    background-color: $mem-hover !important;
  }

  // The hover only tints the card itself (above); neither the artwork nor the
  // text zone below changes, so the two `transition: all` rules that used to
  // sit here animated nothing. Measured on the running app: hovering a card
  // changes no property on either element.
  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }

  .overlay {
    display: flex;
    flex-direction: column;
    // Top-anchored like every other card's text zone, so the name lines align
    // across mixed rows (the old flex-end only mattered when the image row was
    // 1fr; in the shared anatomy the text zone has a fixed height).
    justify-content: flex-start;

    .p-name {
      font-weight: 700;
      color: $candy-text;
    }

    .p-count {
      font-size: 0.75rem;
      color: $candy-text-muted;
      margin-top: $smaller;
    }
  }
}
</style>
