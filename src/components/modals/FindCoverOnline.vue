<template>
    <div class="find-cover-modal">
        <form class="searchrow" @submit.prevent="runSearch">
            <input
                id="find-cover-query-input"
                v-model="searchQuery"
                type="search"
                class="rounded-sm"
                placeholder="Search for a cover"
                spellcheck="false"
            />
            <button type="submit" class="search-btn rounded-sm" :disabled="loading">Search</button>
        </form>

        <div v-if="loading" class="state-box">
            <Spinner />
        </div>

        <div v-else-if="searched && !results.length" class="state-box no-results">
            No results found — try renaming your search
        </div>

        <template v-else-if="current">
            <div class="preview rounded-sm">
                <img :src="current.url" :alt="current.album" @error="dropCurrent" />
            </div>
            <div class="meta">
                <div class="album ellip">{{ current.album }}</div>
                <div class="artist ellip">
                    {{ current.artist }} · {{ sourceLabel }} · {{ index + 1 }}/{{ results.length }}
                </div>
            </div>
            <div class="buttons">
                <button type="button" class="shuffle-btn rounded-sm" :disabled="saving" @click="shuffle">
                    Shuffle
                </button>
                <button type="button" class="use-btn rounded-sm" :disabled="saving" @click="useImage">
                    {{ saving ? 'Saving…' : 'Use image' }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { CoverSuggestion, saveOnlineCoverForAlbum, saveOnlineCoverForPlaylist, searchCoversOnline } from '@/requests/coverart'
import { NotifType, Notification } from '@/stores/notification'
import useAlbumStore from '@/stores/pages/album'
import usePStore from '@/stores/pages/playlist'

import Spinner from '@/components/shared/Spinner.vue'

const props = defineProps<{
    type: 'playlist' | 'album'
    id: number | string
    query: string
}>()

const emit = defineEmits<{
    (e: 'setTitle', title: string): void
    (e: 'hideModal'): void
}>()

emit('setTitle', 'Find cover online')

const searchQuery = ref(props.query)
const results = ref<CoverSuggestion[]>([])
const index = ref(0)
const loading = ref(false)
const searched = ref(false)
const saving = ref(false)

const current = computed(() => results.value[index.value])
const sourceLabel = computed(() => {
    switch (current.value?.source) {
        case 'itunes':
            return 'iTunes'
        case 'deezer':
            return 'Deezer'
        default:
            return current.value?.source || ''
    }
})

onMounted(() => runSearch())

async function runSearch() {
    const query = searchQuery.value.trim()

    if (!query || loading.value) return

    loading.value = true
    results.value = await searchCoversOnline(query)
    index.value = 0
    loading.value = false
    searched.value = true
}

function shuffle() {
    if (!results.value.length) return
    index.value = (index.value + 1) % results.value.length
}

// The suggestion image failed to load in the browser: drop it from the
// rotation instead of showing a broken preview.
function dropCurrent() {
    results.value.splice(index.value, 1)

    if (index.value >= results.value.length) {
        index.value = 0
    }
}

async function useImage() {
    if (!current.value || saving.value) return

    saving.value = true
    const url = current.value.url

    if (props.type === 'playlist') {
        const data = await saveOnlineCoverForPlaylist(props.id as number, url)
        saving.value = false

        if (!data) return

        usePStore().updatePInfo(data)
        new Notification('Playlist cover updated!', NotifType.Success)
        emit('hideModal')
        return
    }

    const ok = await saveOnlineCoverForAlbum(props.id as string, url)
    saving.value = false

    if (!ok) return

    // Bust the browser cache on the album page so the new cover shows
    // immediately (other views pick it up on their next fetch).
    const albumStore = useAlbumStore()
    if (albumStore.info.albumhash === props.id) {
        albumStore.info.image = `${props.id}.webp?v=${Date.now()}`
    }

    new Notification('Album cover updated!', NotifType.Success)
    emit('hideModal')
}
</script>

<style lang="scss">
.find-cover-modal {
    display: grid;
    gap: $small;

    .searchrow {
        display: grid;
        grid-template-columns: 1fr max-content;
        gap: $small;
        align-items: center;

        input {
            margin: 0 !important;
        }

        .search-btn {
            height: 2.75rem;
            padding: 0 1.25rem;
            font-weight: 500;
            background-color: $gray4;
            border: none;

            &:hover {
                background-color: $gray3;
            }
        }
    }

    .state-box {
        display: grid;
        place-items: center;
        aspect-ratio: 1;
        width: 100%;
        background-color: $gray5;
        border-radius: $small;
        color: $gray1;
        font-weight: 500;
        padding: 1rem;
        text-align: center;
    }

    .preview {
        aspect-ratio: 1;
        width: 100%;
        overflow: hidden;
        background-color: $gray5;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
    }

    .meta {
        text-align: center;

        .album {
            font-weight: 600;
        }

        .artist {
            color: $gray1;
            font-size: small;
        }
    }

    .buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $small;
        margin-top: $smaller;

        button {
            padding: 1rem;
            font-weight: 500;
            border: none;
        }

        .shuffle-btn {
            background-color: $gray4;

            &:hover {
                background-color: $gray3;
            }
        }

        .use-btn {
            background-color: $white;
            color: $black;

            &:hover:not(:disabled) {
                filter: brightness(0.85);
            }

            &:disabled {
                opacity: 0.6;
            }
        }
    }
}
</style>
