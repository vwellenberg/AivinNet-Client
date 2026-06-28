<template>
  <div class="l-sidebar" :style="{ width: displayWidth + 'px' }">
    <div class="scrollable">
      <Navigation />
      <div class="sidebar-library">
        <div class="sidebar-library-title">
          <span>Library</span>
          <button class="sidebar-newfolder" title="New folder" @click="onNewFolder">
            <PlusSvg />
          </button>
        </div>
        <RouterLink
          v-for="al in pinnedAlbums.sortedAlbums"
          :key="al.albumhash"
          :to="{ name: Routes.album, params: { albumhash: al.albumhash } }"
          class="sidebar-playlist-item"
          :class="{ active: $route.params.albumhash == al.albumhash }"
          @contextmenu.prevent="showAlbumContextMenu($event, ctxFlag, al)"
        >
          <div class="sidebar-pl-img rounded-sm">
            <img :src="thumbBase + al.image" />
            <button
              class="pl-play-overlay"
              :class="{ playing: isCurrentAlbum(al.albumhash) }"
              :title="isPlayingAlbum(al.albumhash) ? 'Pause' : 'Play'"
              @click.prevent.stop="togglePlayAlbum(al)"
            >
              <PauseSvg v-if="isPlayingAlbum(al.albumhash)" />
              <PlaySvg v-else />
            </button>
          </div>
          <span class="ellip">{{ al.title }}</span>
          <PushPinSvg class="pl-pin" title="Pinned" />
        </RouterLink>

        <!-- Playlist folders (flat, collapsible) -->
        <div
          v-for="folder in foldersWithPlaylists"
          :key="'folder-' + folder.id"
          class="sidebar-folder"
          :class="{ 'drag-over': dragOverFolder === folder.id }"
          @dragover.prevent="dragOverFolder = folder.id"
          @dragleave="dragOverFolder = null"
          @drop="onDropToFolder(folder.id, $event)"
        >
          <div
            class="sidebar-folder-header"
            @click="folderStore.toggleCollapse(folder.id)"
            @contextmenu.prevent="onFolderContextMenu($event, folder)"
          >
            <div class="folder-icon-slot">
              <FolderSvg class="folder-icon" />
            </div>
            <span class="ellip">{{ folder.name }}</span>
            <span class="folder-count">{{ folder.playlists.length }}</span>
            <RightArrowSvg class="folder-chevron" :class="{ open: !folderStore.isCollapsed(folder.id) }" />
          </div>
          <div v-if="!folderStore.isCollapsed(folder.id)" class="sidebar-folder-items">
            <SidebarPlaylistItem
              v-for="(pl, idx) in folder.playlists"
              :key="pl.id"
              :pl="pl"
              @dragover.prevent
              @drop.stop="onDropOnItem(folder.id, idx, $event)"
            />
            <div v-if="!folder.playlists.length" class="sidebar-folder-empty">Drop playlists here</div>
          </div>
        </div>

        <!-- Ungrouped playlists (top level): drag a pinned one onto another to
             reorder; drop on the empty area to pull a playlist out of a folder. -->
        <div class="sidebar-toplevel" @dragover.prevent @drop="onDropToTop($event)">
          <SidebarPlaylistItem
            v-for="pl in ungroupedPlaylists"
            :key="pl.id"
            :pl="pl"
            @dragover.prevent
            @drop.stop="onDropReorder(pl, $event)"
          />
        </div>
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
import usePinnedAlbums from "@/stores/pages/pinnedAlbums";
import { Routes } from '@/router'
import { paths } from '@/config'
import { Album, Playlist } from "@/interfaces";

import Navigation from "@/components/LeftSidebar/NavButtons.vue";
import SongCard from "./NP/SongCard.vue";
import SidebarPlaylistItem from "./SidebarPlaylistItem.vue";
import PlaySvg from "@/assets/icons/play.svg";
import PauseSvg from "@/assets/icons/pause.svg";
import PushPinSvg from "@/assets/icons/push-pin.svg";
import FolderSvg from "@/assets/icons/folder.fill.svg";
import RightArrowSvg from "@/assets/icons/right-arrow.svg";
import PlusSvg from "@/assets/icons/plus.svg";
import pkg from "../../../package.json";

import useQueue from "@/stores/queue";
import useTracklist from "@/stores/queue/tracklist";
import useContextStore from "@/stores/context";
import useModalStore from "@/stores/modal";
import usePlaylistFolders from "@/stores/playlistFolders";
import { PlaylistFolder } from "@/requests/playlistFolders";
import { FromOptions, ContextSrc } from "@/enums";
import { playFromAlbumCard } from "@/helpers/usePlayFrom";
import { showAlbumContextMenu } from "@/helpers/contextMenuHandler";
import { DeleteIcon } from "@/icons";

const ctxFlag = ref(false);

const version = pkg.version;

const settings = useSettingsStore();
const playlists = usePStore();
const pinnedAlbums = usePinnedAlbums();
const queue = useQueue();
const tracklist = useTracklist();
// Album cover thumbnail base (pinned albums in the library list).
const thumbBase = paths.images.thumb.small;

const folderStore = usePlaylistFolders();
const contextStore = useContextStore();
const modal = useModalStore();

const playlistMap = computed(() => {
  const m = new Map<number, Playlist>();
  for (const p of playlists.playlists) m.set(p.id, p);
  return m;
});

// Folders (ordered) each with their resolved playlists; unknown/deleted ids are
// dropped so stale references never render.
const foldersWithPlaylists = computed(() =>
  folderStore.sortedFolders.map(f => ({
    ...f,
    playlists: f.items.map(id => playlistMap.value.get(id)).filter((p): p is Playlist => !!p),
  }))
);

// Playlists not in any folder render at the top level.
const ungroupedPlaylists = computed(() =>
  playlists.sortedPlaylists.filter(p => !folderStore.folderOf.has(p.id))
);

const dragOverFolder = ref<number | null>(null);

function readDragPid(e: DragEvent): number | null {
  const raw = e.dataTransfer?.getData("playlistid");
  return raw ? parseInt(raw) : null;
}
function onDropToFolder(folderId: number, e: DragEvent) {
  dragOverFolder.value = null;
  const pid = readDragPid(e);
  if (pid !== null) folderStore.move(pid, folderId);
}
function onDropOnItem(folderId: number, index: number, e: DragEvent) {
  dragOverFolder.value = null;
  const pid = readDragPid(e);
  if (pid !== null) folderStore.move(pid, folderId, index);
}
function onDropToTop(e: DragEvent) {
  const pid = readDragPid(e);
  if (pid !== null) folderStore.move(pid, null);
}
// Reorder pinned top-level playlists by dropping one onto another.
async function onDropReorder(targetPl: Playlist, e: DragEvent) {
  const pid = readDragPid(e);
  if (pid === null || pid === targetPl.id) return;

  // If the dragged playlist came from a folder, pull it out to the top level.
  if (folderStore.folderOf.has(pid)) await folderStore.move(pid, null);

  const dragged = playlists.playlists.find((p) => p.id === pid);
  // Manual ordering only applies among pinned top-level playlists.
  if (!dragged?.pinned || !targetPl.pinned) return;

  const order = ungroupedPlaylists.value.filter((p) => p.pinned).map((p) => p.id);
  const from = order.indexOf(pid);
  if (from !== -1) order.splice(from, 1);
  const to = order.indexOf(targetPl.id);
  order.splice(to < 0 ? order.length : to, 0, pid);

  await playlists.reorderTopLevel(order);
}
function onNewFolder() {
  modal.showFolderModal();
}
function onFolderContextMenu(e: MouseEvent, folder: PlaylistFolder) {
  const options = () => [
    {
      label: "Rename",
      action: () => modal.showFolderModal({ folder }),
    },
    {
      label: "Delete folder",
      icon: DeleteIcon,
      action: async () => {
        await folderStore.remove(folder.id);
      },
    },
  ];
  contextStore.showContextMenu(e, options, ContextSrc.PHeader);
}

// Is the given album the one currently loaded in the player?
function isCurrentAlbum(albumhash: string) {
  return (
    (tracklist.from as any)?.type === FromOptions.album &&
    (tracklist.from as any)?.albumhash === albumhash
  );
}
function isPlayingAlbum(albumhash: string) {
  return isCurrentAlbum(albumhash) && queue.playing;
}
function togglePlayAlbum(al: Album) {
  if (isCurrentAlbum(al.albumhash)) {
    queue.playPause();
  } else {
    playFromAlbumCard(al.albumhash, al.title);
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
  if (!pinnedAlbums.albums.length) {
    pinnedAlbums.fetchAll();
  }
  folderStore.fetch();
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.5;
    padding: 0 $small 0.5rem;
    letter-spacing: 0.05em;

    .sidebar-newfolder {
      display: grid;
      place-items: center;
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 50%;
      color: inherit;
      opacity: 0.8;
      cursor: pointer;
      transition: background-color 0.15s ease, opacity 0.15s ease;

      svg {
        width: 0.85rem;
        height: 0.85rem;
      }

      &:hover {
        background-color: $gray;
        opacity: 1;
      }
    }
  }

  .sidebar-folder {
    border-radius: $smaller;

    &.drag-over {
      background-color: rgba(255, 255, 255, 0.06);
      outline: 1px dashed $gray2;
    }

    .sidebar-folder-header {
      display: flex;
      align-items: center;
      gap: $small;
      // Match a playlist row's height exactly (2rem thumbnail + 2x0.35rem
      // padding) so folders sit in the same rhythm as the other items.
      min-height: 2.7rem;
      padding: 0.35rem $small;
      border-radius: $smaller;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: background-color 0.15s;

      &:hover {
        background-color: $gray;
      }

      .folder-icon-slot {
        // Same 2rem slot as a playlist thumbnail so the folder icon lines up
        // with the other library items (no left-chevron indent).
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
        display: grid;
        place-items: center;
      }

      .folder-icon {
        width: 1.35rem;
        height: 1.35rem;
        opacity: 0.85;
      }

      .folder-chevron {
        // Expand/collapse affordance on the right; points right when collapsed,
        // rotates down when open.
        flex-shrink: 0;
        width: 0.7rem;
        height: 0.7rem;
        opacity: 0.6;
        transition: transform 0.15s ease;

        &.open {
          transform: rotate(90deg);
        }
      }

      span.ellip {
        flex: 1;
        min-width: 0;
      }

      .folder-count {
        flex-shrink: 0;
        font-size: 0.7rem;
        font-weight: 500;
        opacity: 0.5;
      }
    }

    .sidebar-folder-items {
      margin-left: 0.85rem;
      padding-left: 0.4rem;
      border-left: 1px solid $gray5;
    }

    .sidebar-folder-empty {
      font-size: 0.75rem;
      opacity: 0.4;
      padding: 0.35rem $small;
      font-style: italic;
    }
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
