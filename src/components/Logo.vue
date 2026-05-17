<template>
  <router-link class="swing-logo rounded-md" :to="{ name: 'Home' }">
    <div class="logo-orbit-wrapper">
      <img src="@/assets/icons/logos/logo-subspaceradio.png" alt="AivinNet" class="logo-img" />
    </div>
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
  overflow: visible;

  &:hover {
    background-color: $gray5;
  }
}

.logo-orbit-wrapper {
  position: relative;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;

  .logo-img {
    width: 1.75rem;
    height: 1.75rem;
    object-fit: contain;
    position: relative;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid $brand-green;
    animation: logo-pulse 3s ease-in-out infinite;
    pointer-events: none;
    transform-origin: center;
  }
}

@keyframes logo-pulse {
  0%, 100% { transform: scale(1);    opacity: 0.85; }
  50%       { transform: scale(1.4);  opacity: 0;    }
}
</style>
