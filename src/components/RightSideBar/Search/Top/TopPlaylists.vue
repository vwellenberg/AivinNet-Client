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

<style lang="scss">
.right-search-top-albums-or-artists {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  padding: $small $smaller;
  gap: $small 0;
  margin-bottom: 2rem;
}
</style>
