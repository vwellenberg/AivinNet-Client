<template>
    <div
        class="chartitem chartitemhashuno rounded"
        :style="{
            backgroundColor: name === 'artist' ? '' : color,
        }"
    >
        <div
            v-if="name === 'artist'"
            class="gradient"
            :style="`background-image: linear-gradient(to right, transparent 0, ${asArtist.color} 12rem, ${asArtist.color} 100%)`"
        ></div>
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
import Vibrant from 'node-vibrant'
import { computed, onMounted, ref } from 'vue'

import { paths } from '@/config'
import { Artist, Album, Track } from '@/interfaces'
import listToRgbString from '@/utils/colortools/listToRgbString'

import ArrowSvg from '@/assets/icons/arrow.svg'
import ArtistName from '../shared/ArtistName.vue'
import PlayBtn from '../shared/PlayBtn.vue'

type ChartName = 'artist' | 'album' | 'track'
type ChartItem = Artist | Album | Track

const props = defineProps<{
    item: ChartItem
    index: number
    name: ChartName
}>()

const color = ref<string>()

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

onMounted(() => {
    if (props.name === 'artist') return
    const imageurl = getItemImage(props.item)
    const vibrant = new Vibrant(imageurl)

    vibrant.getPalette().then(palette => {
        color.value = listToRgbString(palette.DarkMuted?.getRgb())
    })
})
</script>

<style lang="scss">
.chartitemhashuno {
    display: grid;
    grid-template-columns: max-content 1fr max-content !important;
    align-items: flex-end !important;
    margin: 1rem;
    margin-top: 0;
    // padding: 1rem !important;
    position: relative;

    .hashuno {
        background-color: #fff;
        color: #000;

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
            color: #fff;
        }

        .trend {
            color: $gray1;
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

    .gradient {
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }
}
</style>
