<template>
  <div class="genres-banner">
    <div class="scrollable">
      <div class="rounded pad-sm genre-pill">
        {{ genres.length ? "Genres" : "No genres" }}
      </div>
      <div
        v-for="genre in genres"
        :key="genre.genrehash"
        class="genre-pill rounded pad-sm"
      >
        {{ genre.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useAlbumStore from "@/stores/pages/album";
import useArtistStore from "@/stores/pages/artist";
import { computed } from "vue";

const album = useAlbumStore();
const store = useArtistStore();

const props = defineProps<{
  source: string;
}>();

const genres = computed(() => {
  return props.source === "album" ? album.info.genres : store.info.genres;
});

// const hookAction = async () => {
//   if (props.source === "album") {
//     // fetch data to be used in the component below this one.
//     await album.fetchArtistAlbums();
//     return;
//   }
// };

// onMounted(hookAction);
</script>

<style lang="scss">
.genres-banner {
  margin-top: 2rem;
  padding-bottom: 2rem;
  font-size: 0.9rem;
  padding-left: $medium;
  text-transform: capitalize;
  user-select: none;
  overflow: scroll;
  @include hideScrollbars;

  .scrollable {
    display: flex;
    flex-wrap: nowrap;
    width: max-content;
    gap: 1rem;
    padding-right: $medium;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .genre-pill {
    background-color: $candy-lavender;
    border: 1px solid $mem-line;
    border-radius: $candy-radius-pill;
    color: $candy-black;
    min-width: 4rem;
    text-align: center;
    padding: $small 1rem;
    font-weight: 700;
    transition: background-color 0.2s ease-out, color 0.2s ease-out;

    &:first-child {
      // Static-white "primary genre" pill with ink text — keep it light in
      // both themes so the ink label stays readable (not a panel surface).
      background-color: $mem-panel-static;
      color: $candy-black;
      pointer-events: none;
    }

    &:hover {
      background-color: $candy-pink-deep !important;
      color: $candy-black;
    }
  }
}
</style>
