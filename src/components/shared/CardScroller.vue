<template>
    <div class="cardscroller">
        <div class="rinfo">
            <div class="rtitle">
                <b>
                    <RouterLink :to="route || ''">
                        {{ title }}
                    </RouterLink>
                </b>
                <!-- INFO: This SEE ALL is shown when there's no description. Eg. in favorites page -->
                <SeeAll
                    v-if="!description && route && itemlist.length >= maxAbumCards"
                    :route="route"
                    :text="seeAllText"
                />
            </div>
            <div v-if="description" class="rdesc">
                <RouterLink :to="route || ''">
                    {{ description }}
                </RouterLink>
                <!-- INFO: This SEE ALL is shown when there's a description. Eg. in the home page -->
                <SeeAll v-if="route && itemlist.length >= maxAbumCards" :route="route" :text="seeAllText" />
            </div>
        </div>
        <div class="recentitems">
            <component
                :is="getComponent(i.type)"
                v-for="(i, index) in itemlist.slice(0, maxAbumCards)"
                :key="i"
                class="hlistitem"
                v-bind="getProps(i)"
                @playThis="() => $emit('playThis', index)"
            ></component>
        </div>
    </div>
</template>

<script setup lang="ts">
import { playSources } from '@/enums'
import { maxAbumCards } from '@/stores/content-width'

import { computed } from 'vue'
import PlaylistCard from '../PlaylistsList/PlaylistCard.vue'
import SeeAll from '../shared/SeeAll.vue'
import AlbumCard from './AlbumCard.vue'
import ArtistCard from './ArtistCard.vue'
import CardContent from './CardContent.vue'
import FolderCard from './FolderCard.vue'
import TrackCard from './TrackCard.vue'

const props = defineProps<{
    title: string
    description?: string
    items: {
        type: string
        item?: any
        with_helptext?: boolean
    }[]
    playSource?: playSources
    child_props?: any
    route?: string
    seeAllText?: string
}>()

defineEmits<{
    playThis: [index: number]
}>()

const itemlist = computed(() => {
    if (!props.items.length) {
        const items = Array.from(Array(maxAbumCards.value)).fill({
            type: 'placeholder',
            with_helptext: true,
        })

        return items
    }

    return props.items
})

function getComponent(type: string) {
    if (type == 'placeholder') {
        return CardContent
    }

    switch (type) {
        case 'album':
            return AlbumCard
        case 'track':
            return TrackCard
        case 'artist':
            return ArtistCard
        case 'folder':
            return FolderCard
        case 'playlist':
            return PlaylistCard
    }
}

function getProps(item: { type: string; item?: any; with_helptext?: boolean }) {
    if (item.type == 'placeholder') {
        return {
            with_helptext: item.with_helptext,
        }
    }

    switch (item.type) {
        case 'album':
            return {
                album: item.item,
                ...props.child_props,
            }
        case 'track':
            return {
                track: item.item,
                playSource: props.playSource,
            }
        case 'artist':
            return {
                artist: item.item,
            }
        case 'folder':
            return {
                folder: item.item,
            }
        case 'playlist':
            return {
                playlist: item.item,
            }
    }
}
</script>

<style lang="scss">
.cardscroller {
    padding: 1.5rem 0;

    .recentitems {
        gap: 1.5rem 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax($cardwidth, 1fr));

        @include mediumPhones {
            grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
        }
    }

    // Playlist cards keep their white candy-box here — the old dark design
    // flattened them to transparent inside scroller rows, which let the page
    // ground (indigo in dark) bleed through the card.

    .rinfo {
        padding: 0 $medium;
        margin-bottom: $medium;

        .rtitle {
            font-size: 1.15rem;
            font-weight: 700;
            // Section heading rows sit on the page ground -> theme-aware.
            color: $mem-content-text;
            display: flex;
            align-items: baseline;
            justify-content: space-between;

            a {
                color: $mem-content-text;
            }
        }

        .rdesc {
            font-size: 0.9rem;
            color: $mem-content-muted;
            display: flex;
            align-items: baseline;
            justify-content: space-between;
        }
    }

    .to_playlist {
        // Static-white highlight card with ink text — keep light in both themes.
        background-color: $mem-panel-static;
        color: $candy-black;
        border: $candy-border;
        padding: 1.25rem 2rem;
        margin: 1rem;
    }

    .hlistitem {
        // TODO: Handle when there's no time
        // INFO: Set the time to display none by default

        .rhelp .time {
            display: none;
        }

        &:hover {
            // INFO: Set the help text to display none on hover
            .rhelp .help {
                display: none;
            }

            .keep {
                display: block !important;
            }

            // INFO: Set the time to display block on hover
            .rhelp .time {
                display: block;
            }
        }
    }
}
</style>
