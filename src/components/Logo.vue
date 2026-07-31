<template>
  <router-link class="swing-logo" :to="{ name: 'Home' }" title="Home">
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
}

// Flat candy treatment: the pixel-art planet sits in a black rounded square.
// Same 3rem footprint, radius and offset shadow as the home button it shares
// the top bar with — they are the two pieces of navigation chrome up there and
// used to be two different sizes (2.25rem vs 3rem), with only one of them lit.
.logo-orbit-wrapper {
  position: relative;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $candy-black;
  border-radius: $candy-radius-sm;
  padding: 0.35rem;
  @include candy-raised(4px, 4px, $press: false);
  // candy-raised's own transition covers box-shadow + transform; the tilt below
  // travels on transform too, so it is restated here with the one curve in the
  // system that anticipates — this is the character moment it is reserved for.
  transition: box-shadow $motion-shadow $motion-curve, transform $motion-move $motion-curve-back;

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

// The planet spins once per hover, and the tile flicks against it. Deliberately
// hover/press-driven rather than an ambient loop: an idle animation on the one
// element that is always on screen is exactly what stops being charming on the
// tenth viewing (see _motion.scss on why the long loops are not part of the
// scale).
.swing-logo:hover .logo-orbit-wrapper {
  transform: rotate(-8deg);

  .logo-img {
    animation: logo-planet-spin 0.7s $motion-curve-settle;
  }
}

// Pressed: into its own shadow, like every other raised surface — plus the tilt,
// so the press does not undo the flick.
.swing-logo:active .logo-orbit-wrapper {
  transform: translate(4px, 4px) rotate(-8deg);
  box-shadow: none;
}

@keyframes logo-planet-spin {
  from {
    transform: rotate(0deg) scale(1);
  }

  55% {
    transform: rotate(200deg) scale(1.12);
  }

  to {
    transform: rotate(360deg) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .swing-logo:hover .logo-orbit-wrapper {
    transform: none;

    .logo-img {
      animation: none;
    }
  }

  .swing-logo:active .logo-orbit-wrapper {
    transform: translate(4px, 4px);
  }
}
</style>
