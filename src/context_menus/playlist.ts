import { Option, Playlist } from "../interfaces";
import { playFromPlaylist } from "@/helpers/usePlayFrom";
import { togglePlaylistPin } from "@/helpers/pinPlaylist";
import { DeleteIcon, PlayIcon, PushPinIcon } from "@/icons";
import useModalStore from "@/stores/modal";
import usePlaylistFolders from "@/stores/playlistFolders";

export default async (playlist: Playlist) => {
  const modal = useModalStore();

  const play: Option = {
    label: "Play",
    icon: PlayIcon,
    action: () => playFromPlaylist(String(playlist.id)),
  };

  const pin: Option = {
    label: playlist.pinned ? "Unpin" : "Pin",
    icon: PushPinIcon,
    action: () => togglePlaylistPin(playlist.id),
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

  return [play, pin, moveToFolder, del];
};
