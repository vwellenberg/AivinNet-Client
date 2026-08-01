<template>
  <div class="album-info dh-body">
    <div class="top">
      <!-- <AlbumType :album="album" /> -->
      <div class="albumtype dh-type">{{ album.type }}</div>
      <div id="albumheadertitle" class="title dh-title ellip2">
        <span v-for="t in titleSplits" :key="t">{{ t }}<br /></span>
      </div>
    </div>
    <div class="bottom">
      <div id="test-elem"></div>
      <Versions :versions="album.versions" />
      <Stats :album="album" />
      <Buttons />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
import { onBeforeRouteUpdate } from "vue-router";

import { balanceText } from "@/utils/balanceText";

import useAlbumStore from "@/stores/pages/album";
import updatePageTitle from "@/utils/updatePageTitle";

import Stats from "./Stats.vue";
import Buttons from "./Buttons.vue";
import Versions from "./Versions.vue";
import AlbumType from "./AlbumType.vue";

const store = useAlbumStore();

const { info: album } = storeToRefs(store);
const titleSplits = ref([""]);

const updateTitle = () => {
  updatePageTitle(album.value.title + " - " + album.value.albumartists[0].name);
  const elem = document.getElementById("test-elem");
  titleSplits.value = balanceText(album.value.title, elem?.offsetWidth || 0);
};

onMounted(() => {
  updateTitle();
});

onBeforeRouteUpdate(() => {
  updateTitle();
});
</script>

<style lang="scss">
// Type, title and meta sizes come from `.dh-type` / `.dh-title` in the shared
// anatomy (Global/detail-head.scss). The ground halos that used to sit on the
// type and the meta line are gone with them: they existed because the text
// stood free on the doodle ground, and it now stands on a panel.
.album-info {
  .top {
    .albumtype {
      text-transform: capitalize;
    }

    .title {
      width: fit-content;
      cursor: text;
    }

    .artist {
      font-size: 1.15rem;
    }
  }

  .bottom {
    margin-top: $smaller;

    .stats2 {
      text-align: center;
      margin: 0;
    }

    .versions {
      margin-bottom: $medium;
      margin-left: -$smaller;

      // &:first-child {}
      // .master-flag {
      //   background-color: transparent !important;
      //   border: solid 1px !important;
      // }
    }
  }
}
</style>
