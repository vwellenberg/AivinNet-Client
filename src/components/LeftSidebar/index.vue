<template>
  <div class="l-sidebar no-scroll">
    <Logo />
    <div class="scrollable">
      <Navigation />
      <div class="sidebar-library">
        <div class="sidebar-library-title">Bibliothek</div>
        <RouterLink
          v-for="pl in playlists.playlists"
          :key="pl.id"
          :to="{ name: Routes.playlist, params: { pid: pl.id } }"
          class="sidebar-playlist-item"
          :class="{ active: $route.params.pid == pl.id }"
        >
          <div class="sidebar-pl-img rounded-sm">
            <img v-if="pl.image" :src="imgBase + pl.image" />
            <div v-else class="sidebar-pl-placeholder">
              <PlaylistSvg />
            </div>
          </div>
          <span class="ellip">{{ pl.name }}</span>
        </RouterLink>
      </div>
    </div>

    <SongCard v-if="settings.use_np_img" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import useSettingsStore from "@/stores/settings";
import usePStore from "@/stores/pages/playlists";
import { Routes } from '@/router'
import { paths } from '@/config'

import Navigation from "@/components/LeftSidebar/NavButtons.vue";
import Logo from "@/components/Logo.vue";
import SongCard from "./NP/SongCard.vue";
import PlaylistSvg from "@/assets/icons/playlist-1.svg";

const settings = useSettingsStore();
const playlists = usePStore();
const imgBase = paths.images.playlist;

onMounted(() => {
  if (!playlists.playlists.length) {
    playlists.fetchAll();
  }
});
</script>

<style lang="scss">
.l-sidebar {
  width: 15rem;
  grid-area: l-sidebar;
  display: grid;
  grid-template-rows: 2.25rem 1fr max-content;
  background-color: #121212;
  border-radius: 8px;
  position: relative;
  padding: 0.625rem 0.875rem 1rem;

  .scrollable {
    height: 100%;
    overflow: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding: 1rem 0;

    &::-webkit-scrollbar-thumb {
      background-color: transparent;
    }
  }

  &:hover .scrollable::-webkit-scrollbar-thumb {
    background-color: $gray2;
  }

  &:hover .scrollable::-webkit-scrollbar-thumb:hover {
    background-color: $gray1;
  }
}

.sidebar-library {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid $gray5;

  .sidebar-library-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.5;
    padding: 0 $small 0.5rem;
    letter-spacing: 0.05em;
  }

  .sidebar-playlist-item {
    display: flex;
    align-items: center;
    gap: $small;
    padding: 0.35rem $small;
    border-radius: $smaller;
    transition: background-color 0.15s;
    font-size: 0.875rem;
    font-weight: 500;

    &:hover { background-color: $gray; }
    &.active { background-color: $gray5; }

    span { opacity: 0.85; }
  }

  .sidebar-pl-img {
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .sidebar-pl-placeholder {
    width: 100%;
    height: 100%;
    background-color: $gray4;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 1.1rem;
      height: 1.1rem;
      opacity: 0.5;
    }
  }
}
</style>
