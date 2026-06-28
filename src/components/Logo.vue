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
    inset: -12px;
    border-radius: 50%;
    background: radial-gradient(circle,
      rgba($brand-green, 0.75) 12%,
      rgba($brand-green, 0.35) 30%,
      rgba($brand-green, 0.12) 55%,
      transparent 80%);
    animation: logo-pulse 3.2s ease-in-out infinite;
    pointer-events: none;
    transform-origin: center;
    will-change: transform, opacity;
  }
}

@keyframes logo-pulse {
  0%, 100% { transform: scale(1);   opacity: 0.95; }
  50%      { transform: scale(1.7); opacity: 0;    }
}
</style>
