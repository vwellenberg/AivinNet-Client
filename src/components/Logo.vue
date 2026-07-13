<template>
  <router-link class="swing-logo" :to="{ name: 'Home' }">
    <div class="logo-orbit-wrapper">
      <img src="@/assets/icons/logos/logo-subspaceradio.png" alt="AivinNet" class="logo-img" />
    </div>
  </router-link>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
.swing-logo {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6rem;
  width: 100%;
  height: 100%;
  overflow: visible;
  transition: opacity 0.2s ease-out;

  &:hover {
    opacity: 0.8;
  }
}

// Flat candy treatment: the pixel-art planet sits in a black rounded square
// (no glow — flat design has no gradients or pulses).
.logo-orbit-wrapper {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $candy-black;
  border-radius: $candy-radius-sm;
  padding: 0.25rem;

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>
