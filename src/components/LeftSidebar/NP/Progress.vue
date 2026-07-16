<template>
    <div
        ref="wrap"
        class="progress-wrap"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
    >
        <input
            id="progress"
            ref="input"
            type="range"
            :value="time.current"
            min="0"
            :max="time.full"
            step="0.1"
            :style="{
                background: progressBg,
            }"
            @change="seek"
            @click="seek"
        />

        <!--
            Spotify-style hover preview (#66): a light fill from 0 to the cursor
            plus a time tooltip showing the seek target. Both layers keep
            pointer-events off so clicks still hit the range input and seek
            exactly as before. Mouse/pen only — touch is ignored (onPointerMove)
            and the layers are also hidden on no-hover pointers (CSS), so mobile
            sees no stray preview.
        -->
        <div
            v-show="hover.active"
            class="progress-preview"
            :style="{
                left: `${hover.barLeft}px`,
                top: `${hover.barTop}px`,
                height: `${hover.barHeight}px`,
                width: `${hover.fillWidth}px`,
            }"
        />
        <div
            v-show="hover.active"
            class="progress-tooltip"
            :style="{ left: `${hover.tooltipLeft}px`, top: `${hover.barTop}px` }"
        >
            {{ hoverLabel }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { maxSeekPercent } from '@/stores/player'
import useQStore from '@/stores/queue'
import { formatSeconds } from '@/utils'
import { CANDY } from '@/utils/colortools/pageGradient'
import { computed, reactive, ref } from 'vue'

const q = useQStore()

const { duration: time } = q

const wrap = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

// Hover-preview geometry, all in pixels relative to the wrapper so it overlays
// the range track exactly regardless of the input's margins (which differ
// between the bottom bar and the Now-Playing header).
const hover = reactive({
    active: false,
    ratio: 0,
    barLeft: 0,
    barTop: 0,
    barHeight: 0,
    fillWidth: 0,
    tooltipLeft: 0,
})

// Pointer X (px) -> clamped 0..1 ratio across the input's own width. Shared by
// the hover preview AND the click-to-seek so the tooltip, the fill and the
// actual seek target are always the same position. (A native range maps a
// click over a track inset by half the thumb, which would otherwise drift a
// few seconds from the tooltip off-centre — #66 wants tooltip == seek time.)
const ratioFromClientX = (clientX: number): number | null => {
    const el = input.value
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width === 0) return null
    const ratio = (clientX - rect.left) / rect.width
    return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio
}

const onPointerMove = (e: PointerEvent) => {
    // Desktop pointers only; never show on touch (#66 acceptance: no stray
    // hover behaviour on mobile). Also skip when there is no track loaded.
    if (e.pointerType === 'touch' || !time.full) {
        hover.active = false
        return
    }

    const el = input.value
    const wrapEl = wrap.value
    const ratio = ratioFromClientX(e.clientX)
    if (!el || !wrapEl || ratio === null) {
        hover.active = false
        return
    }

    const inRect = el.getBoundingClientRect()
    const wrapRect = wrapEl.getBoundingClientRect()

    hover.ratio = ratio
    hover.barLeft = inRect.left - wrapRect.left
    hover.barTop = inRect.top - wrapRect.top
    hover.barHeight = inRect.height
    hover.fillWidth = ratio * inRect.width
    hover.tooltipLeft = hover.barLeft + hover.fillWidth
    hover.active = true
}

const onPointerLeave = () => {
    hover.active = false
}

let prevHash = ''

const seek = (e: Event) => {
    if (prevHash && prevHash !== q.currenttrackhash) {
        prevHash = ''
        return
    }

    // A genuine mouse click seeks to the exact cursor position so the landing
    // spot matches the tooltip and the preview fill (full-width mapping).
    // Keyboard (arrow/Home/End) and drag fire `change` and fall back to the
    // native input value, keeping the range fully accessible. `detail > 0`
    // tells a real click apart from a keyboard-synthesised one.
    let value: number
    if (e.type === 'click' && (e as MouseEvent).detail > 0) {
        const ratio = ratioFromClientX((e as MouseEvent).clientX)
        if (ratio === null) return
        value = ratio * (time.full || 0)
    } else {
        value = Number((e.target as HTMLInputElement).value)
    }

    prevHash = q.currenttrackhash
    q.seek(value)
}

const currentPercent = computed(() => (time.current / (time.full || 1)) * 100)

// Seek bar background, layered so the played portion reads as diagonal candy
// stripes over a soft-pink track:
//   1. played [0..current%]  — candy stripes (pink-deep / white, -45deg, 10px)
//   2. buffered [0..max%]     — flat $candy-pink, sits UNDER the stripes so it
//                               only shows between the playhead and buffer edge
//   3. track (base)           — flat $candy-pink-soft fills the remainder
// The 2px black border, pill radius and white bordered thumb come from the
// global range styling (ProgressBar.scss); this only paints the fill.
const progressBg = computed(() => {
    const played = `repeating-linear-gradient(-45deg, ${CANDY.pinkDeep} 0 10px, ${CANDY.white} 10px 20px) left center / ${currentPercent.value}% 100% no-repeat`
    const buffered = `linear-gradient(${CANDY.pink}, ${CANDY.pink}) left center / ${maxSeekPercent.value}% 100% no-repeat`
    return `${played}, ${buffered}, ${CANDY.pinkSoft}`
})

// Seek target under the cursor, formatted like every other time in the app.
const hoverLabel = computed(() => formatSeconds(hover.ratio * (time.full || 0)))
</script>

<style lang="scss">
// Unscoped to match the codebase convention; everything is nested under
// .progress-wrap so the helper classes stay local to this component.
.progress-wrap {
    position: relative;
    display: block;
    width: 100%;
    // Collapse the inline-block baseline gap under the range input so wrapping
    // it does not nudge the bar down a couple of pixels.
    line-height: 0;

    // Light preview fill from 0 to the cursor, layered over the played
    // green/grey gradient (which stays visible). Never intercepts pointer
    // events, so clicks still reach the range input and seek as before.
    .progress-preview {
        position: absolute;
        pointer-events: none;
        border-radius: $candy-radius-pill; // match the range track radius (ProgressBar.scss)
        background: rgba($candy-pink-deep, 0.55);
        z-index: 2;
    }

    // Floating time pill centred on the cursor, sitting just above the bar.
    .progress-tooltip {
        position: absolute;
        pointer-events: none;
        transform: translate(-50%, calc(-100% - 0.4rem));
        padding: 2px 6px;
        border-radius: $candy-radius-sm;
        background: $candy-white;
        border: 1px solid $candy-black;
        color: $candy-text;
        font-size: $medium;
        line-height: 1.2;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        z-index: 3;
    }

    // Hover effects are desktop-only. onPointerMove already ignores touch; this
    // is the CSS belt-and-braces for no-hover pointers (#66 acceptance).
    @media (hover: none) {
        .progress-preview,
        .progress-tooltip {
            display: none !important;
        }
    }
}
</style>
