<template>
  <div class="side-nav-container">
    <router-link
      v-for="(menu, index) in menus"
      :key="index"
      v-wave
      :to="{
        name: menu.route_name || '',
        params: menu?.params,
        query: menu.query && menu.query(),
      }"
      class="nav-item"
      :class="{
        separator: menu.separator,
        active: $route.name === menu.route_name,
      }"
      @click="menu.action && menu.action()"
    >
      <div v-if="!menu.separator">
        <component :is="menu.icon" />
        <span>{{ menu.name }}</span>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { menus } from "./navitems";
</script>

<style lang="scss">
.side-nav-container {
  text-transform: capitalize;
  display: flex;
  flex-direction: column;
  // A plate throws its offset 3px down-right, so the rows need more air than
  // the 0.25rem they had as flat rows — otherwise each shadow lands on the
  // next row's frame. This is where the +6% sidebar height comes from.
  gap: $small;
  overflow: hidden;
  // `overflow: hidden` clips at the padding edge, so the plates' offset shadow
  // (3px at rest, 4px hovered) needs that much room reserved on the right or it
  // is cut off flush with the row.
  padding-right: $small;

  .nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    // The frame is part of the plate now, but the padding still subtracts it:
    // the row height must not depend on how thick $candy-border-w happens to
    // be. Measured before this compensation existed: the nav rows grew
    // 44 -> 46px when the border went to 3px, while the library rows below —
    // which already compensated — stayed exactly where they were.
    padding: calc(0.625rem - #{$candy-border-w}) 0;
    font-size: $sidebar-row-font;
    font-weight: 500;
    // The row IS a button and says so: panel fill, ink frame, offset shadow,
    // hatch. Same plate as the library rows below, from the same mixin — the
    // one thing this sidebar could not keep consistent by hand.
    @include mem-row-plate($sidebar-row-radius);

    & > div {
      display: flex;
      align-items: center;
    }

    // Active item = the static blush fill with the accent hatch. The plate's
    // frame and shadow stay exactly as they are, so switching pages moves
    // nothing.
    &.active {
      @include mem-row-plate-active;
    }

    // :not(.active): the hover fill is dark in dark mode and would override the
    // blush plate (same specificity, later rule) while the pinned ink label
    // stays — dark-on-dark. Active items keep their fill.
    &:hover:not(.active) {
      @include mem-row-plate-hover;
    }
  }

  // The separator is a `.nav-item` too, so it inherits the plate — and a plate
  // is exactly what a 1px spacer must not be. Everything the mixin paints is
  // taken back here; `background: none` also drops the hatch layer, which
  // `background-color` alone would leave behind.
  .nav-item.separator {
    height: 1px;
    padding: 0;
    border: none;
    background: none;
    box-shadow: none;
  }

  @include allPhones {
    justify-content: space-between;
    flex-direction: row;

    .nav-item {
      justify-content: center;
    }

    .nav-item span {
      display: none;
    }

    .separator {
      display: none;
    }
  }

  @include allPhones {
    .nav-item:last-child {
      display: none;
    }
  }

  // In the landscape bar the navigation is one block among three, not the whole
  // width: `space-between` would push the five targets to the far edges of
  // whatever room is left. They hug instead, at the shared touch size.
  @include shortViewport {
    justify-content: flex-end;
    gap: 0;

    .nav-item {
      width: $bar-control;
    }
  }

  // These six glyphs used to come from three different icon sets and filled
  // their viewBox by wildly different amounts (measured ink height: bookmark
  // ~92% of the box, home/folder/search ~60-67%, chart ~79%), which is why each
  // one carried its own `--nav-k * (viewBoxSide / glyphInkHeight)` correction.
  // They are now one set, drawn on one 24x24 grid with the same 18px optical
  // glyph, so there is nothing left to correct: one size for all of them.
  // `--nav-k` survives only to bump the mobile bottom bar a touch.
  --nav-k: 1;

  @include allPhones {
    --nav-k: 1.1; // larger glyphs for the mobile bottom bar
  }

  svg {
    height: 1.5rem;
    width: 1.5rem;
    margin: 0 $small 0 $small;
    border-radius: $small;
    // NOTE: no opacity here on purpose. The old set was filled SF-Symbols mass,
    // and 0.75 took the edge off it; on 2.4px strokes the same rule just made
    // every glyph a mid grey next to its own label, which reads as "weaker" and
    // was exactly the reported complaint. The active row already carries the
    // state (blush fill + ink frame) - the glyph does not have to whisper.
    // Measured: ink #17171A at .75 over white lands around #515154.
    transform: scale(var(--nav-k));
  }

  svg.radiosvg {
    transform: scale(0.7);
  }
}
</style>
