<template>
    <RouterLink :to="getRouterParams()" class="chartitem rounded-sm">
        <ArrowSvg class="trend" :class="trend?.trend" />
        <div class="index">{{ index }}</div>
        <template v-if="isPlaylist">
            <img v-if="playlistImage" :src="playlistImage" class="chartimage playlist" />
            <div v-else class="chartimage playlist placeholder"><PlaylistSvg /></div>
        </template>
        <img v-else :src="getItemImage(item)" class="chartimage" :class="name" />
        <div class="iteminfo">
            <div class="title" :title="asArtist.name" v-if="isArtist || isPlaylist">
                {{ asArtist.name }} <MasterFlag v-if="trend?.is_new" :text="trend?.is_new ? 'New' : ''" :bitrate="1900"/>
            </div>
            <div class="title" :title="asTrack.title" v-if="isAlbumOrTrack">
                {{ asTrack.title }} <MasterFlag v-if="trend?.is_new" :text="trend?.is_new ? 'New' : ''" :bitrate="1900"/>
            </div>
            <div class="artist" v-if="isAlbumOrTrack">
                <ArtistName
                    :artists="asTrack.artists ? asTrack.artists : asTrack.albumartists"
                    :albumartists="asTrack.albumartists"
                />
            </div>
            <div class="artist" v-if="isArtist || isPlaylist">
                {{ asArtist.extra['playcount'] }} track plays
            </div>
        </div>
        <div class="helptext">
            {{ item.help_text }}
        </div>
    </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { paths } from '@/config'
import { Album, Artist, Playlist, Track } from '@/interfaces'
import ArrowSvg from '@/assets/icons/arrow.svg'
import PlaylistSvg from '@/assets/icons/playlist-1.svg'
import ArtistName from '../shared/ArtistName.vue'
import { Routes } from '@/router'
import MasterFlag from '../shared/MasterFlag.vue'

type ChartName = 'artist' | 'album' | 'track' | 'playlist'
type ChartItem = Artist | Album | Track | Playlist

const props = defineProps<{
    item: ChartItem
    index: number
    name: ChartName
}>()

const isArtist = computed(() => props.name === 'artist')
const isAlbumOrTrack = computed(() => props.name === 'album' || props.name === 'track')
const isPlaylist = computed(() => props.name === 'playlist')

// The `name` prop (not a field on `item`) discriminates the union, but the
// template's v-if branches can't narrow `item` from it — cast once here.
const asArtist = computed(() => props.item as Artist)
const asTrack = computed(() => props.item as Track)
// Every chart payload may carry a trend; the Playlist interface just doesn't declare it.
const trend = computed(() => (props.item as Track).trend)

// Playlists may have no own image (image === "None"): fall back to the first
// track cover, like the sidebar does. See CLAUDE.md "Playlist image=None".
const playlistImage = computed(() => {
    const item = props.item as Playlist
    if (item.has_image) return paths.images.playlist + item.image
    if (item.images && item.images.length) return paths.images.thumb.small + item.images[0].image
    return ''
})

function getItemImage(item: ChartItem) {
    switch (props.name) {
        case 'artist':
            return paths.images.artist.medium + item.image
        case 'album':
            return paths.images.thumb.medium + item.image
        case 'track':
            return paths.images.thumb.medium + item.image
    }
}

function getRouterParams() {
    switch (props.name) {
        case 'artist':
            return { name: Routes.artist, params: { hash: (props.item as Artist).artisthash } }
        case 'playlist':
            return { name: Routes.playlist, params: { pid: (props.item as Playlist).id } }
        default:
            return { name: Routes.album, params: { albumhash: (props.item as Album).albumhash } }
    }
}
</script>

<style lang="scss">
.chartitem {
    padding: $small 2rem;
    padding-left: 1.25rem;

    display: grid;
    grid-template-columns: 1rem 1rem max-content 1fr max-content;
    gap: 1.5rem;
    align-items: center;

    margin-bottom: $medium;

    .index {
        font-size: 1.25rem;
        font-weight: 900;
        color: $gray2;
        text-align: right;
    }

    .chartimage.artist {
        border-radius: 50%;
    }

    .chartimage.playlist.placeholder {
        width: 48px;
        display: grid;
        place-items: center;
        background-color: $gray;

        svg {
            width: 1.5rem;
            height: 1.5rem;
        }
    }

    .iteminfo {
        .title {
            font-size: 1rem;
            font-weight: bold;
        }

        .artist {
            font-size: 0.85rem;
            color: $gray1;
            margin-top: 0.2rem;
        }
    }

    .chartimage {
        border-radius: 0.25rem;
        height: 48px;
        width: auto;
    }
    .trend {
        height: 1.25rem;
    }

    .trend.rising {
        transform: rotate(90deg);
        color: rgb(75, 170, 67);
    }

    .trend.falling {
        transform: rotate(-90deg);
        color: $red;
    }

    .is_new {
        color: $orange;
    }

    .helptext {
        font-size: 0.75rem;
        color: $gray2;
        text-align: right;
        text-transform: uppercase;
        font-weight: bold;
    }
}
</style>
