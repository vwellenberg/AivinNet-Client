<template>
  <router-link :to="{ name: 'PlaylistView', params: { pid: playlist.id } }" class="p-card rounded no-scroll">
    <div v-if="!playlist.has_image && playlist.images.length" class="image rounded-sm no-scroll">
      <PlaylistImages :images="playlist.images" size="large" class="rounded-sm" />
      <PlayBtn :source="playSources.playlist" :playlist="playlist.id.toString()"/>
    </div>
    <div v-else class="image">
      <img :src="imguri + playlist.thumb" class="rounded-sm" :class="{ border: !playlist.thumb }" />
      <PlayBtn :source="playSources.playlist" :playlist="playlist.id.toString()"/>
    </div>
    <div class="overlay rounded">
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

  .image {
    position: relative;
    overflow: hidden;
    border: $candy-border;
    border-radius: $candy-radius-sm;
  }

  @include card-play-btn;

  &:hover {
    background-color: $mem-blush !important;
  }

  img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    transition: all 0.5s ease;
  }

  .overlay {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    transition: all 0.25s ease;

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
