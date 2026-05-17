<template>
    <div
        class="topnav"
        :class="{
            use_links: settings.is_alt_layout,
            use_sidebar: settings.use_sidebar && isSmall,
        }"
    >
        <div class="left">
            <NavButtons />
            <NavLinks v-if="settings.is_alt_layout" />
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
        <RouterLink v-if="settings.is_alt_layout" to="/" class="logo rounded-sm">
            <div class="logo-orbit-wrapper"><img :src="LogoImg" alt="AivinNet" class="logo-img" /></div>
        </RouterLink>
        <div v-if="settings.is_alt_layout || !settings.use_sidebar || !xl" class="right">
            <RouterLink
                :to="{ name: Routes.search, params: { page: 'top' }, query: { q: search.query } }"
                class="search-icon-btn circular"
                title="Search"
            >
                <SearchSvg />
            </RouterLink>
            <AvatarWithDropdown />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Routes } from '@/router'
import { computed, ref } from 'vue'

import useAuth from '@/stores/auth'
import { content_width } from '@/stores/content-width'
import useSettings from '@/stores/settings'
import { xl } from './../../composables/useBreakpoints'

import LogoImg from '@/assets/icons/logos/logo-subspaceradio.png'
import SearchSvg from '@/assets/icons/search.svg'
import useSearch from '@/stores/search'
import NavButtons from './NavButtons.vue'
import NavLinks from './NavLinks.vue'
import NavSidenav from './NavSidenav.vue'
import NavTitles from './NavTitles.vue'
import Folder from './Titles/Folder.vue'
import AvatarWithDropdown from './AvatarWithDropdown.vue'

const auth = useAuth()
const settings = useSettings()
const search = useSearch()
const isSmall = computed(() => content_width.value < 800)

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

    .logo {
        width: max-content;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;

        .logo-orbit-wrapper {
            width: 2rem;
            height: 2rem;
        }

        .logo-img {
            width: 2rem;
            height: 2rem;
            object-fit: contain;
            position: relative;
            z-index: 1;
        }
    }

    .search-icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        color: $white;
        opacity: 0.75;
        transition: opacity 0.15s, background-color 0.15s;
        flex-shrink: 0;

        &:hover {
            opacity: 1;
            background-color: $gray5;
        }

        svg {
            width: 1.25rem;
            height: 1.25rem;
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
    }

    @include allPhones {
        display: flex;
    }
}
</style>
