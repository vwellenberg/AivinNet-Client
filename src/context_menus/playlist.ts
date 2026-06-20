import { Option, Playlist } from "../interfaces";
import { pinUnpinPlaylist } from "@/requests/playlists";
import { playFromPlaylist } from "@/helpers/usePlayFrom";
import usePlaylistsStore from "@/stores/pages/playlists";

export default async (playlist: Playlist) => {
  const play: Option = {
    label: "Wiedergeben",
    action: () => playFromPlaylist(String(playlist.id)),
  };

  const pin: Option = {
    label: playlist.pinned ? "Loslösen" : "Anpinnen",
    action: async () => {
      const ok = await pinUnpinPlaylist(playlist.id);
      if (ok) usePlaylistsStore().togglePin(playlist.id);
    },
  };

  return [play, pin];
};
