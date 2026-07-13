<template>
    <div class="chartitem chartitemhashuno rounded">
        <div class="hashuno shadow-sm">
            1
        </div>
        <img :src="getItemImage(item)" class="rounded-sm" :class="name" />
        <div class="iteminfo">
            <div>
                <div class="helptext">
                    {{ item.help_text }}
                </div>
                <div class="artist" v-if="name !== 'artist'">
                    <ArtistName
                    :artists="asTrack.artists ? asTrack.artists : asTrack.albumartists"
                    :albumartists="asTrack.albumartists"
                    />
                </div>
                <div class="title ellip">{{ name === 'artist' ? asArtist.name : asTrack.title }}</div>
            </div>
            <!-- <div class="index">
                <ArrowSvg class="trend" :class="item.trend" /> 1
            </div> -->
        </div>
        <PlayBtn :source="null" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { paths } from '@/config'
import { Artist, Album, Track } from '@/interfaces'

import ArtistName from '../shared/ArtistName.vue'
import PlayBtn from '../shared/PlayBtn.vue'

type ChartName = 'artist' | 'album' | 'track'
type ChartItem = Artist | Album | Track

const props = defineProps<{
    item: ChartItem
    index: number
    name: ChartName
}>()

// The `name` prop (not a field on `item`) discriminates the union, but the
// template's branches can't narrow `item` from it — cast once here.
const asArtist = computed(() => props.item as Artist)
const asTrack = computed(() => props.item as Track)

function getItemImage(item: ChartItem, size: 'small' | 'large' | 'medium' = 'large') {
    switch (props.name) {
        case 'artist':
            return paths.images.artist[size] + item.image
        case 'album':
            return paths.images.thumb[size] + item.image
        case 'track':
            return paths.images.thumb[size] + item.image
    }
}
</script>

<style lang="scss">
.chartitemhashuno {
    @include candy-box($candy-lavender, $candy-radius);
    color: $candy-text;
    display: grid;
    grid-template-columns: max-content 1fr max-content !important;
    align-items: flex-end !important;
    margin: 1rem;
    margin-top: 0;
    // padding: 1rem !important;
    position: relative;

    .hashuno {
        background-color: $candy-white;
        color: $candy-black;
        border: $candy-border;

        position: absolute;
        bottom: -1rem;
        left: 2rem;

        width: 2rem;
        height: 2rem;
        border-radius: 50%;

        display: flex;
        align-items: center;
        justify-content: center;

        font-size: 1.2rem;
        font-weight: bold;
    }

    .iteminfo {
        width: max-content;
        display: grid;
        grid-template-columns: max-content 1fr;
        align-items: flex-end;
        // gap: 1rem;

        .index {
            font-size: 5rem;
            font-weight: 900;
            color: $candy-text;
        }

        .trend {
            color: $candy-text-muted;
            height: 1.5rem;
        }

        .helptext {
            text-align: left
        }

        .title {
            font-size: 2rem !important;
        }
    }

    img {
        height: 8rem;
        width: 8rem;
        object-fit: cover;
    }

    img.artist {
        height: 10rem;
        width: 15rem;
        object-fit: cover;
        margin-left: -1rem;
        margin-top: -1rem;
    }
}
</style>
