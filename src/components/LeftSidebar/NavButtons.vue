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
        <component :is="menu.icon" :class="menu.iconClass" />
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

  // These nav icons come from different icon sets and their artwork fills its
  // square viewBox by very different amounts (measured glyph ink height:
  // bookmark ~92% of the box, home/folder/search ~60-67%, chart ~79%). A single
  // uniform svg size therefore rendered them at visibly different optical sizes
  // and a bit small overall. We keep a fixed 1.5rem element box — so the desktop
  // sidebar's row rhythm never shifts — and scale each glyph by
  //   --nav-k * (viewBoxSide / glyphInkHeight)
  // so every glyph lands at the same optical height. `--nav-k` is bumped on
  // phones so the bottom-bar icons read a touch larger. The transparent box
  // keeps a constant footprint, so icon spacing stays even regardless of scale.
  // Recompute a factor from svg.getBBox() if an icon is ever swapped.
  --nav-k: 0.633; // desktop: ~previous overall size, just equalised

  @include allPhones {
    --nav-k: 0.78; // larger glyphs for the mobile bottom bar
  }

  svg {
    height: 1.5rem;
    width: 1.5rem;
    margin: 0 $small 0 $small;
    border-radius: $small;
    opacity: 0.75;
    transform: scale(var(--nav-k));
  }

  svg.nav-ico-home {
    transform: scale(calc(var(--nav-k) * 1.489));
  } // 28 / 18.81

  svg.nav-ico-folder {
    transform: scale(calc(var(--nav-k) * 1.684));
  } // 28 / 16.63

  svg.nav-ico-search {
    transform: scale(calc(var(--nav-k) * 1.655));
  } // 28 / 16.92

  svg.nav-ico-bookmark {
    transform: scale(calc(var(--nav-k) * 1.091));
  } // 28 / 25.67

  svg.nav-ico-playlist {
    transform: scale(calc(var(--nav-k) * 1.564));
  } // 64 / 40.92

  svg.nav-ico-chart {
    transform: scale(calc(var(--nav-k) * 1.261));
  } // 28 / 22.20

  svg.radiosvg {
    transform: scale(0.7);
  }
}
</style>
