import { Option, Playlist } from "../interfaces";
import { playFromPlaylist } from "@/helpers/usePlayFrom";
import { togglePlaylistPin } from "@/helpers/pinPlaylist";

export default async (playlist: Playlist) => {
  const play: Option = {
    label: "Wiedergeben",
    action: () => playFromPlaylist(String(playlist.id)),
  };

  const pin: Option = {
    label: playlist.pinned ? "Loslösen" : "Anpinnen",
    action: () => togglePlaylistPin(playlist.id),
  };

  return [play, pin];
};
