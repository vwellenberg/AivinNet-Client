import { defineStore } from "pinia";
import { Playlist } from "@/interfaces";
import { getAllPlaylists } from "@/requests/playlists";

export default defineStore("playlists", {
  state: () => ({
    playlists: <Playlist[]>[],
  }),
  getters: {
    /**
     * Pinned playlists first, then the rest — each group alphabetical.
     * Used by the library sidebar.
     */
    sortedPlaylists(): Playlist[] {
      return [...this.playlists].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    },
  },
  actions: {
    /**
     * Fetch all playlists from the server
     */
    async fetchAll() {
      const playlists = await getAllPlaylists();
      this.playlists = playlists;
    },
    /**
     * Flip the pinned flag for a playlist in the store (after the server call).
     */
    togglePin(id: number) {
      const pl = this.playlists.find((p) => p.id === id);
      if (pl) pl.pinned = !pl.pinned;
    },
    /**
     * Remove a playlist from the store (after the server delete succeeds) so
     * the library sidebar updates immediately instead of only after a reload.
     */
    removePlaylist(id: number) {
      this.playlists = this.playlists.filter((p) => p.id !== id);
    },
    /**
     * Adds a single playlist to the store
     * @param playlist Playlist to add to the store
     * @returns void
     */
    addPlaylist(playlist: Playlist) {
      setTimeout(() => {
        this.playlists.unshift(playlist);
      }, 250);
    },
  },
});
