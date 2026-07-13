<template>
    <RouterLink :to="getRouterParams()" class="chartitem rounded-sm">
        <ArrowSvg class="trend" :class="trend?.trend" />
        <div class="index">{{ index }}</div>
        <template v-if="isPlaylist">
            <img v-if="asPlaylist.has_image" :src="playlistImageUrl" class="chartimage playlist" />
            <PlaylistImages
                v-else-if="asPlaylist.images && asPlaylist.images.length"
                :images="asPlaylist.images"
                size="small"
                class="chartimage playlist"
            />
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
import PlaylistImages from '../shared/PlaylistImages.vue'
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

// Playlists may have no own image (image === "None"): fall back to the track
// covers (collage or single), like the sidebar does. See CLAUDE.md
// "Playlist image=None".
const asPlaylist = computed(() => props.item as Playlist)
const playlistImageUrl = computed(() => paths.images.playlist + asPlaylist.value.image)

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
        color: $candy-text-muted;
        text-align: right;
    }

    .chartimage.artist {
        border-radius: 50%;
    }

    .chartimage.playlist.placeholder {
        width: 48px;
        display: grid;
        place-items: center;
        background-color: $candy-pink-soft;

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
            color: $candy-text-muted;
            margin-top: 0.2rem;
        }
    }

    .chartimage {
        border-radius: 0.25rem;
        height: 48px;
        // Square crop: playlist banner thumbs are 250px HIGH with free
        // aspect ratio — a landscape image rendered at width:auto blows up
        // the chart row. Album covers are square anyway and unaffected.
        width: 48px;
        object-fit: cover;
    }
    .trend {
        height: 1.25rem;
    }

    .trend.rising {
        transform: rotate(90deg);
        color: $candy-text;
    }

    .trend.falling {
        transform: rotate(-90deg);
        color: $candy-text;
    }

    .is_new {
        color: $candy-text;
    }

    .helptext {
        font-size: 0.75rem;
        color: $candy-text-muted;
        text-align: right;
        text-transform: uppercase;
        font-weight: bold;
    }
}
</style>
