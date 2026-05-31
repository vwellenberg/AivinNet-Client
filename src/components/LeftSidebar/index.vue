<template>
  <div class="l-sidebar no-scroll" :style="{ width: displayWidth + 'px' }">
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
    <div class="sidebar-version" :title="`AivinNet ${version}`">v{{ version }}</div>
    <div
      class="sidebar-resize-handle"
      :class="{ active: isResizing }"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import useSettingsStore from "@/stores/settings";
import usePStore from "@/stores/pages/playlists";
import { Routes } from '@/router'
import { paths } from '@/config'

import Navigation from "@/components/LeftSidebar/NavButtons.vue";
import Logo from "@/components/Logo.vue";
import SongCard from "./NP/SongCard.vue";
import PlaylistSvg from "@/assets/icons/playlist-1.svg";
import pkg from "../../../package.json";

const version = pkg.version;

const settings = useSettingsStore();
const playlists = usePStore();
const imgBase = paths.images.playlist;

const SIDEBAR_MIN_WIDTH = 180
const SIDEBAR_MAX_WIDTH = 420
const isResizing = ref(false)
const dragWidth = ref(0)
let moveHandler: ((ev: MouseEvent) => void) | null = null
let upHandler: (() => void) | null = null

const displayWidth = computed(() =>
  isResizing.value ? dragWidth.value : settings.sidebar_width
)

function clamp(n: number) {
  return Math.min(Math.max(n, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH)
}

function teardown() {
  if (moveHandler) document.removeEventListener('mousemove', moveHandler)
  if (upHandler) document.removeEventListener('mouseup', upHandler)
  moveHandler = null
  upHandler = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function startResize(e: MouseEvent) {
  e.preventDefault()
  isResizing.value = true
  dragWidth.value = settings.sidebar_width
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  moveHandler = (ev: MouseEvent) => {
    dragWidth.value = clamp(ev.clientX)
  }
  upHandler = () => {
    settings.sidebar_width = dragWidth.value
    isResizing.value = false
    teardown()
  }
  document.addEventListener('mousemove', moveHandler)
  document.addEventListener('mouseup', upHandler)
}

onMounted(() => {
  if (!playlists.playlists.length) {
    playlists.fetchAll();
  }
});

onBeforeUnmount(teardown);
</script>

<style lang="scss">
.l-sidebar {
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

.sidebar-resize-handle {
  position: absolute;
  top: 0;
  right: -4px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  background-color: transparent;
  transition: background-color 0.15s ease;

  &:hover,
  &.active {
    background-color: rgba(255, 255, 255, 0.08);
  }
}

.sidebar-version {
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  opacity: 0.3;
  text-align: center;
  padding: 0.5rem 0 0;
  user-select: none;
  font-feature-settings: 'tnum';
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.6;
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
