<template>
  <div class="r-home">
    <UpNext :track="tracklist.tracklist[queue.nextindex]" :play-next="queue.playNext" />
    <!-- <Recommendations /> -->
  </div>
</template>

<script setup lang="ts">
import useQStore from "../../../stores/queue";
import useTracklist from "../../../stores/queue/tracklist";
import UpNext from "../Queue/upNext.vue";
const queue = useQStore();
const tracklist = useTracklist();
</script>

<style lang="scss">
.r-home {
  height: calc(100% - 1rem);
}
</style>
