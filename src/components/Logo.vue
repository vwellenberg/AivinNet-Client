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
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  overflow: visible;
  transition: opacity 0.2s ease-out;

  &:hover {
    opacity: 0.8;
  }
}

.logo-orbit-wrapper {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;

  .logo-img {
    width: 2.25rem;
    height: 2.25rem;
    object-fit: contain;
    position: relative;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    border: 1.5px solid $brand-green;
    animation: logo-pulse 4s ease-in-out infinite;
    pointer-events: none;
    transform-origin: center;
    will-change: transform, opacity;
  }
}

@keyframes logo-pulse {
  0%, 100% { transform: scale(1);    opacity: 0.5; }
  50%       { transform: scale(1.3);  opacity: 0;   }
}
</style>
