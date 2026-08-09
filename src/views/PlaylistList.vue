<template>
    <div id="p-view" class="content-page" :style="{ background: brandGradient() }">
        <Header>
            <template #name>Playlists</template>
            <template #description>
                You have {{ pStore.playlists.length }} playlists in your library
            </template>
            <template #after>
                <!-- The filter is a CONTROL, so it lives in the head's control
                     slot. It sat in `#description` — which GenericHeader hides
                     on every viewport — so the field was in the DOM at zero
                     size and the filtering behind it unreachable (#528). -->
                <form class="playlist-filter" spellcheck="false" @submit.prevent="() => {}">
                    <input
                        id="playlistsearch"
                        v-model="input"
                        type="search"
                        placeholder="Search playlists"
                    />
                </form>
            </template>
            <template #right>
                <!-- On mobile the in-view header collapses; New Playlist lives as
                     a contextual action in the top bar (see NavBar headerAction). -->
                <button v-if="!isMobile" class="playlist-button" @click="showNewPlaylistModal()">
                    <PlusSvg /> New Playlist
                </button>
            </template>
        </Header>

        <PlaylistCardGroup v-if="!query && pinnedPlaylists.length" :playlists="pinnedPlaylists" :title="'Pinned'" />
        <PlaylistCardGroup
            v-if="playlists.length"
            :playlists="playlists"
            :title="query ? 'Search Results' : `${pinnedPlaylists.length ? 'Other' : 'All'} Playlists`"
        />
        <NoItems
            :flag="!(playlists.length + pinnedPlaylists.length)"
            :icon="PlaylistSvg"
            :title="'No playlists found'"
            :description="description"
        />
    </div>
</template>

<script setup lang="ts">
import { debouncedRef } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import usePStore from '@/stores/pages/playlists'
import { isMobile } from '@/stores/content-width'
import { useFuse } from '@/utils'
import updatePageTitle from '@/utils/updatePageTitle'

import PlaylistSvg from '@/assets/icons/playlist-1.svg'
import PlusSvg from '@/assets/icons/plus.svg'
import PlaylistCardGroup from '@/components/PlaylistsList/PlaylistCardGroup.vue'
import Header from '@/components/shared/GenericHeader.vue'
import { brandGradient } from '@/utils/colortools/pageGradient'
import NoItems from '@/components/shared/NoItems.vue'
import useModalStore from '@/stores/modal'

const pStore = usePStore()
const { showNewPlaylistModal } = useModalStore()

const input = ref('')
const query = debouncedRef(input, 300)

const description = `You can create a playlist by right clicking on a track and selecting the
        "Add to Playlist" option`

// TODO: When you add a song to playlist when you are in this page, increase the count on the card.

const pinnedPlaylists = computed(() => {
    return pStore.playlists.filter(p => p.pinned)
})

onMounted(() => {
    updatePageTitle('Playlists')
})

const playlists = computed(() => {
    if (!query.value) {
        return pStore.playlists.filter(p => !p.pinned)
    }

    const p = useFuse(query.value, pStore.playlists, {
        keys: ['name'],
    })

    return p.value.map(r => r.item)
})
</script>

<style lang="scss">
#p-view {
    padding-bottom: $content-padding-bottom;
    height: 100%;
    overflow: auto;

    .playlist-button {
        @include btn-pill;

        svg {
            height: 1.5rem;
        }
    }

    .grid {
        grid-template-columns: repeat(auto-fill, minmax($cardwidth, 1fr));
        // Column gap from the shared token; the roomier row gap is this
        // page's own decision (Stufe B) — groups of playlist tiles breathe
        // more than the dense library grids.
        gap: 3.5rem $card-col-gap;

        @include mediumPhones {
            grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
            gap: 1rem;
        }
    }

    #playlistsearch {
        width: 16rem;
        max-width: 100%;
        background-color: $candy-pink-soft;
        border: $candy-border;
        color: $candy-black;
        font-size: 0.95rem;
        font-weight: 500;
        padding: $medium;
        outline: none;
        appearance: none;
        // The pill radius and the offset shadow every other control on this
        // page wears — the field was styled during the memphis round but never
        // rendered, so these two never came up.
        border-radius: $candy-radius-pill;
        @include candy-shadow;
    }

    .playlist-button {
        padding-right: $medium;
    }

    .nothing {
        height: 50%;

        svg {
            margin-bottom: 0;
        }
    }
}
</style>
