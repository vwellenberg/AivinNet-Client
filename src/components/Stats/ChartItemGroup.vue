<template>
    <div class="chartgroup rounded" :class="settings.statsgroup">
        <ChartsHeader :name="settings.statsgroup" @change-period="changePeriod" @change-group="changeGroup" :period="settings.statsperiod" />
        <br />
        <div class="noitems rounded-sm" v-if="items.length === 0">
            <div v-if="loading" class="loading">
                <div class="spinner"></div>
                <span>fetching data...</span>
            </div>
            <div v-if="!loading && loaded">No {{ settings.statsgroup.slice(0, -1) }} data found for this period</div>
        </div>
        <ChartItem
            v-for="(item, index) in items"
            :key="index"
            :item="item"
            :rank="pageStart + index + 1"
            :name="(settings.statsgroup.slice(0, -1) as any)"
            :meter_pct="meterPercent(chartItemDuration(item), maxPlayduration)"
        />
        <div class="chartpager" v-if="showPager">
            <div class="pagesizes">
                <button
                    v-for="size in CHART_PAGE_SIZES"
                    :key="size"
                    class="pagesize"
                    :class="{ active: pageSize === size }"
                    :aria-label="`Show ${size} per page`"
                    @click="setPageSize(size)"
                >
                    {{ size }}
                </button>
            </div>
            <div class="pagenav">
                <button class="pagebtn" :disabled="page === 0" aria-label="Previous page" @click="goToPage(page - 1)">
                    <ArrowSvg />
                </button>
                <div class="pageinfo">{{ page + 1 }} / {{ pages }}</div>
                <button
                    class="pagebtn next"
                    :disabled="page >= pages - 1"
                    aria-label="Next page"
                    @click="goToPage(page + 1)"
                >
                    <ArrowSvg />
                </button>
            </div>
        </div>
        <div class="scrobbleinfo rounded-sm">
            <div class="date">
                <CalendarSvg />
                {{ scrobbleInfo?.dates }}
            </div>
            <div class="scrobbleinfo-trend">
                <ArrowSvg class="trend" :class="scrobbleInfo?.trend" />
                <div class="text">
                    {{ scrobbleInfo?.text }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { getChartItem } from '@/requests/stats'
import { Artist, Album, Track, Playlist } from '@/interfaces'
import useSettings from '@/stores/settings'
import { CHART_PAGE_SIZES, clampPage, pageCount } from '@/utils/chartPager'
import { chartItemDuration, meterPercent } from '@/utils/chartMeter'

import ChartItem from './ChartItem.vue'
import ChartsHeader from './ChartsHeader.vue'
import ArrowSvg from '@/assets/icons/arrow.svg'
import CalendarSvg from '@/assets/icons/calendar.svg'

const settings = useSettings()

// Reactive variables
const loading = ref(true)
const loaded = ref(false)

const items2: any = reactive({
    tracks: <Track[]>[],
    albums: <Album[]>[],
    artists: <Artist[]>[],
    playlists: <Playlist[]>[],
})

const items = computed(() => {
    return items2[settings.statsgroup]
})

const scrobbleInfo = ref<{
    text: string
    trend: string
    dates: string
} | null>(null)

// Pagination: 0-based page, rendered 1-based. The backend windows its sorted
// list via offset/limit and reports the pre-slice `total`.
const page = ref(0)
const pageSize = ref<number>(CHART_PAGE_SIZES[0])
const total = ref(0)
// The period's #1 play duration — reference for the leaderboard meters.
// 0 = backend doesn't send it (older build) -> meters hide.
const maxPlayduration = ref(0)

const pages = computed(() => pageCount(total.value, pageSize.value))
const pageStart = computed(() => page.value * pageSize.value)
// Rendered whenever there is more than one default page of data — also while
// a page loads, so the buttons don't vanish underneath the pointer.
const showPager = computed(() => total.value > CHART_PAGE_SIZES[0])

// Fast page flips can overtake each other; only the newest request may write
// the UI, or a stale response repaints the pager with the previous page's data.
let fetchSeq = 0

// Functions
async function getItems() {
    const seq = ++fetchSeq
    items2[settings.statsgroup] = []
    loaded.value = false
    let isPending = true

    // Set a timeout to show the loader after 250ms
    setTimeout(() => {
        if (isPending && seq === fetchSeq) {
            loading.value = true
        }
    }, 450)

    try {
        const res = await getChartItem(
            settings.statsgroup,
            settings.statsperiod,
            pageSize.value,
            'playduration',
            pageStart.value
        )

        if (seq !== fetchSeq) {
            return
        }

        items2[settings.statsgroup] = res.data[settings.statsgroup]
        total.value = res.data.total ?? res.data[settings.statsgroup].length
        maxPlayduration.value = res.data.max_playduration ?? 0
        scrobbleInfo.value = res.data.scrobbles

        // The data can shrink underneath a high page (period/group switched
        // elsewhere, scrobbles pruned): land on the last page that exists.
        const clamped = clampPage(page.value, total.value, pageSize.value)
        if (clamped !== page.value) {
            page.value = clamped
            return getItems()
        }
    } finally {
        isPending = false
        // A superseded request must not touch the loader the newer one owns.
        if (seq === fetchSeq) {
            loading.value = false
            loaded.value = true
        }
    }
}

async function changePeriod(newPeriod: string) {
    settings.setStatsPeriod(newPeriod)
    page.value = 0
    total.value = 0
    maxPlayduration.value = 0
    await getItems()
}

async function changeGroup(newGroup: string) {
    settings.setStatsGroup(newGroup)
    page.value = 0
    total.value = 0
    maxPlayduration.value = 0
    await getItems()
}

async function goToPage(newPage: number) {
    page.value = clampPage(newPage, total.value, pageSize.value)
    await getItems()
}

async function setPageSize(size: number) {
    if (size === pageSize.value) {
        return
    }

    pageSize.value = size
    page.value = 0
    await getItems()
}

onMounted(async () => {
    await getItems()
})
</script>

<style lang="scss">
.chartgroup {
    .loading {
        display: flex;
        gap: $small;
    }

    .noitems {
        height: 3.25rem;
        padding: 1rem;
        background-color: $candy-pink-soft;
        // Horizontally flush with the rows this plate stands in for (they span
        // the group edge to edge, measured 303/1393). The vertical margin is
        // the air between the sections and stays.
        margin: 1rem 0;
        margin-bottom: 2rem;
        color: $candy-black;
    }

    .chartpager {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: $small;
        // `space-between` puts the page-size chips on the left edge and the
        // pager on the right one, so a horizontal margin misses BOTH: measured
        // 319/1377 against the rows' 303/1393 directly above it.
        margin: $medium 0;

        .pagesizes,
        .pagenav {
            display: flex;
            align-items: center;
            gap: $small;
        }

        // A page-size chip is a toggle, so it takes the action role — same
        // anatomy as the sort banner's chips.
        .pagesize {
            // The chip IS its number -> no hatch (#476, styling.md).
            @include btn-action($size: 2.75rem, $width: auto, $hatch: false);
        }

        // ON state. Yellow is this design system's "active" signal; blush
        // would collide with the pointer signal (see SortBanner).
        .pagesize.active,
        .pagesize.active:hover {
            background-color: $mem-yellow;
            border-color: $mem-line;
            color: $mem-ink;
        }

        .pagebtn {
            @include btn-action;
        }

        // arrow.svg is the back arrow; forward is the same glyph mirrored.
        .pagebtn.next svg {
            transform: rotate(180deg);
        }

        // A label, not a control: the same veiled plate the chart rows use,
        // so the text never sits on the doodle ground — and no hatch, which
        // would promise a press. It DOES take the offset, though (#468): it
        // sits between two `btn-action` buttons that both cast one, and a flat
        // rectangle between two raised ones reads as a hole.
        .pageinfo {
            height: 2.75rem;
            display: flex;
            align-items: center;
            padding: 0 $medium;
            background-color: var(--mem-veil);
            border: $candy-border;
            border-radius: $candy-radius-sm;
            box-shadow: 3px 3px 0 var(--mem-shadow);
            font-size: 0.9rem;
            font-weight: 700;
            color: $mem-content-text;
            white-space: nowrap;
        }
    }

    .scrobbleinfo {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: $small;

        text-transform: uppercase;
        font-size: 0.75rem;
        font-weight: 900;

        // The two stickers below sit on the group's own edges — the left one
        // where every chart row starts, the right one where they end. A
        // horizontal margin moved both inwards: measured 322.2/1373.8 against
        // the rows' 303/1393. Same leftover the genre banner and the stat
        // tiles carried (#550), the last of the family.
        margin: $medium 0;

        // Each half is its own STICKER (#468). This caption and the one under
        // the stat tiles were the last text in the app still standing free on
        // the doodled ground — "68 playlists played" landed on a zigzag and
        // stopped being readable. #404 gave every other caption its plate and
        // missed these two.
        //
        // Per GROUP, not one bar across the page: `mem-sticker` is
        // `width: fit-content` on purpose (a caption is a label), and the row
        // keeps its `space-between`. No hatch — a caption promises nothing.
        .date,
        .scrobbleinfo-trend {
            @include mem-sticker($pad: 0.35rem 0.75rem);
            // The mixin's `inline-block` would stack the glyph over the text.
            display: inline-flex;
            align-items: center;
            gap: $small;

            svg {
                width: 1.25rem;
            }
        }

        .trend {
            width: 1.25rem;
        }

        .trend.rising {
            transform: rotate(90deg);
            color: $mem-content-text;
        }

        .trend.falling {
            transform: rotate(-90deg);
            color: $mem-content-text;
        }
    }
}
</style>
