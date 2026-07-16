<template>
    <RouterLink
        :to="{
            name: Routes.artist,
            params: {
                hash: artist.artisthash,
            },
        }"
        class="artist-card"
        @contextmenu.prevent="showContextMenu"
        :class="{ 'context-menu-open': contextMenuFlag }"
    >
        <div class="image circular">
            <img class="artist-image circular" :src="imguri + artist.image" />
            <PlayBtn :artisthash="artist.artisthash" :artistname="artist.name" :source="playSources.artist" />
        </div>
        <div v-if="artist.help_text" class="rhelp t-center">
            <span class="help" :class="{ keep: !artist.time }">{{ artist.help_text }}</span>
            <span class="time">{{ artist.time }}</span>
        </div>
        <div class="artist-name t-center">
            {{ artist.name }}
        </div>
        <div v-if="artist.help_text && artist.trackcount" class="racount t-center">
            {{ artist.trackcount }} Track{{ artist.trackcount == 1 ? '' : 's' }}
        </div>
    </RouterLink>
</template>

<script setup lang="ts">
import { paths } from '@/config'
import { Artist } from '@/interfaces'
import { Routes } from '@/router'

import { playSources } from '@/enums'
import PlayBtn from './PlayBtn.vue'
import { ref } from 'vue'
import { showArtistContextMenu } from '@/helpers/contextMenuHandler'

const imguri = paths.images.artist.medium
const contextMenuFlag = ref(false)

const props = defineProps<{
    artist: Artist
}>()

const showContextMenu = (e: MouseEvent) => {
    showArtistContextMenu(e, contextMenuFlag, props.artist.artisthash, props.artist.name)
}
</script>

<style lang="scss">
.artist-card {
    overflow: hidden;
    position: relative;

    @include candy-box($candy-pink, $candy-radius);
    justify-content: center;
    padding: 1.2rem 1rem !important;
    font-size: 0.95rem;
    font-weight: 700;
    height: max-content;
    transition: background-color 0.2s ease-out;

    &.context-menu-open {
        background-color: $candy-pink-deep;
    }

    .image {
        position: relative;
    }

    // round cover → centered button (a corner button would sit outside the circle)
    @include card-play-btn(center);

    &:hover {
        background-color: $candy-pink-deep;
    }

    .artist-image {
        width: 100%;
        transition: background-color 0.2s ease-out;
        object-fit: cover;
        margin-bottom: $smaller;
        border: $candy-border;
    }

    .artist-name {
        word-break: break-word;
        color: $candy-text;
        font-weight: 700;
    }

    .racount {
        font-size: 12px;
        color: $candy-text-muted;
    }
}
</style>
