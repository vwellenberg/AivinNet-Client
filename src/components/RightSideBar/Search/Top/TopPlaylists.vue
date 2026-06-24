<template>
  <div class="right-search-top-albums-or-artists">
    <PlaylistCard
      v-for="playlist in search.top_results.playlists.slice(0, 6)"
      :key="playlist.id"
      :playlist="playlist"
    />
  </div>
</template>

<script setup lang="ts">
import useSearchstore from "@/stores/search";
import PlaylistCard from "@/components/PlaylistsList/PlaylistCard.vue";

const search = useSearchstore();
</script>

<!-- Layout comes from the shared global `.right-search-top-albums-or-artists`
     rule defined in TopAlbums.vue, mirroring TopArtists.vue. -->

