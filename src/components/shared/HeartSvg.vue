<template>
    <button
        v-wave
        class="heart-button circular"
        :class="{ 'is-fav': state }"
        @click="!no_emit && $emit('handleFav')"
    >
        <!-- A plain div, deliberately: this used to be a <Motion> fading the
             glyph in over `delay 0.25s + duration 0.5s`, so the icon only
             became fully visible 0.75s after mount — and re-ran on every
             mount, i.e. every page change. Once the header buttons gained a
             panel fill and a border, that read as an empty button that fills
             in late. <Motion> renders a div, so keeping a div here preserves
             the `div { ... }` rules below verbatim. -->
        <div>
            <CheckCircleSvg v-if="state" class="check-circle" />
            <PlusSvg v-else />
        </div>
    </button>
</template>

<script setup lang="ts">
import CheckCircleSvg from '@/assets/icons/check.circle.fill.svg'
import PlusSvg from '@/assets/icons/plus.svg'

defineProps<{
    state: Boolean | undefined
    no_emit?: Boolean
}>()

defineEmits<{
    // eslint-disable-next-line no-unused-vars
    (event: 'handleFav'): void
}>()
</script>

<style lang="scss">
.heart-button {
    line-height: normal;
    // Stated here rather than inherited: the global button base used to hand
    // every button its box model, so this component only wrote down the parts
    // it wanted to CHANGE. With the base reduced to a reset, the parts it was
    // silently relying on have to be its own.
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    gap: $smaller;
    border: none;
    // Unfavorited: theme-text outline glyph (the plus) on a transparent
    // button — ink on light chrome, paper on dark.
    color: $candy-text;
    aspect-ratio: 1.5;
    background: transparent;

    div {
        height: max-content;
        transform: scale(1);

        svg {
            height: 1.75rem;
            width: 1.75rem;
            display: block;
        }

        // The two states are drawn to very different scales: the plus fills
        // ~52% of its viewBox, the check-circle fills 100% of its own (a solid
        // r=14 circle in a 28 box). At one CSS size the glyph therefore JUMPED
        // from ~13px to ~25px the moment a track was favourited, and the circle
        // sat flush against the edges of its button with no breathing room.
        //
        // Scaled rather than resized: a percentage height against this
        // `max-content` parent is indeterminate and silently resolves to auto,
        // and a fixed rem would only be right in one of the several contexts
        // this button appears in. A transform stays relative to whatever size
        // the context set. A disc reads slightly larger than an outline glyph
        // of equal height, so it keeps a little more than the plus.
        .check-circle {
            transform: scale(0.75);
        }
    }

    &:hover {
        background: $candy-pink-soft;
        border: none;
    }

    // Favorited state: teal check circle (drives the SVG's currentColor
    // circle; the check itself is fixed white in the asset). Teal is the
    // theme-invariant "active" accent — readable on light and dark chrome
    // and on the yellow playing row.
    // Favourited is the teal check-circle — the app's favourite iconography,
    // never a heart.
    //
    // NOTE for anyone putting this button inside a `btn-action` row:
    // that mixin sets `color` on hover, which outranks this rule, so the call
    // site has to re-assert the teal (see AlbumView/Header/Buttons.vue).
    &.is-fav {
        color: $mem-teal;
    }
}
</style>
