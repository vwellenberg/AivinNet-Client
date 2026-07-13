<template>
  <span
    v-if="bitrate > 1024"
    class="master-flag"
    :title="!text ? 'Master audio bitrate - ' + `${bitrate} Kbps` : ''"
    >{{ text ? text : "M" }}</span
  >
</template>

<script setup lang="ts">
defineProps<{
  bitrate: number;
  text?: string;
  bg_color?: string;
  text_color?: string;
  fill?: boolean;
}>();
</script>

<style lang="scss">
.master-flag {
  font-size: 10px;
  font-weight: 600;
  margin-left: $smaller;
  padding: 2px 5px;
  border-radius: $candy-radius-pill;
  text-transform: uppercase;
  background-color: $candy-lavender;
  border: 1px solid $candy-black;
  color: $candy-black;
}
</style>
