<template>
  <router-link class="swing-logo" :to="{ name: 'Home' }" title="Home">
    <div class="logo-orbit-wrapper">
      <img src="@/assets/icons/logos/logo-subspaceradio.png" alt="AivinNet" class="logo-img" />
      <span class="logo-orbit" aria-hidden="true"><i class="logo-moon"></i></span>
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
  // The hover orbit reaches 7px past the planet — never clip it.
  overflow: visible;
}

// The one piece of chrome that is NOT a tile: the pixel planet stands on its
// own, no box around it.
//
// It used to sit on an ink fill, which was the only place in the app where ink
// was used as a SURFACE rather than as a line — and it read wrong in both
// themes: a hard black hole next to the white/blush chrome in light, and
// practically invisible in dark, where ink (#17171A) lands on the panel colour
// (#141416) and only the border kept the tile on screen (#318).
//
// Dropping the box is not just a subtraction: border + padding used to eat a
// third of the footprint, so the artwork goes from ~31px to the full 48px and
// the pixel art is finally legible.
.logo-orbit-wrapper {
  position: relative;
  // One chrome footprint, like every other control in the top bar it heads.
  // Its LOOK stays deliberately outside the roles (no plate, no shadow, the
  // orbit below) — only the box follows.
  width: $bar-control;
  height: $bar-control;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  // No candy-box/candy-raised here on purpose: an offset shadow needs a surface
  // to fall off, and there is none. The tilt below is the whole transition — on
  // the one curve in the system that anticipates, reserved for character
  // moments like this.
  transition: transform $motion-move $motion-curve-back;

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    // What replaces the frame: a hard 2px outline hugging the pixel silhouette,
    // in the theme's line colour (ink on paper, paper on the dark ground), so
    // the planet keeps an edge on both themes without a box. Four orthogonal
    // drop-shadows are enough — they apply cumulatively, so the diagonals come
    // out closed. No blur: this design has no soft edges.
    filter: drop-shadow(2px 0 0 $mem-line) drop-shadow(-2px 0 0 $mem-line)
      drop-shadow(0 2px 0 $mem-line) drop-shadow(0 -2px 0 $mem-line);
  }
}

// The orbit: the frame's job (marking the target) moves into the hover, where
// it can be a character moment instead of permanent furniture.
//
// It is a FLAT, TILTED ellipse, not a ring around the planet, for a reason that
// is geometry rather than taste: a concentric circle around an object that
// nearly fills the bar must reach past its edge. At $bar-control (44px) in the
// short bar ($navheight-short, 60px) a circle at inset -7px left ~1px of air.
// Tilted and flattened, the path measures ~36px vertically — less than the
// planet itself — so it can never be the thing that runs out of room. It also
// simply reads better: a circle around a sphere is a halo, a slanted ellipse is
// an orbit.
//
// The flattening comes from the BOX (width/height + border-radius: 50%), never
// from `scaleY`: scaling would squash the dash stroke thin at top and bottom
// and drag the moon out of square with it.
.logo-orbit {
  position: absolute;
  // Vertical inset as a share of the tile, so the path keeps its proportions if
  // the chrome footprint changes again (#356). 0.3 → a path ~30% as tall as it
  // is wide; the 7px of horizontal overhang is what makes it read as "around".
  inset: calc(#{$bar-control} * 0.3) -7px;
  border: 2px dashed $mem-line;
  border-radius: 50%;
  opacity: 0;
  transform: rotate(-20deg) scale(0.72);
  transition: opacity $motion-move $motion-curve, transform $motion-move $motion-curve-back;
  pointer-events: none;

  // A pixel moon riding the orbit — coral, the design's secondary accent and
  // the one accent the planet's own palette does not already carry.
  .logo-moon {
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 6px;
    background-color: $mem-coral;
    border: 1px solid $mem-line;
    // The moon travels the path ITSELF, via motion path. Rotating a wrapper (as
    // the circular version did) sends it around a circle instead — on an
    // ellipse the two come apart everywhere except the four extremes. The shape
    // is given in percentages of this box, so it stays welded to the ring that
    // is drawn from the same box; no pixel constants to keep in sync.
    offset-path: ellipse(50% 50% at 50% 50%);
    offset-rotate: 0deg;
    // Undoes the path's tilt so the pixel moon stays square to the screen.
    transform: rotate(20deg);
  }
}

// Scoped to pointer devices: `:hover` latches after a tap on touch, which would
// leave the orbit parked around the planet for good. (The top bar hides the
// logo on phones entirely — this covers tablets and touch laptops.)
@media (hover: hover) {
  .swing-logo:hover .logo-orbit-wrapper {
    transform: rotate(-8deg);

    .logo-img {
      animation: logo-planet-spin 0.7s $motion-curve-settle;
    }

    .logo-orbit {
      opacity: 1;
      // Same tilt as at rest — only the scale grows, or the path would swing
      // into place instead of arriving.
      transform: rotate(-20deg) scale(1);
    }

    .logo-moon {
      animation: logo-moon-orbit 3s linear infinite;
    }
  }
}

// Pressed: squeezed rather than pushed into its own shadow, because there is no
// shadow to push into — plus the tilt, so the press does not undo the flick.
.swing-logo:active .logo-orbit-wrapper {
  transform: scale(0.9) rotate(-8deg);
}

// The planet spins once per hover. Deliberately hover/press-driven rather than
// an ambient loop: an idle animation on the one element that is always on
// screen is exactly what stops being charming on the tenth viewing (see
// _motion.scss on why the long loops are not part of the scale).
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

// One lap of the path. `offset-distance` animates the position ALONG the
// ellipse — a `transform: rotate` here would carry the moon around a circle
// again and lift it off the ring everywhere but the four extremes.
@keyframes logo-moon-orbit {
  from {
    offset-distance: 0%;
  }

  to {
    offset-distance: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .swing-logo:hover .logo-orbit-wrapper {
    transform: none;

    .logo-img {
      animation: none;
    }

    // The path still appears — it is the affordance, not the decoration. Only
    // the travelling parts stop; the moon stays parked at its 0% position.
    .logo-moon {
      animation: none;
    }
  }

  .swing-logo:active .logo-orbit-wrapper {
    transform: scale(0.94);
  }
}
</style>
