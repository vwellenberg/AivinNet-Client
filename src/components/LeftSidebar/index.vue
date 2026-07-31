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
        <!-- Manually-ordered zone: folders, pinned albums and pinned
             playlists, freely interleaved (shared position space). -->
        <div class="sidebar-toplevel" @dragover.prevent @drop="onDropToTopZone($event)">
          <template v-for="entry in topZone" :key="entry.kind + '-' + entry.id">
            <!-- Folder -->
            <div
              v-if="entry.kind === 'folder'"
              class="sidebar-folder"
              :class="{ 'drag-over': dragOverFolder === entry.id }"
              @dragover.prevent
              @drop="onDropToFolder(entry.id, $event)"
            >
              <div
                v-wave
                class="sidebar-folder-header"
                :class="markerClass('folder', entry.id)"
                draggable="true"
                @dragstart="onFolderDragStart(entry.id, $event)"
                @dragend="clearDrag"
                @click="folderStore.toggleCollapse(entry.id)"
                @contextmenu.prevent="onFolderContextMenu($event, entry.folder)"
                @dragover.prevent="onFolderHeaderDragOver(entry.folder, $event)"
                @drop.stop="onFolderHeaderDrop(entry.folder, $event)"
              >
                <div class="folder-icon-slot">
                  <FolderSvg class="folder-icon" />
                </div>
                <span class="ellip">{{ entry.folder.name }}</span>
                <span class="folder-count">{{ entry.folder.playlists.length }}</span>
                <RightArrowSvg class="folder-chevron" :class="{ open: !folderStore.isCollapsed(entry.id) }" />
              </div>
              <div v-if="!folderStore.isCollapsed(entry.id)" class="sidebar-folder-items">
                <SidebarPlaylistItem
                  v-for="pl in entry.folder.playlists"
                  :key="pl.id"
                  :pl="pl"
                  :class="markerClass('pl', pl.id)"
                  @dragstart="onPlDragStart(pl.id)"
                  @dragend="clearDrag"
                  @dragover.prevent="onItemDragOver(pl.id, $event)"
                  @drop.stop="onDropInFolderAt(entry.folder, pl, $event)"
                />
                <div v-if="!entry.folder.playlists.length" class="sidebar-folder-empty">Drop playlists here</div>
              </div>
            </div>

            <!-- Pinned album -->
            <RouterLink
              v-else-if="entry.kind === 'album'"
              v-wave
              :to="{ name: Routes.album, params: { albumhash: entry.al.albumhash } }"
              class="sidebar-playlist-item"
              :class="[{ active: $route.params.albumhash == entry.al.albumhash }, markerClass('album', entry.id)]"
              draggable="true"
              @dragstart="onAlbumDragStart(entry.al.albumhash, $event)"
              @dragend="clearDrag"
              @dragover.prevent="onAlbumDragOver(entry.al.albumhash, $event)"
              @drop.stop="onAlbumDrop(entry.al, $event)"
              @contextmenu.prevent="onAlbumContextMenu($event, entry.al)"
            >
              <div class="sidebar-pl-img rounded-sm">
                <img :src="thumbBase + entry.al.image" />
                <button
                  class="pl-play-overlay"
                  :class="{ playing: isCurrentAlbum(entry.al.albumhash) }"
                  :title="isPlayingAlbum(entry.al.albumhash) ? 'Pause' : 'Play'"
                  @click.prevent.stop="togglePlayAlbum(entry.al)"
                >
                  <PauseSvg v-if="isPlayingAlbum(entry.al.albumhash)" />
                  <PlaySvg v-else />
                </button>
              </div>
              <span class="ellip">{{ entry.al.title }}</span>
              <PushPinSvg class="pl-pin" title="Pinned" />
            </RouterLink>

            <!-- Pinned playlist -->
            <SidebarPlaylistItem
              v-else
              :pl="entry.pl"
              :class="markerClass('pl', entry.id)"
              @dragstart="onPlDragStart(entry.id)"
              @dragend="clearDrag"
              @dragover.prevent="onItemDragOver(entry.id, $event)"
              @drop.stop="onTopItemDrop(entry.pl, $event)"
            />
          </template>
        </div>

        <!-- Remaining (un-pinned, un-grouped) playlists, alphabetical. -->
        <div class="sidebar-bottom-zone" @dragover.prevent @drop="onDropToTop($event)">
          <SidebarPlaylistItem
            v-for="pl in bottomZone"
            :key="pl.id"
            :pl="pl"
            @dragstart="onPlDragStart(pl.id)"
            @dragend="clearDrag"
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
import { Album, Playlist, Track } from "@/interfaces";

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
import { AddToQueueIcon, DeleteIcon, PlayIcon, PlayNextIcon } from "@/icons";
import { getPlaylist } from "@/requests/playlists";
import { NotifType, useToast } from "@/stores/notification";

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

// Playlists not in any folder.
const ungroupedPlaylists = computed(() =>
  playlists.sortedPlaylists.filter(p => !folderStore.folderOf.has(p.id))
);

type TopEntry =
  | {
      kind: "folder";
      id: number;
      position: number;
      folder: PlaylistFolder & { playlists: Playlist[] };
    }
  | { kind: "playlist"; id: number; position: number; pl: Playlist }
  | { kind: "album"; id: string; position: number; al: Album };

// Tie-break for entries that share a position (e.g. all MAX before the first
// reorder): albums first, then folders, then playlists — preserving the
// historical layout where pinned albums sat above the folder/playlist zone.
const kindRank = { album: 0, folder: 1, playlist: 2 } as const;

// The manually-ordered zone: folders + pinned albums + pinned playlists
// interleaved by a shared position.
const topZone = computed<TopEntry[]>(() => {
  const entries: TopEntry[] = [];
  for (const f of foldersWithPlaylists.value) {
    entries.push({ kind: "folder", id: f.id, position: f.position ?? Number.MAX_SAFE_INTEGER, folder: f });
  }
  for (const al of pinnedAlbums.sortedAlbums) {
    entries.push({ kind: "album", id: al.albumhash, position: al.position ?? Number.MAX_SAFE_INTEGER, al });
  }
  for (const p of ungroupedPlaylists.value) {
    if (p.pinned) {
      entries.push({ kind: "playlist", id: p.id, position: p.settings?.position ?? Number.MAX_SAFE_INTEGER, pl: p });
    }
  }
  return entries.sort((a, b) => a.position - b.position || kindRank[a.kind] - kindRank[b.kind]);
});
// Everything else (un-pinned, un-grouped) stays alphabetical below.
const bottomZone = computed(() => ungroupedPlaylists.value.filter(p => !p.pinned));

const dragOverFolder = ref<number | null>(null);
// What is being dragged (set on dragstart — dataTransfer can't be read during
// dragover) and where the drop line currently sits.
const dragging = ref<{ type: "playlist" | "folder"; id: number } | { type: "album"; id: string } | null>(null);
const dropMarker = ref<{ kind: "pl" | "folder" | "album"; id: number | string; edge: "before" | "after" } | null>(
  null
);

function readDragPid(e: DragEvent): number | null {
  const raw = e.dataTransfer?.getData("playlistid");
  return raw ? parseInt(raw) : null;
}
function readDragFolderId(e: DragEvent): number | null {
  const raw = e.dataTransfer?.getData("folderid");
  return raw ? parseInt(raw) : null;
}
// Which half of the row the cursor is over → drop before or after it.
function edgeFromEvent(e: DragEvent): "before" | "after" {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
}
function markerClass(kind: "pl" | "folder" | "album", id: number | string) {
  const m = dropMarker.value;
  return {
    "drop-before": !!m && m.kind === kind && m.id === id && m.edge === "before",
    "drop-after": !!m && m.kind === kind && m.id === id && m.edge === "after",
  };
}
function clearDrag() {
  dragging.value = null;
  dropMarker.value = null;
  dragOverFolder.value = null;
}

// drag sources
function onPlDragStart(id: number) {
  dragging.value = { type: "playlist", id };
}
function onFolderDragStart(id: number, e: DragEvent) {
  dragging.value = { type: "folder", id };
  e.dataTransfer?.setData("folderid", String(id));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}
function onAlbumDragStart(albumhash: string, e: DragEvent) {
  dragging.value = { type: "album", id: albumhash };
  e.dataTransfer?.setData("albumhash", albumhash);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}

// playlist rows: show the line for any drag (a folder can also land before/after)
function onItemDragOver(plId: number, e: DragEvent) {
  if (!dragging.value) return;
  dragOverFolder.value = null;
  dropMarker.value = { kind: "pl", id: plId, edge: edgeFromEvent(e) };
}
// album rows: same, with the album's own marker
function onAlbumDragOver(albumhash: string, e: DragEvent) {
  if (!dragging.value) return;
  dragOverFolder.value = null;
  dropMarker.value = { kind: "album", id: albumhash, edge: edgeFromEvent(e) };
}

// reorder the shared top zone, placing the dragged entry next to the target
function reorderTopZone(
  draggedKind: "folder" | "playlist" | "album",
  draggedId: number | string,
  targetKind: "folder" | "playlist" | "album",
  targetId: number | string,
  edge: "before" | "after"
) {
  const order = topZone.value
    .map((en) => ({ kind: en.kind, id: en.id }))
    .filter((en) => !(en.kind === draggedKind && en.id === draggedId));
  let to = order.findIndex((en) => en.kind === targetKind && en.id === targetId);
  if (to < 0) to = order.length;
  if (edge === "after") to += 1;
  order.splice(to, 0, { kind: draggedKind, id: draggedId });

  const folderPos: { id: number; position: number }[] = [];
  const plPos: { id: number; position: number }[] = [];
  const albumPos: { albumhash: string; position: number }[] = [];
  order.forEach((en, i) => {
    if (en.kind === "folder") folderPos.push({ id: en.id as number, position: i });
    else if (en.kind === "album") albumPos.push({ albumhash: en.id as string, position: i });
    else plPos.push({ id: en.id as number, position: i });
  });
  if (folderPos.length) folderStore.reorder(folderPos);
  if (plPos.length) playlists.reorderTopLevel(plPos);
  if (albumPos.length) pinnedAlbums.reorderTopLevel(albumPos);
}

// drop anything onto a pinned album row → interleave next to it
async function onAlbumDrop(targetAl: Album, e: DragEvent) {
  void e;
  const drag = dragging.value;
  const edge = dropMarker.value?.edge ?? "before";
  clearDrag();
  if (!drag) return;

  if (drag.type === "album" && drag.id === targetAl.albumhash) return;

  if (drag.type === "playlist") {
    // Pull the playlist out of any folder first, then place it (only if pinned).
    if (folderStore.folderOf.has(drag.id)) await folderStore.move(drag.id, null);
    const dragged = playlists.playlists.find((p) => p.id === drag.id);
    if (!dragged?.pinned) return;
  }

  reorderTopZone(drag.type, drag.id, "album", targetAl.albumhash, edge);
}
function onDropInFolderAt(folder: { id: number; items: number[] }, targetPl: Playlist, e: DragEvent) {
  const pid = readDragPid(e);
  const edge = dropMarker.value?.edge ?? "before";
  clearDrag();
  if (pid === null) return;
  const without = folder.items.filter((i) => i !== pid);
  let pos = without.indexOf(targetPl.id);
  if (pos < 0) pos = without.length;
  if (edge === "after") pos += 1;
  folderStore.move(pid, folder.id, pos);
}
// drop a folder, album or playlist onto a pinned playlist in the top zone → interleave
async function onTopItemDrop(targetPl: Playlist, e: DragEvent) {
  void e;
  const drag = dragging.value;
  const edge = dropMarker.value?.edge ?? "before";
  clearDrag();
  if (!drag) return;

  if (drag.type === "folder" || drag.type === "album") {
    reorderTopZone(drag.type, drag.id, "playlist", targetPl.id, edge);
    return;
  }

  const pid = drag.id;
  if (pid === targetPl.id) return;
  // Pull the playlist out of any folder first, then place it (only if pinned).
  if (folderStore.folderOf.has(pid)) await folderStore.move(pid, null);
  const dragged = playlists.playlists.find((p) => p.id === pid);
  if (dragged?.pinned) reorderTopZone("playlist", pid, "playlist", targetPl.id, edge);
}

// Folder header: a dragged folder reorders (before/after). A dragged playlist
// uses 3 zones — top/bottom edge = land before/after the folder, middle = drop
// INTO the folder.
function folderHeaderZone(e: DragEvent): "before" | "into" | "after" {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const y = e.clientY - rect.top;
  if (y < rect.height * 0.28) return "before";
  if (y > rect.height * 0.72) return "after";
  return "into";
}
function onFolderHeaderDragOver(folder: PlaylistFolder, e: DragEvent) {
  // Folders and albums can only land before/after a folder (no "into" zone —
  // folders contain playlists only).
  if (dragging.value?.type === "folder" || dragging.value?.type === "album") {
    dragOverFolder.value = null;
    dropMarker.value = { kind: "folder", id: folder.id, edge: edgeFromEvent(e) };
    return;
  }
  const zone = folderHeaderZone(e);
  if (zone === "into") {
    dropMarker.value = null;
    dragOverFolder.value = folder.id;
  } else {
    dragOverFolder.value = null;
    dropMarker.value = { kind: "folder", id: folder.id, edge: zone };
  }
}
async function onFolderHeaderDrop(folder: PlaylistFolder, e: DragEvent) {
  void e;
  const drag = dragging.value;
  const edge = dropMarker.value?.edge ?? "before";
  const into = dragOverFolder.value === folder.id;
  clearDrag();
  if (!drag) return;

  if (drag.type === "folder" || drag.type === "album") {
    if (drag.type === "folder" && drag.id === folder.id) return;
    reorderTopZone(drag.type, drag.id, "folder", folder.id, edge);
    return;
  }

  const pid = drag.id;
  if (into) {
    folderStore.move(pid, folder.id);
    return;
  }
  if (folderStore.folderOf.has(pid)) await folderStore.move(pid, null);
  const dragged = playlists.playlists.find((p) => p.id === pid);
  if (dragged?.pinned) reorderTopZone("playlist", pid, "folder", folder.id, edge);
}

// folder body / empty area: append a dragged playlist to the folder
// (folders and albums can't be dropped into a folder)
function onDropToFolder(folderId: number, e: DragEvent) {
  if (dragging.value && dragging.value.type !== "playlist") return clearDrag();
  const pid = readDragPid(e);
  clearDrag();
  if (pid !== null) folderStore.move(pid, folderId);
}
// drop in the top-zone empty space → append the dragged item to the end
function onDropToTopZone(e: DragEvent) {
  void e;
  const drag = dragging.value;
  clearDrag();
  if (!drag) return;
  const last = topZone.value[topZone.value.length - 1];
  if (!last || (drag.id === last.id && drag.type === last.kind)) return;
  if (drag.type === "folder" || drag.type === "album") {
    reorderTopZone(drag.type, drag.id, last.kind, last.id, "after");
  } else {
    const dragged = playlists.playlists.find(p => p.id === drag.id);
    if (dragged?.pinned && !folderStore.folderOf.has(drag.id)) {
      reorderTopZone("playlist", drag.id, last.kind, last.id, "after");
    }
  }
}
// bottom (un-pinned) zone: dropping here ungroups a playlist out of any folder
function onDropToTop(e: DragEvent) {
  if (dragging.value?.type === "folder") return clearDrag();
  const pid = readDragPid(e);
  clearDrag();
  if (pid !== null) folderStore.move(pid, null);
}
function onNewFolder() {
  modal.showFolderModal();
}
// All tracks of a folder: its playlists in folder order, each in full.
// Returns null (with a toast) when the folder yields no tracks.
async function getFolderTracks(folder: PlaylistFolder): Promise<Track[] | null> {
  const results = await Promise.all(
    folder.items.map((pid) => getPlaylist(String(pid), false, 0, -1))
  );
  const tracks = results.flatMap((r) => r?.tracks ?? []);
  if (!tracks.length) {
    useToast().showNotification("Folder has no tracks", NotifType.Error);
    return null;
  }
  return tracks;
}

function onFolderContextMenu(e: MouseEvent, folder: PlaylistFolder) {
  // showContextMenu expects the options getter to return a Promise.
  const options = async () => [
    {
      label: "Play",
      icon: PlayIcon,
      action: async () => {
        const tracks = await getFolderTracks(folder);
        if (!tracks) return;
        tracklist.setFromPlaylistFolder(folder.name, folder.id, tracks);
        queue.playSource();
      },
    },
    {
      label: "Play next",
      icon: PlayNextIcon,
      action: async () => {
        const tracks = await getFolderTracks(folder);
        if (tracks) tracklist.insertAfterCurrent(tracks);
      },
    },
    {
      label: "Add to queue",
      icon: AddToQueueIcon,
      action: async () => {
        const tracks = await getFolderTracks(folder);
        if (tracks) tracklist.addTracks(tracks);
      },
    },
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

// Wrapper so the handler receives the actual Ref — in the template,
// ctxFlag would be auto-unwrapped to a plain boolean.
function onAlbumContextMenu(e: MouseEvent, al: Album) {
  showAlbumContextMenu(e, ctxFlag, al);
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
// Drag & drop: rows are positioned so the drop line can sit on their edge.
.sidebar-playlist-item,
.sidebar-folder-header {
  position: relative;
}

// The drop indicator — a brand-coloured line showing where the item will land.
.sidebar-playlist-item.drop-before::before,
.sidebar-playlist-item.drop-after::after,
.sidebar-folder-header.drop-before::before,
.sidebar-folder-header.drop-after::after {
  content: "";
  position: absolute;
  left: $small;
  right: $small;
  height: 2px;
  border-radius: 2px;
  // The theme's ink line, not static black: on the dark ground the drop
  // indicator was black on near-black, so the one piece of feedback telling
  // you where the item would land was invisible in exactly half the themes.
  background-color: $mem-line;
  pointer-events: none;
}

.sidebar-playlist-item.drop-before::before,
.sidebar-folder-header.drop-before::before {
  top: -1px;
}

.sidebar-playlist-item.drop-after::after,
.sidebar-folder-header.drop-after::after {
  bottom: -1px;
}

.l-sidebar {
  grid-area: l-sidebar;
  display: grid;
  // Logo now lives in the top bar; sidebar is scrollable list + now-playing card.
  grid-template-rows: 1fr max-content;
  @include candy-box($candy-white, $candy-radius);
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
    background-color: $candy-pink-deep;
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
  border-top: 1px solid $separator;

  .sidebar-library-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: $candy-text;
    padding: 0 $small 0.5rem;
    letter-spacing: 0.05em;

    // "New folder". Its blush circle came from the global button base — the
    // comment here used to say so — which meant a control with no owner: no
    // border, no shadow, and 22px across in a design where every other button
    // has a frame it sits in. It takes the action role now, at the smallest
    // size that still reads as a button next to the section caption.
    .sidebar-newfolder {
      @include btn-action($size: 1.75rem, $radius: 50%);

      svg {
        width: 0.9rem;
        height: 0.9rem;
      }
    }
  }

  .sidebar-folder {
    border-radius: $sidebar-row-radius;

    &.drag-over {
      background-color: $candy-pink-soft;
      outline: 1px dashed $mem-line;
    }

    .sidebar-folder-header {
      display: flex;
      align-items: center;
      gap: $small;
      // Match a playlist row's height exactly (2rem thumbnail + 2x0.35rem
      // padding) so folders sit in the same rhythm as the other items — which
      // is also why the reserved transparent frame and the shrunk padding
      // below mirror .sidebar-playlist-item exactly.
      min-height: 2.7rem;
      border: $candy-border-w solid transparent;
      padding: calc(0.35rem - #{$candy-border-w}) calc(#{$small} - #{$candy-border-w});
      border-radius: $sidebar-row-radius;
      cursor: pointer;
      font-size: $sidebar-row-font;
      font-weight: 600;
      transition: background-color 0.15s;

      &:hover {
        background-color: $candy-pink-soft;
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
      border-left: 1px solid $separator;
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
    // The ink frame of the active row is reserved as a transparent border on
    // every row (and shaved off the padding), so selecting a playlist draws
    // the frame without nudging the row's contents or changing its height.
    border: $candy-border-w solid transparent;
    padding: calc(0.35rem - #{$candy-border-w}) calc(#{$small} - #{$candy-border-w});
    border-radius: $sidebar-row-radius;
    transition: background-color 0.15s;
    font-size: $sidebar-row-font;
    font-weight: 500;

    // Hover draws the ink frame too, not just a fill. The transparent border is
    // already reserved above (that is how `.active` gets its frame without
    // nudging the row), so hovering only had to colour it — it just never did,
    // leaving the sidebar the one hoverable list in the app without a frame.
    &:hover { @include candy-row-hover($candy-pink-soft, $sidebar-row-radius); }
    &.active {
      // Blush accent -> pin static ink for the row text. The selected item is
      // the one filled surface in the sidebar, so it carries the ink frame
      // like every other filled surface in this design.
      background-color: $candy-pink;
      border-color: $mem-line;
      color: $mem-ink;
    }

    span.ellip {
      opacity: 0.85;
      flex: 1;
      min-width: 0;
    }

    .pl-pin {
      flex-shrink: 0;
      width: 0.95rem;
      height: 0.95rem;
      color: $candy-text;
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
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease;

      svg {
        height: 1rem;
        width: 1rem;
        // White play glyph over the dark hover scrim — static light.
        color: $mem-panel-static;
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
    background-color: $candy-pink-soft;
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
