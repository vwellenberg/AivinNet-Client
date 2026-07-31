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
            <span v-if="isMobile && !onSearchRoute" class="mobile-nav-title">
                {{ mobileTitle }}
            </span>
            <RouterLink v-if="!isMobile" :to="{ name: Routes.Home }" class="nav-home" title="Home">
                <HomeSvg />
            </RouterLink>
            <SearchInput v-if="!isMobile || onSearchRoute" :on_nav="true" />
            <button
                v-if="isMobile && headerAction"
                class="mobile-header-action"
                :title="headerAction.title"
                @click="headerAction.handler"
            >
                <component :is="headerAction.icon" />
            </button>
            <ThemeToggle />
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
import PlusSvg from '@/assets/icons/plus.svg'
import NavLinks from './NavLinks.vue'
import NavTitles from './NavTitles.vue'
import Folder from './Titles/Folder.vue'
import AvatarWithDropdown from './AvatarWithDropdown.vue'
import ThemeToggle from './ThemeToggle.vue'
import useModal from '@/stores/modal'

const auth = useAuth()
const settings = useSettings()
const modal = useModal()
const isSmall = computed(() => content_width.value < 800)
const route = useRoute()

/**
 * On phones the top bar shows the page title, and swaps it for the search
 * field on the search page — that field is the ONLY way to type a query there.
 * Matched on the path as well as the route name: opening /#/search/top as a
 * deep link (or reloading on it) left the name unresolved at the moment this
 * condition first ran, so the phone got a top bar with no search field at all
 * and the page was unusable. The path is available immediately.
 */
const onSearchRoute = computed(() => route.name === Routes.search || route.path.startsWith('/search'))

// Per-route action shown on the right of the mobile top bar, filling the empty
// space next to the avatar. Playlists → New Playlist (replaces the old FAB).
const headerAction = computed(() => {
    switch (route.name) {
        case Routes.playlists:
            return { icon: PlusSvg, title: 'New playlist', handler: () => modal.showNewPlaylistModal() }
        default:
            return null
    }
})

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
            // Matches the logo tile itself (3rem, same as the home button). A
            // shorter slot clipped the tile's offset shadow at the bottom.
            height: 3rem;
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
    }

    .right {
        display: flex;
        gap: 1rem;
        align-items: center;
        width: 100%;

        @include allPhones {
            gap: unset;

            // Let the title's flex: 1 push the action + toggle + avatar to the
            // right edge. The desktop auto-margin would otherwise absorb the free
            // space and separate them from each other.
            .avatar,
            .theme-toggle {
                margin-left: 0;
            }

            .theme-toggle {
                margin-right: $smaller;
            }
        }

        // Per-route contextual action in the mobile top bar (e.g. New Playlist).
        // Candy square sized to the 36px avatar so the two read as a pair.
        // Context action in the mobile top bar (e.g. "New playlist"). Same
        // action role, same blush fill and same 44px touch target as the theme
        // toggle it sits beside — they are two controls in one row and used to
        // be two different buttons.
        .mobile-header-action {
            @include btn-action($size: 2.75rem);
            margin-right: $smaller;
            background-color: $candy-pink;
            color: $candy-black;

            svg {
                width: 1.35rem;
                height: 1.35rem;
            }

            &:hover {
                background-color: $candy-pink-deep;
            }
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
            @include candy-box($candy-pink, $candy-radius-sm);
            color: $candy-black;
            flex-shrink: 0;
            // The home button is an <a>, not a <button>, so it never picked up
            // any of the button roles — it was the one raised surface in the top
            // bar with no offset shadow under it. candy-raised also brings the
            // press-into-the-shadow feedback the rest of the chrome has.
            @include candy-raised(4px, 4px);
            transition: background-color $motion-tint $motion-curve,
                box-shadow $motion-shadow $motion-curve,
                transform $motion-press $motion-curve;

            svg {
                width: 1.5rem;
                height: 1.5rem;
            }

            &:hover {
                background-color: $candy-pink-deep;
            }
        }

        // The free space is claimed BEFORE the theme toggle, not before the
        // avatar, so the toggle + avatar stay a pair in the far-right corner.
        // (Two auto margins total — one here, one on .nav-home — still split the
        // remaining space evenly and keep the home + search group centred.)
        .theme-toggle {
            margin-left: auto;
        }

        .avatar {
            margin-left: 0;
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
