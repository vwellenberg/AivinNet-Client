<template>
    <div class="homepageview">
        <!-- LEFT: Logo + Playlists -->
        <div class="home-playlists-col">
            <Logo class="home-logo" />
            <div class="home-col-heading">Playlists</div>
            <RouterLink
                v-for="pl in pStore.playlists"
                :key="pl.id"
                :to="{ name: Routes.playlist, params: { pid: pl.id } }"
                class="home-pl-row rounded-sm"
            >
                <div class="home-pl-thumb rounded-sm">
                    <img v-if="pl.image" :src="imgBase + pl.image" />
                    <div v-else class="home-pl-nothumb">
                        <PlaylistSvg />
                    </div>
                </div>
                <span class="ellip">{{ pl.name }}</span>
            </RouterLink>
        </div>

        <!-- RIGHT: Browse + Recently played -->
        <div class="home-content-col">
            <Browse />
            <PageItem
                v-for="item in home.homepageItems"
                :key="item.path"
                :title="item.title || ''"
                :description="item.description"
                :items="item.items"
                :play-source="playSources.mix"
                :route="item.path"
                :see-all-text="item.seeAllText"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue'

import { playSources } from '@/enums'
import { updateCardWidth } from '@/stores/content-width'
import useHome from '@/stores/home'
import usePStore from '@/stores/pages/playlists'
import updatePageTitle from '@/utils/updatePageTitle'
import { Routes } from '@/router'
import { paths } from '@/config'

import Browse from '@/components/HomeView/Browse.vue'
import Logo from '@/components/Logo.vue'
import PageItem from '@/components/shared/CardScroller.vue'
import PlaylistSvg from '@/assets/icons/playlist-1.svg'

const home = useHome()
const pStore = usePStore()
const imgBase = paths.images.playlist

onMounted(async () => {
    updatePageTitle('Home')
    await home.fetchAll()
    if (!pStore.playlists.length) {
        pStore.fetchAll()
    }
    await nextTick()
    updateCardWidth()
})
</script>

<style lang="scss">
.homepageview {
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-columns: 17rem 1fr;

    @include allPhones {
        display: block;
        overflow-y: auto;
        padding: 1rem;
        padding-bottom: calc($padbottom + 5.125rem);
    }
}

.home-playlists-col {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    border-right: solid 1px $gray5;
    padding: 0 0.75rem 2rem;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar-thumb { background-color: transparent; }
    &:hover::-webkit-scrollbar-thumb { background-color: $gray2; }

    .home-logo {
        // override swing-logo to fit the panel
        width: 100%;
        margin-bottom: 0.5rem;
        height: 3.75rem;
        border-left: none;
        border-right: none;
        border-top: none;
        border-radius: 0;
    }

    .home-col-heading {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        opacity: 0.45;
        padding: 0.75rem $small 0.5rem;
    }

    .home-pl-row {
        display: flex;
        align-items: center;
        gap: $small;
        padding: 0.35rem $small;
        transition: background-color 0.15s;
        font-size: 0.875rem;
        font-weight: 500;

        &:hover { background-color: $gray; }

        span { opacity: 0.85; }
    }

    .home-pl-thumb {
        width: 2.5rem;
        height: 2.5rem;
        flex-shrink: 0;
        overflow: hidden;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .home-pl-nothumb {
        width: 100%;
        height: 100%;
        background-color: $gray4;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            width: 1.25rem;
            height: 1.25rem;
            opacity: 0.5;
        }
    }

    @include allPhones {
        display: none;
    }
}

.home-content-col {
    height: 100%;
    overflow-y: auto;
    scrollbar-gutter: stable;
    padding: 1.5rem $padright calc($padbottom + 5.125rem) $padleft;
    -webkit-overflow-scrolling: touch;

    @include allPhones {
        height: auto;
        overflow: visible;
        padding: 0;
    }
}
</style>
