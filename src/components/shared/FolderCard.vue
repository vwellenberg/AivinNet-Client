<template>
  <RouterLink
    :to="{
      name: Routes.folder,
      params: {
        path: folder.path,
      },
    }"
    class="foldercard rounded"
  >
    <div class="rimg rounded-sm">
      <!-- The folder glyph used to be pasted in here as a raw path — a private
           copy of folder-1.svg that no icon change would ever reach. It reads
           from the shared asset now. -->
      <FolderSvg class="bg" />
      <PlayBtn :source="playSources.folder" :folderpath="folder.path" />
    </div>

    <div v-if="folder.help_text" class="rhelp folder">
      <span class="help">{{ folder.help_text }}</span>
      <span class="time">{{ folder.time }}</span>
    </div>
    <div class="ellip title" :title="name(folder.path)">
      {{ name(folder.path) }}
    </div>
    <div class="rtcount">
      <b>{{ folder.count }} Track{{ folder.count == 1 ? "" : "s" }}</b>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { playSources } from "@/enums";
import { Routes } from "@/router";
import PlayBtn from "../shared/PlayBtn.vue";
import FolderSvg from "@/assets/icons/folder.svg";

defineProps<{
  folder: {
    path: string;
    count: number;
    help_text: string;
    time?: string;
  };
}>();

const name = (path: string) => {
  // remove trailing slash
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  const splits = path.split("/");

  return splits[splits.length - 1];
};
</script>

<style lang="scss">
.foldercard {
  padding: $medium;
  display: flex;
  flex-direction: column;
  height: max-content;
  transition: background-color 0.2s ease-out;
  @include candy-box($mem-panel, $candy-radius);

  .title {
    font-weight: 700;
    font-size: 0.95rem;
    color: $candy-text;
  }

  @include card-play-btn;

  &:hover {
    background-color: $mem-hover;
  }

  svg.bg {
    // The placeholder glyph for a folder tile. Sized here rather than by a
    // scale factor on a 30px box: the new set fills its viewBox to a known
    // 18/24, so an explicit size is the honest way to say how big it should be.
    width: 3.6rem;
    height: 3.6rem;
    color: $candy-text-muted;
  }

  .rimg {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    margin-bottom: $small;
    overflow: hidden;
    @include candy-box($candy-pink-soft, $candy-radius-sm);

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rtcount {
    font-size: 0.75rem;
    color: $candy-text-muted;
    margin-top: $smaller;
  }
}
</style>
