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

  &:hover {
    background-color: $gray5;
  }
}

.logo-orbit-wrapper {
  position: relative;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    position: relative;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-top-color: $brand-green;
    border-right-color: $brand-purple;
    animation: logo-orbit 5s linear infinite;
    pointer-events: none;
  }
}

@keyframes logo-orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
