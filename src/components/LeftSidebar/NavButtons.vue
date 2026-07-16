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
      class="circular nav-item"
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
    padding: $small 0;
    font-size: 14px;
    font-weight: 500;
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
      border-color: $candy-black;
    }

    &:hover {
      background-color: $candy-pink-soft;
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
    .circular.nav-item:last-child {
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
