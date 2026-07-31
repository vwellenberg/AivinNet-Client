<template>
    <button
        class="heart-button"
        :class="{ 'is-fav': state, 'role-action': btn_role === 'action' }"
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

withDefaults(
    defineProps<{
        state: Boolean | undefined
        no_emit?: Boolean
        // Which button role this toggle wears (see Global/_buttons.scss).
        // `quiet` is the bare in-context glyph — the player bar, track rows,
        // the Now Playing panel. `action` is the plate-and-frame control the
        // detail headers put in their action row.
        //
        // Named `btn_role` rather than `role` on purpose: `role` is the ARIA
        // attribute, and a prop of that name would shadow it for anyone
        // reading the template.
        btn_role?: 'quiet' | 'action'
    }>(),
    // `no_emit` was implicitly undefined before this component had a
    // `withDefaults` wrapper at all; stated now because the wrapper is what
    // makes a missing default a lint finding, and `undefined` and `false` mean
    // the same thing to the click handler either way.
    { btn_role: 'quiet', no_emit: false }
)

defineEmits<{
    // eslint-disable-next-line no-unused-vars
    (event: 'handleFav'): void
}>()
</script>

<style lang="scss">
// The favourite toggle takes a ROLE, like every other button in the app (#90).
//
// It used to hand-write its own anatomy — `height: 2.25rem` plus
// `aspect-ratio: 1.5` for the box, a global `.circular` utility class for the
// radius — and that cost twice over. The height was silently load-bearing (a
// ratio needs one dimension to resolve, and the button base stopped supplying
// one at #244; this button measured 54x36 -> 28x28 the day it did). And the
// radius came from a utility class sitting at the SAME specificity as this
// rule, so which of the two won was decided by bundle order rather than by
// anyone's intention.
//
// Both dimensions are stated now, through the role: 3.375rem x 2.25rem is the
// same 54x36 box the ratio produced, and 10rem is the pill radius `.circular`
// was handing it. Same pixels, one owner, no ordering luck.
.heart-button {
    @include btn-quiet($size: 2.25rem, $width: 3.375rem, $radius: 10rem, $glyph: 1.75rem);

    div {
        height: max-content;
        transform: scale(1);

        svg {
            // Size comes from the role; this only stops the inline baseline gap
            // from making the wrapper taller than the glyph.
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

    // Favorited state: teal check circle (drives the SVG's currentColor
    // circle; the check itself is fixed white in the asset). Teal is the
    // theme-invariant "active" accent — readable on light and dark chrome
    // and on the yellow playing row. Never a heart; that is the app's
    // favourite iconography.
    &.is-fav {
        color: $mem-teal;
    }
}

// The header variant. Four detail headers stand this toggle in a row of
// plate-and-frame controls, and two of them used to patch it from the OUTSIDE
// with a verbatim copy of the same two rules — `@include btn-action`, then a
// re-assert of the teal to survive the hover colour the mixin brings with it.
// Two copies of one correction is precisely the drift #90 exists to remove, so
// the correction lives with the button that needs it.
.heart-button.role-action {
    @include btn-action;

    // btn-action sets `color` on hover so ITS glyphs stay readable on the blush
    // fill, and that rule outranks a bare `.is-fav` — a favourited album turned
    // ink the moment the pointer touched it. The favourite owns its colour, so
    // re-assert with the compound that wins.
    &.is-fav,
    &.is-fav:hover {
        color: $mem-teal;
    }
}
</style>
