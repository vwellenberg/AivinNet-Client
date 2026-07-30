<template>
    <div class="itemsortby">
        <div class="tt select circular">Sort By</div>
        <div class="left group">
            <SortKey
                :items="($route.name == Routes.AlbumList ? albumitems : artistitems).concat(items)"
                :sortby="store.sortby"
                :reverse="store.reverse"
            />
        </div>
        <div class="right group">
            <div class="tt select circular"><ChartSvg /></div>
            <SortKey :items="statitems" :sortby="store.sortby" :reverse="store.reverse" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Routes } from '@/router'
import { useRoute } from 'vue-router'

import { useAlbumList, useArtistList } from '@/stores/pages/itemlist'
import SortKey from './SortKey.vue'
import ChartSvg from '@/assets/icons/chart.svg'

const route = useRoute()
const store = route.name === Routes.AlbumList ? useAlbumList() : useArtistList()

const items = [
    { key: 'trackcount', displayName: 'No. of tracks' },
    { key: 'duration', displayName: 'Duration' },
    { key: 'created_date', displayName: 'Date added' },
    { key: 'lastplayed', displayName: 'Last played' },
]

const statitems = [
    { key: 'playcount', displayName: 'Plays' },
    { key: 'playduration', displayName: 'Play duration' },
]

const albumitems = [
    { key: 'title', displayName: 'Title' },
    { key: 'albumartists', displayName: 'Artist' },
    { key: 'date', displayName: 'Year released' },
]

const artistitems = [
    { key: 'name', displayName: 'Name' },
    { key: 'albumcount', displayName: 'No. of albums' },
]
</script>

<style lang="scss">
.itemsortby {
    z-index: 200;
    display: grid;
    grid-template-columns: max-content 1fr max-content;
    gap: 1rem;

    @include allPhones {
        grid-template-columns: 1fr;

        .tt {
            display: none !important;
        }
    }

    .group {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 1rem;
    }

    padding: 1rem $medium 2rem $medium;
    position: relative;
    font-size: 14px;
    font-weight: 500;
    text-transform: capitalize;
    user-select: none;

    // A sort chip is a toggle, so it takes the action role: panel plate, ink
    // border, hard offset. It used to carry `border: solid 1px $gray5` and NO
    // background at all — a leftover from before the memphis redesign — so the
    // labels sat directly on the doodle ground and were barely readable.
    // ($gray4/$gray5 are aliases onto blush; they predate the token system.)
    .select {
        @include btn-action($size: 2.75rem, $width: auto);
        font-size: inherit;
        font-weight: inherit;
    }

    .select.circular {
        user-select: none;
        pointer-events: none;
    }

    .reverse svg.direction {
        transform: rotate(90deg);
    }


    // The two non-interactive label chips ("Sort By", the chart glyph). They
    // are not toggles, so they never take the ON state — but they DO sit in the
    // same row, so they must share its height and border weight. They used to
    // set `height: max-content` and a 1px border, which rendered them 18.8px
    // tall with a thinner outline beside 44px/2px siblings.
    .tt {
        color: $candy-text;
        gap: $small;

        svg {
            height: 1rem;
        }
    }

    svg.direction {
        transform: rotate(-90deg);
        margin: -2px 0;
        margin-right: -6px;
        margin-left: 2px;
        transition: transform 0.1s linear;
    }

    // ON state. Yellow is this design system's "active" signal (the playing
    // row, shuffle on, repeat on); blush means "the pointer is here". Using
    // blush for both is exactly what made a pinned button look permanently
    // hovered, so the sort chip keeps the two apart.
    .select.active,
    .select.active:hover {
        background-color: $mem-yellow;
        border-color: $mem-line;
        color: $mem-ink;
    }

    button {
        padding-left: $medium;
    }
}
</style>
