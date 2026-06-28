import { defineStore } from "pinia";
import { Playlist } from "@/interfaces";
import { getAllPlaylists, reorderSidebarPlaylists } from "@/requests/playlists";

export default defineStore("playlists", {
  state: () => ({
    playlists: <Playlist[]>[],
  }),
  getters: {
    /**
     * Pinned playlists first; within a group by manual drag order
     * (settings.position) and then alphabetically. Used by the library sidebar.
     */
    sortedPlaylists(): Playlist[] {
      const pos = (p: Playlist) =>
        typeof p.settings?.position === "number" ? p.settings.position : Number.MAX_SAFE_INTEGER;
      return [...this.playlists].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        const pa = pos(a);
        const pb = pos(b);
        if (pa !== pb) return pa - pb;
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
    /**
     * Persist explicit sidebar positions for playlists (shared space with
     * folders) and reflect them locally right away.
     */
    async reorderTopLevel(positions: { id: number; position: number }[]) {
      for (const { id, position } of positions) {
        const pl = this.playlists.find((p) => p.id === id);
        if (pl) {
          if (!pl.settings) pl.settings = {} as any;
          pl.settings.position = position;
        }
      }
      await reorderSidebarPlaylists(positions);
    },
  },
});
