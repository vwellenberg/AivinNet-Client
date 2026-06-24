<template>
  <div class="l-sidebar" :style="{ width: displayWidth + 'px' }">
    <div class="scrollable">
      <Navigation />
      <div class="sidebar-library">
        <div class="sidebar-library-title">Bibliothek</div>
        <RouterLink
          v-for="pl in playlists.sortedPlaylists"
          :key="pl.id"
          :to="{ name: Routes.playlist, params: { pid: pl.id } }"
          class="sidebar-playlist-item"
          :class="{ active: $route.params.pid == pl.id }"
          @contextmenu.prevent="showPlaylistContextMenu($event, pl, ctxFlag)"
        >
          <div class="sidebar-pl-img rounded-sm">
            <img v-if="pl.has_image" :src="imgBase + pl.image" />
            <img v-else-if="pl.images && pl.images.length" :src="thumbBase + pl.images[0].image" />
            <div v-else class="sidebar-pl-placeholder">
              <PlaylistSvg />
            </div>
            <button
              class="pl-play-overlay"
              :class="{ playing: isCurrent(pl.id) }"
              :title="isPlaying(pl.id) ? 'Pause' : 'Play'"
              @click.prevent.stop="togglePlay(pl.id)"
            >
              <PauseSvg v-if="isPlaying(pl.id)" />
              <PlaySvg v-else />
            </button>
          </div>
          <span class="ellip">{{ pl.name }}</span>
          <PushPinSvg v-if="pl.pinned" class="pl-pin" title="Angepinnt" />
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
import SongCard from "./NP/SongCard.vue";
import PlaylistSvg from "@/assets/icons/playlist-1.svg";
import PlaySvg from "@/assets/icons/play.svg";
import PauseSvg from "@/assets/icons/pause.svg";
import PushPinSvg from "@/assets/icons/push-pin.svg";
import pkg from "../../../package.json";

import useQueue from "@/stores/queue";
import useTracklist from "@/stores/queue/tracklist";
import { FromOptions } from "@/enums";
import { playFromPlaylist } from "@/helpers/usePlayFrom";
import { showPlaylistContextMenu } from "@/helpers/contextMenuHandler";

const ctxFlag = ref(false);

const version = pkg.version;

const settings = useSettingsStore();
const playlists = usePStore();
const queue = useQueue();
const tracklist = useTracklist();
const imgBase = paths.images.playlist;
// First album cover of the playlist, used when it has no dedicated image.
const thumbBase = paths.images.thumb.small;

// Is the given playlist the one currently loaded in the player?
function isCurrent(plId: number) {
  return (
    (tracklist.from as any)?.type === FromOptions.playlist &&
    (tracklist.from as any)?.id === plId
  );
}
function isPlaying(plId: number) {
  return isCurrent(plId) && queue.playing;
}
function togglePlay(plId: number) {
  if (isCurrent(plId)) {
    queue.playPause();
  } else {
    playFromPlaylist(String(plId));
  }
}

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
  // Logo now lives in the top bar; sidebar is scrollable list + now-playing card.
  grid-template-rows: 1fr max-content;
  background-color: #121212;
  border-radius: 8px;
  position: relative;
  padding: 0.875rem 0.875rem 1rem;
  min-height: 0;
  // Small black gap on the far left so the panel floats (Spotify-style).
  margin-left: 8px;

  .scrollable {
    height: 100%;
    overflow: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding: 1rem 0;

    // Scrollbar is hidden until the sidebar is hovered. The width/`thin` track
    // stays constant so showing the thumb never reflows the list.
    // Firefox + standard-properties path (Chrome 121+): transparent thumb by default.
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;

    // Legacy WebKit path (older Chrome): transparent thumb by default.
    &::-webkit-scrollbar-thumb {
      background-color: transparent;
    }
  }

  &:hover .scrollable {
    scrollbar-color: $gray2 transparent;
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

    span.ellip {
      opacity: 0.85;
      flex: 1;
      min-width: 0;
    }

    .pl-pin {
      flex-shrink: 0;
      width: 0.95rem;
      height: 0.95rem;
      color: $brand-green;
      // Tilt the thumbtack like Spotify's pin (📌): head top-right, point lower-left.
      transform: rotate(35deg);
    }
  }

  .sidebar-pl-img {
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    overflow: hidden;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    // Spotify-style play/pause overlay: shows on hover, or always while this
    // playlist is the one playing.
    .pl-play-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      padding: 0;
      border: none;
      border-radius: 0;
      background-color: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s ease;

      svg {
        height: 1rem;
        width: 1rem;
        color: $brand-green;
      }

      &:hover {
        background-color: rgba(0, 0, 0, 0.65);
      }
    }

    &:hover .pl-play-overlay,
    .pl-play-overlay.playing {
      opacity: 1;
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
