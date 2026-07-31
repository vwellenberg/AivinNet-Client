import { Option, Playlist } from "../interfaces";
import { playFromPlaylist } from "@/helpers/usePlayFrom";
import { togglePlaylistPin } from "@/helpers/pinPlaylist";
import { AddToQueueIcon, DeleteIcon, PencilIcon, PlayIcon, PlayNextIcon, PushPinIcon } from "@/icons";
import { getPlaylist } from "@/requests/playlists";
import useModalStore from "@/stores/modal";
import usePlaylistFolders from "@/stores/playlistFolders";
import useTracklist from "@/stores/queue/tracklist";

/**
 * @param on_page  The menu belongs to the playlist page's own header, so it may
 *   offer Edit. The edit modal reads the PLAYLIST PAGE STORE rather than taking
 *   a playlist — offering it from the sidebar would edit whichever playlist
 *   happens to be open, not the one that was right-clicked.
 */
export default async (playlist: Playlist, on_page = false) => {
  const modal = useModalStore();

  const play: Option = {
    label: "Play",
    icon: PlayIcon,
    action: () => playFromPlaylist(String(playlist.id)),
  };

  const playNext: Option = {
    label: "Play next",
    icon: PlayNextIcon,
    action: async () => {
      const data = await getPlaylist(String(playlist.id), false, 0, -1);
      if (!data) return;
      useTracklist().insertAfterCurrent(data.tracks);
    },
  };

  const addToQueue: Option = {
    label: "Add to queue",
    icon: AddToQueueIcon,
    action: async () => {
      const data = await getPlaylist(String(playlist.id), false, 0, -1);
      if (!data) return;
      useTracklist().addTracks(data.tracks);
    },
  };

  const pin: Option = {
    label: playlist.pinned ? "Unpin" : "Pin",
    icon: PushPinIcon,
    action: () => togglePlaylistPin(playlist.id),
  };

  // One of the two actions the header's overflow button took over from the
  // absolutely positioned corner box. Page-only — see `on_page` above.
  const edit: Option = {
    label: "Edit",
    icon: PencilIcon,
    action: () => modal.showEditPlaylistModal(),
  };

  const del: Option = {
    label: "Delete",
    icon: DeleteIcon,
    critical: true,
    action: () => modal.showDeletePlaylistModal(playlist.id),
  };

  const folderStore = usePlaylistFolders();

  const moveToFolder: Option = {
    label: "Move to folder",
    children: async () => {
      // Always offer to create a folder right here (so it works even with no
      // folders yet); the new folder immediately receives this playlist.
      const newFolder: Option = {
        label: "New folder…",
        action: () => modal.showFolderModal({ movePlaylistId: playlist.id }),
      };

      const items: Option[] = [newFolder];

      if (folderStore.folderOf.has(playlist.id)) {
        items.push({ label: "Remove from folder", action: () => folderStore.move(playlist.id, null) });
      }

      const folderOptions: Option[] = folderStore.sortedFolders.map((f) => ({
        label: f.name,
        action: () => folderStore.move(playlist.id, f.id),
      }));

      if (folderOptions.length) {
        items.push({ type: "separator" }, ...folderOptions);
      }

      return items;
    },
  };

  return [play, playNext, addToQueue, pin, moveToFolder, ...(on_page ? [edit] : []), del];
};
