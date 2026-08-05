import { useWindowSize } from '@vueuse/core'
import { computed, ref } from 'vue'

import { CARD_MIN, CARD_MIN_PHONE, MEDIUM_PHONE_MAX } from '@/utils/cardColumns'

const content_width = ref(0)
const content_height = ref(0)

// SECTION: HEIGHT
const heightLarge = computed(() => content_height.value > 1080)

// One track height is 64px. We want to load 2.75 times
// the amount of tracks that can fit in the content height
// Comes in handy on paginated pages, because the component
// which is at the bottom of the page will reliably be remounted
// causing more tracks to be loaded again
// 2.75x is ~50 tracks on a 2560x1440 screen.
const track_limit = computed(() => Math.round((content_height.value / 64) * 2.75))

const resizer_width = ref(0)

const brk = {
    small: 660,
    album_header_small: 700,
    medium: 950,
}

const isSmall = computed(() => {
    return content_width.value <= brk.small
})

const isHeaderSmall = computed(() => {
    return content_width.value <= brk.album_header_small
})

const isMedium = computed(() => {
    return content_width.value > brk.small && content_width.value <= brk.medium
})

/**
 * How many cards to FETCH for a one-row scroller, and the group size of the
 * album/artist list rows. This is a heuristic, not the rendered count — the
 * `CardScroller` measures its own grid and renders exactly as many cards as
 * fit one row (utils/cardColumns.ts). This estimate deliberately divides by
 * the bare card minimum (no gap), so it lands at or slightly above the
 * gapped one-row column count: over-fetching trims to a full row,
 * under-fetching would leave a hole.
 *
 * The old version divided by a MEASURED card width (Math.round, stretched
 * 1fr cards, updated per page): it depended on which page measured last and
 * overshot the real column count on half-width screens — the surplus card
 * wrapped "Recently played" into a second row.
 */
const maxAbumCards = computed(() => {
    if (resizer_width.value == 0) return 7

    const min = win_width.value <= MEDIUM_PHONE_MAX ? CARD_MIN_PHONE : CARD_MIN

    return Math.max(2, Math.floor(resizer_width.value / min))
})

// WINDOW SIZES
const ALL_MOBILE_WIDTH = 900
const LARGE_MOBILE_WIDTH = 660
const SMALL_MOBILE_WIDTH = 460

// A landscape phone. Every other breakpoint in this file is a function of WIDTH
// alone, and a phone held sideways is WIDE and SHORT — so the width said "large
// phone, give it the richer bar" while nothing at all watched the height. The
// chrome (title bar + player bar) is a fixed 249px: 30% of a 390x844 portrait
// screen, but 64% of the same device turned over, measured 133px of usable
// content out of 390.
//
// `orientation: landscape` as well as the height, deliberately: a tablet held
// UPRIGHT also falls in the 660-900px width band, and nothing about it is short.
// It must keep the layout it has.
const SHORT_HEIGHT = 500

const { width: win_width, height: win_height } = useWindowSize()

export const isSmallPhone = computed(() => win_width.value <= LARGE_MOBILE_WIDTH)
export const isMobile = computed(() => win_width.value <= ALL_MOBILE_WIDTH)
export const isLargerMobile = computed(
    () => win_width.value >= LARGE_MOBILE_WIDTH && win_width.value <= ALL_MOBILE_WIDTH
)

export const isSmallestPhone = computed(() => win_width.value <= SMALL_MOBILE_WIDTH)

/** Keep in step with the `shortViewport` mixin in `assets/scss/_mixins.scss`. */
export const isShort = computed(() => win_height.value <= SHORT_HEIGHT && win_width.value > win_height.value)

export {
    content_height,
    content_width,
    heightLarge,
    isHeaderSmall,
    isMedium,
    isSmall,
    maxAbumCards,
    resizer_width,
    win_width,
    track_limit,
}
