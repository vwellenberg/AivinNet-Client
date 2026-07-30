<template>
  <button class="play-btn circular" @click.prevent.stop="handlePlay">
    <PlaySvg />
  </button>
</template>

<script setup lang="ts">
import { playSources } from "@/enums";
import {
  playFromAlbumCard,
  playFromArtistCard,
  playFromFavorites,
  playFromFolderCard,
  playFromPlaylist,
} from "@/helpers/usePlayFrom";
import { Playlist, Track } from "@/interfaces";

import PlaySvg from "@/assets/icons/play.svg";
import useQueue from "@/stores/queue";
import useTracklist from "@/stores/queue/tracklist";
import useSearchStore from "@/stores/search";

const props = defineProps<{
  source: playSources | null;
  albumHash?: string;
  albumName?: string;
  artisthash?: string;
  artistname?: string;
  folderpath?: string;
  playlist?: string;
  track?: Track;
}>();

function handlePlay() {
  switch (props.source) {
    case playSources.album:
      playFromAlbumCard(props.albumHash || "", props.albumName || "");
      break;

    case playSources.artist:
      playFromArtistCard(props.artisthash || "", props.artistname || "");
      break;
    case playSources.folder:
      playFromFolderCard(props.folderpath || "");
      break;
    case playSources.recentlyAdded:
      playFromPlaylist("recentlyadded", props.track);
      break;
    case playSources.track: {
      // insert after current and play
      if (!props.track) break;

      const queue = useQueue();
      const search = useSearchStore();
      const tracklist = useTracklist();

      queue.clearQueue();
      tracklist.setFromSearch(search.query, [props.track]);
      queue.play();
      break;
    }
    case playSources.favorite:
      playFromFavorites(props.track);
      break;
    case playSources.playlist:
      playFromPlaylist(props.playlist as string);
      break;

    default:
      break;
  }
}
</script>

<style lang="scss">
.play-btn {
  aspect-ratio: 1;
  // The global button base pins `height: 2.25rem`, and an explicit height wins
  // over aspect-ratio — so the button (sized by WIDTH from card-play-btn:
  // 3.25rem) rendered as an oval on every cover card. Let the width drive the
  // box. Call sites that set both dimensions (search top result) still win.
  height: auto;
  padding: 0;
  background: $mem-teal;
  border: $candy-border;
  // Ink play glyph on the teal button; play.svg uses currentColor.
  color: $mem-ink;
  display: grid;
  place-items: center;
  @include candy-shadow(3px, 3px);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;
  overflow: hidden; // clip the sprinkle to the circle

  // Memphis sprinkle over the teal fill (like the header Play CTA).
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    @include mem-sprinkle(24px);
    opacity: 0.4;
    pointer-events: none;
  }

  svg {
    position: relative;
    z-index: 1;
  }

  &:hover {
    // Primary "play" CTA — keep the teal identity, just scale + deepen the
    // hard shadow (no colour flip, matching the header Play button).
    background-color: $mem-teal;
    transform: scale(1.06);
    @include candy-shadow(4px, 4px);
  }

  svg {
    transition: transform 0.2s ease;
    height: 1.75rem;
  }
}
</style>
