<template>
    <div
        class="topnav"
        :class="{
            use_links: settings.is_alt_layout,
            use_sidebar: settings.use_sidebar && isSmall,
        }"
    >
        <div class="left">
            <Logo v-if="!isMobile" class="nav-logo" />
            <div v-if="settings.is_default_layout && $route.name == Routes.folder" class="info">
                <Folder />
            </div>
            <NavTitles v-else-if="settings.is_default_layout && !isSmall" />
        </div>
        <div v-if="settings.is_alt_layout || !settings.use_sidebar || !xl" class="right">
            <span v-if="isMobile && $route.name !== Routes.search" class="mobile-nav-title">
                {{ mobileTitle }}
            </span>
            <RouterLink v-if="!isMobile" :to="{ name: Routes.Home }" class="nav-home" title="Home">
                <HomeSvg />
            </RouterLink>
            <SearchInput v-if="!isMobile || $route.name === Routes.search" :on_nav="true" />
            <AvatarWithDropdown />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Routes } from '@/router'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import useAuth from '@/stores/auth'
import { content_width, isMobile } from '@/stores/content-width'
import useSettings from '@/stores/settings'
import { xl } from './../../composables/useBreakpoints'

import SearchInput from '../RightSideBar/SearchInput.vue'
import Logo from '@/components/Logo.vue'
import HomeSvg from '@/assets/icons/home.svg'
import NavLinks from './NavLinks.vue'
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
        [Routes.favoriteAlbums]: 'Favorites',
        [Routes.favoriteArtists]: 'Favorites',
        [Routes.favoriteTracks]: 'Favorites',
        [Routes.playlists]: 'Playlists',
        [Routes.folder]: 'Folders',
        [Routes.Stats]: 'Stats',
        [Routes.AlbumList]: 'Albums',
        [Routes.ArtistList]: 'Artists',
        [Routes.MixList]: 'Mixes',
        [Routes.settings]: 'Settings',
        [Routes.nowPlaying]: 'Now Playing',
        [Routes.album]: 'Album',
        [Routes.artist]: 'Artist',
        [Routes.artistDiscography]: 'Discography',
        [Routes.playlist]: 'Playlist',
        [Routes.Lyrics]: 'Lyrics',
    }
    return map[route.name as string] || ''
})
</script>

<style lang="scss">
.topnav {
    display: grid;
    // Left column hugs the logo/title; the right column spans the rest so the
    // search group can centre and the avatar can sit in the far-right corner.
    grid-template-columns: max-content 1fr;

    input {
        min-width: 6rem;
    }

    align-items: center;
    gap: 1rem;
    font-size: 14px;

    // NOTE: The alternate layout (the default) used to switch to a 3-column
    // `1fr max-content 1fr` grid here for a centred middle nav element that no
    // longer exists. With only `.left` + `.right` in the DOM that collapsed
    // `.right` into the middle `max-content` track, leaving the third column
    // empty (dead space on the right) and starving the avatar's `margin-left:
    // auto` of free space so it stayed glued to the search bar. Keep the base
    // `max-content 1fr` grid in every layout so `.right` always spans the rest.

    .left {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 1rem;
        position: relative;
        align-items: center;

        .nav-logo {
            // Icon-only logo; width hugs the glyph.
            width: max-content;
            height: 2.5rem;
            align-self: center;
            // Logo component centres its icon at flex-start by default; center
            // it vertically so it sits in the middle of the top bar.
            align-items: center !important;
            justify-content: center !important;
        }

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
        gap: 1rem;
        align-items: center;
        width: 100%;

        @include allPhones {
            gap: unset;
        }

        // Spotify-style layout: the two auto margins (one before the round home
        // button, one before the avatar) split the free space evenly, centring
        // the home + search group and pinning the avatar to the far-right corner
        // so it no longer sits glued to the search bar.
        .nav-home {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background-color: $gray;
            flex-shrink: 0;
            transition: background-color 0.15s ease, transform 0.15s ease;

            svg {
                width: 1.5rem;
                height: 1.5rem;
            }

            &:hover {
                background-color: $gray4;
                transform: scale(1.05);
            }
        }

        .avatar {
            margin-left: auto;
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
