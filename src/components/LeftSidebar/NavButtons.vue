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
  gap: $smaller;
  overflow: hidden;

  .nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    // The frame is reserved as a transparent border on every row, so the
    // padding subtracts it and the row height stops depending on how thick
    // the ink frame is. Measured: without this the nav rows grew 44 -> 46px
    // when $candy-border-w went to 3px, while the library rows right below —
    // which already compensate — stayed exactly where they were.
    padding: calc(0.625rem - #{$candy-border-w}) 0;
    font-size: $sidebar-row-font;
    font-weight: 500;
    // The pill came from the generic `.circular` utility in the markup, which
    // made these rows the roundest thing in the app while the library rows
    // right below them were nearly square. Both read the same token now.
    border-radius: $sidebar-row-radius;
    // Transparent border on every item so the active state can colour it in
    // without shifting the row (border-box keeps the footprint constant).
    border: $candy-border-w solid transparent;
    transition: background-color 0.2s ease-out, border-color 0.2s ease-out;

    & > div {
      display: flex;
      align-items: center;
    }

    // Active item = candy pink pill with the 2px black border (replaces the
    // old grey fill + green accent bar).
    &.active {
      background-color: $candy-pink;
      border-color: $mem-line;
      // Blush accent pill -> label/icon pin static ink (readable in dark).
      color: $mem-ink;
    }

    // :not(.active): the soft hover fill is dark in dark mode and would
    // override the blush pill (same specificity, later rule) while the
    // pinned ink label stays — dark-on-dark. Active items keep their pill.
    //
    // Uses the shared row-hover mixin rather than setting the fill by hand.
    // Hand-setting only `background-color` is exactly why these rows hovered
    // without the ink frame while every other hoverable list in the app drew
    // one — the transparent border is reserved above, hovering just never
    // coloured it. Same bug, same fix as the playlist rows in index.vue.
    &:hover:not(.active) {
      @include candy-row-hover($candy-pink-soft, $sidebar-row-radius);
    }
  }

  .nav-item.separator {
    height: 1px;
    padding: 0;
    border: none;
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
