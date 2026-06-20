import { Option, Playlist } from "../interfaces";
import { playFromPlaylist } from "@/helpers/usePlayFrom";
import { togglePlaylistPin } from "@/helpers/pinPlaylist";
import { DeleteIcon, PlayIcon, PushPinIcon } from "@/icons";
import useModalStore from "@/stores/modal";

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

  return [play, pin, del];
};
