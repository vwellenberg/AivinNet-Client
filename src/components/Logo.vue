<template>
  <router-link class="swing-logo rounded-md" :to="{ name: 'Home' }">
    <img src="@/assets/icons/logos/logo-subspaceradio.png" alt="AivinNet" class="logo-img" />
    <span>AivinNet</span>
  </router-link>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
.swing-logo {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: $medium;
  padding-left: 1rem;
  border: solid 1px $gray5;
  background-image: linear-gradient(37deg, rgb(29, 28, 28), transparent);
  transition: background-color 0.2s ease-out;

  .logo-img {
    height: 1.75rem;
    width: 1.75rem;
    object-fit: contain;
  }

  &:hover {
    background-color: $gray5;
  }
}
</style>
