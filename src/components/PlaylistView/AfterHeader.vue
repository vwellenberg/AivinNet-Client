<template>
    <div class="p-after-header" :class="{ 'with-date': showDateHeading, 'caps-list': caps_list }">
        <div class="ah-label">All Tracks</div>
        <div v-if="showDateHeading" class="date-added-heading">Date added</div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { isMedium, isSmall } from '@/stores/content-width'

const props = defineProps<{
    // Whether the track list below shows the "Date added" column (regular
    // playlists on wide layouts only), so the caption lines up with it.
    show_date_added?: boolean
    // Whether a track list actually follows. When it does, this row becomes the
    // ink cap on top of the list frame (see the style block); with no tracks
    // under it that cap would be a lid on an empty box, so it stays a plain
    // caption.
    caps_list?: boolean
}>()

const showDateHeading = computed(() => Boolean(props.show_date_added) && !isSmall.value && !isMedium.value)
</script>

<style lang="scss">
.isSmall .p-after-header {
    padding-left: 0.5rem;
}

.p-after-header {
    display: flex;
    align-items: center;
    height: 64px;
    padding: 0 1rem;
    margin-top: $small;

    font-size: 14px;
    font-weight: 700;

    // Both captions are stickers: this row sits on the memphis ground between
    // the header plate and the track list, and muted grey on the doodle tile is
    // the pairing the plates exist to avoid.
    .ah-label,
    .date-added-heading {
        @include mem-sticker(999px, 0.25rem 0.8rem);
        color: $candy-text-muted;
    }

    // Column-caption mode: same grid as .songlist-item.with-date (shared
    // variable) so the "Date added" caption sits exactly above its column.
    // The last (10rem) cell stays empty — it belongs to the duration column.
    &.with-date {
        display: grid;
        grid-template-columns: $songlist-columns-with-date;
        gap: 1rem;
        padding: 0 0 0 $small;

        .ah-label {
            grid-column: 1 / 4;
        }

        .date-added-heading {
            font-size: small;
            white-space: nowrap;
        }
    }

    @media only screen and (max-width: 724px) {
        padding-left: 0.5rem;
    }

    /* Somehow has to be replaced by above now
  @include largePhones {
    padding-left: 0.5rem;
  }
  */

    // ---------------------------------------------------------------------
    // THE INK CAP
    //
    // These captions used to stand bare on the doodled ground, where the grid
    // lines run straight through the words — the one real legibility fault of
    // the old list. Filled, they sit on a surface instead, and the bar doubles
    // as the top of the list's frame: it rounds the two upper corners and
    // closes the ink box the rows continue with their side stripes.
    //
    // This block comes LAST in the selector on purpose. It overrides padding
    // and height set above — including inside `.with-date` and the narrow
    // viewport media query — and at equal specificity source order decides.
    // Same ordering trap the playlist header hit with its `shortViewport`
    // block (.claude/rules/styling.md).
    //
    // ⚠️ The first row must NOT cap itself as well, or its rounded corner tucks
    // in under this bar. PlaylistView drops `is_first` while this cap renders.
    &.caps-list {
        height: 2.4rem;
        margin-top: $medium;
        background-color: $mem-line;
        // Reads on the bar in both themes: ink bar on light, paper bar on dark
        // (`$mem-line` flips), and the ground flips with it.
        color: $mem-ground;
        border: $candy-border-w solid $mem-line;
        border-bottom: none;
        border-top-left-radius: $candy-radius-sm;
        border-top-right-radius: $candy-radius-sm;
        padding-left: $songlist-lead;
        padding-right: $small;

        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;

        &.with-date {
            padding-left: $songlist-lead;
        }

        // The narrow-viewport inset above would otherwise pull the caption off
        // the lead the rows keep clear for the guide band.
        @media only screen and (max-width: 724px) {
            padding-left: $songlist-lead;
        }

        // ⚠️ The captions are `mem-sticker`s above — plates that carry their own
        // panel fill, ink frame and offset shadow, because they used to sit bare
        // on the doodled ground. THIS bar is that surface now, so the stickers
        // hand their plate back: two nested plates would put a white pill on an
        // ink bar and shadow it against its own frame. The sticker stays where
        // it belongs (the caption on the ground); here the bar is the plate.
        .ah-label,
        .date-added-heading {
            padding: 0;
            background-color: transparent;
            border: none;
            box-shadow: none;
            color: inherit;
            font-size: inherit;
        }
    }
}

.isSmall .p-after-header.caps-list {
    padding-left: $songlist-lead;
}
</style>
