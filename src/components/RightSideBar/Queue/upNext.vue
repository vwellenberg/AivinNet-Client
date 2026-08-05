<template>
  <div class="bottom-left">
    <div class="upNext rounded-sm border" title="play next song">
      <img
        :src="paths.images.thumb.small + queue.next?.image"
        class="rounded-sm"
      />
      <div class="text">
        <div class="title"><b>Stiff necked fools</b></div>
        <div class="from">Next up</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { paths } from "@/config";
import useQueueStore from "@/stores/queue";

import { ref } from "vue";

const context_on = ref(false);
const queue = useQueueStore();
</script>

<style lang="scss">
.bottom-left {
  overflow: hidden;
  display: grid;
  padding-top: 2px;
  // place-content: end;

  .upNext {
    padding: $smaller;
    grid-template-columns: max-content 1fr;
    gap: $small;
    display: grid;
    width: 20rem;
    @include candy-box($candy-pink-soft, $candy-radius-sm);
    cursor: pointer;
    // On the element, not inside `:hover` — a transition declared there only
    // eases the way in.
    transition: background-color 0.2s ease-out, color 0.2s ease-out;

    // The shared pointer signal (#422). This card still hovered blush, the
    // retired pointer colour; the text token travels with the contrast fill,
    // and nothing inside pins a colour, so inheriting it is enough.
    &:hover {
      background-color: $mem-hover;
      color: var(--mem-hover-text);
    }

    img {
      height: 2.75rem;
    }

    .text {
      font-size: small;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;

      .from {
        opacity: 0.75;
        font-size: $medium;
        margin-top: $smaller;
      }
    }
  }
}
</style>
