<template>
  <router-link class="swing-logo" :to="{ name: 'Home' }">
    <div class="logo-orbit-wrapper">
      <img src="@/assets/icons/logos/logo-subspaceradio.png" alt="AivinNet" class="logo-img" />
    </div>
    <span class="logo-wordmark">AivinNet</span>
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

  // Brand wordmark next to the icon (desktop top bar; Logo only renders there):
  // BCS-red text with a green light sweeping through the glyphs.
  .logo-wordmark {
    position: relative;
    font-size: 1.05rem;
    font-weight: 600;
    color: $brand-red;
    letter-spacing: 0.02em;
    white-space: nowrap;

    // A narrow green beam travels across, clipped to the letters (the base red
    // shows through everywhere the beam isn't).
    &::after {
      content: "AivinNet";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        100deg,
        transparent 44%,
        rgba($brand-green, 0.85) 48%,
        #c4ffe6 50%,
        rgba($brand-green, 0.85) 52%,
        transparent 56%
      );
      background-size: 200% 100%;
      background-position-x: 120%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      filter: drop-shadow(0 0 5px rgba($brand-green, 0.6));
      pointer-events: none;
      animation: wordmark-shine 5s ease-in-out infinite;
    }
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
      rgba(29, 158, 117, 0.75) 12%,
      rgba(29, 158, 117, 0.35) 30%,
      rgba(29, 158, 117, 0.12) 55%,
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

// Green light sweeping across the BCS-red AivinNet wordmark.
@keyframes wordmark-shine {
  0%        { background-position-x: 120%; }
  55%, 100% { background-position-x: -20%; }
}
</style>
