<template>
    <div
        class="topnav"
        :class="{
            use_links: settings.is_alt_layout,
            use_sidebar: settings.use_sidebar && isSmall,
        }"
    >
        <div class="left">
            <div v-if="settings.is_default_layout && $route.name == Routes.folder" class="info">
                <Folder />
            </div>
            <NavTitles v-else-if="settings.is_default_layout && !isSmall" />
        </div>
        <div class="sidenav_toggle" @click="toggleSidenav">
            <div class="bar"></div>
            <div class="bar"></div>
        </div>
        <NavSidenav @close="toggleSidenav" :class="{ active: sidenavActive }" />
        <div class="dimmer noSelect" :class="{ active: sidenavActive }" @click="toggleSidenav"></div>
        <div v-if="settings.is_alt_layout || !settings.use_sidebar || !xl" class="right">
            <span v-if="isMobile && $route.name !== Routes.search" class="mobile-nav-title">
                {{ mobileTitle }}
            </span>
            <SearchInput v-if="!isMobile || $route.name === Routes.search" :on_nav="true" />
            <AvatarWithDropdown />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Routes } from '@/router'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import useAuth from '@/stores/auth'
import { content_width, isMobile } from '@/stores/content-width'
import useSettings from '@/stores/settings'
import { xl } from './../../composables/useBreakpoints'

import SearchInput from '../RightSideBar/SearchInput.vue'
import NavLinks from './NavLinks.vue'
import NavSidenav from './NavSidenav.vue'
import NavTitles from './NavTitles.vue'
import Folder from './Titles/Folder.vue'
import AvatarWithDropdown from './AvatarWithDropdown.vue'

const auth = useAuth()
const settings = useSettings()
const isSmall = computed(() => content_width.value < 800)
const route = useRoute()

const mobileTitle = computed(() => {
    const map: Record<string, string> = {
        [Routes.Home]: 'Home',
        [Routes.favorites]: 'Favorites',
        [Routes.playlists]: 'Playlists',
        [Routes.folder]: 'Folders',
        [Routes.Stats]: 'Stats',
        [Routes.nowPlaying]: 'Now Playing',
        [Routes.album]: 'Album',
        [Routes.artist]: 'Artist',
        [Routes.playlist]: 'Playlist',
        [Routes.Lyrics]: 'Lyrics',
    }
    return map[route.name as string] || ''
})

const sidenavActive = ref(false)

function toggleSidenav() {
    sidenavActive.value = !sidenavActive.value
}
</script>

<style lang="scss">
.topnav {
    display: grid;
    grid-template-columns: 1fr max-content;

    input {
        min-width: 6rem;
    }

    align-items: center;
    gap: 1rem;
    font-size: 14px;

    &.use_links {
        grid-template-columns: 1fr max-content 1fr;
    }

    .left {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 1rem;
        position: relative;

        .info {
            margin: auto 0;
            width: fit-content;
            overflow: hidden;

            .title {
                font-size: 1.5rem;
                font-weight: 700;
                display: flex;
                align-items: center;
            }
        }

        @include allPhones {
            display: none;
        }

        // INFO: Folder page sort bar overrides
        .sortbar {
            top: 0 !important;
            right: 0 !important;
        }
    }

    .right {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        align-items: center;
        width: 100%;

        @include allPhones {
            gap: unset;
            justify-content: unset;
        }

        .mobile-nav-title {
            flex: 1;
            font-size: 1.25rem;
            font-weight: 700;
            padding-left: $small;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    @include allPhones {
        display: flex;
    }
}
</style>
