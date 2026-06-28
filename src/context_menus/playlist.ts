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
      if (folderStore.folders.length === 0) {
        return [{ label: "No folders yet", action: () => {} }] as Option[];
      }

      const folderOptions: Option[] = folderStore.sortedFolders.map((f) => ({
        label: f.name,
        action: () => folderStore.move(playlist.id, f.id),
      }));

      if (folderStore.folderOf.has(playlist.id)) {
        return [
          { label: "Remove from folder", action: () => folderStore.move(playlist.id, null) },
          { type: "separator" },
          ...folderOptions,
        ];
      }

      return folderOptions;
    },
  };

  return [play, pin, moveToFolder, del];
};
