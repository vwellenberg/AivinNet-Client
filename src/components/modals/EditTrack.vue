<template>
    <form id="edit-track-modal" autocomplete="off" @submit.prevent="save">
        <label for="et-title">Title</label>
        <input id="et-title" v-model="title" type="text" class="et-input rounded-sm" spellcheck="false" />

        <label for="et-album">Album</label>
        <input id="et-album" v-model="album" type="text" class="et-input rounded-sm" spellcheck="false" />

        <label>Artists</label>
        <ChipInput v-model="artists" placeholder="Add an artist, press Enter" />

        <label>Album artists</label>
        <ChipInput v-model="albumartists" placeholder="Add an album artist, press Enter" />

        <label for="et-track">Track number</label>
        <input id="et-track" v-model.number="trackNo" type="number" min="0" class="et-input et-number rounded-sm" />

        <p class="et-warning">Saving writes these tags into the file on disk.</p>

        <button type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
    </form>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { Track } from '@/interfaces'
import { editTrackTags, EditTrackTagsPayload } from '@/requests/track'
import { NotifType, Notification } from '@/stores/notification'

import ChipInput from './ChipInput.vue'

const props = defineProps<{ track: Track }>()

const emit = defineEmits<{
    (e: 'setTitle', title: string): void
    (e: 'hideModal'): void
}>()

emit('setTitle', 'Edit tags')

const origArtists = (props.track.artists ?? []).map(a => a.name)
const origAlbumArtists = (props.track.albumartists ?? []).map(a => a.name)

const title = ref(props.track.title ?? '')
const album = ref(props.track.album ?? '')
const artists = ref<string[]>([...origArtists])
const albumartists = ref<string[]>([...origAlbumArtists])
const trackNo = ref<number | undefined>(props.track.track)

const saving = ref(false)

onMounted(() => {
    document.getElementById('et-title')?.focus()
})

function sameArray(a: string[], b: string[]) {
    return a.length === b.length && a.every((v, i) => v === b[i])
}

function save() {
    const t = title.value.trim()
    const al = album.value.trim()
    const ar = artists.value.map(a => a.trim()).filter(Boolean)
    const aa = albumartists.value.map(a => a.trim()).filter(Boolean)

    // Mirror the backend's required-non-empty fields so we don't round-trip to a 400.
    if (!t) {
        new Notification('Title is required', NotifType.Error)
        return
    }
    if (!al) {
        new Notification('Album is required', NotifType.Error)
        return
    }
    if (ar.length === 0) {
        new Notification('At least one artist is required', NotifType.Error)
        return
    }

    const payload: EditTrackTagsPayload = {}
    if (t !== props.track.title) payload.title = t
    if (al !== props.track.album) payload.album = al
    if (!sameArray(ar, origArtists)) payload.artists = ar
    if (!sameArray(aa, origAlbumArtists)) payload.albumartists = aa
    if (typeof trackNo.value === 'number' && !Number.isNaN(trackNo.value) && trackNo.value !== props.track.track) {
        payload.track = trackNo.value
    }

    if (Object.keys(payload).length === 0) {
        emit('hideModal')
        return
    }

    saving.value = true
    editTrackTags(props.track.trackhash, payload)
        .then(updated => {
            if (!updated) return
            // Patch the visible row in place from the re-indexed track. Copy ONLY
            // the edited + identity fields — NOT a blanket Object.assign — so the
            // row's per-user/UI state (is_favorite, selection) is preserved: the
            // backend migrates the favorite to the new trackhash, so the known
            // state still holds, and SongItem's trackhash watcher would otherwise
            // reset is_fav from the response. Known limitation: the same track
            // shown in another view, and the now-playing highlight when editing
            // the currently-playing track, only refresh on next navigation (the
            // queue keeps the old hash).
            props.track.title = updated.title
            props.track.album = updated.album
            props.track.artists = updated.artists
            props.track.albumartists = updated.albumartists
            props.track.track = updated.track
            props.track.trackhash = updated.trackhash
            if (updated.albumhash) props.track.albumhash = updated.albumhash
            emit('hideModal')
        })
        .finally(() => {
            saving.value = false
        })
}
</script>

<style lang="scss" scoped>
#edit-track-modal {
    display: flex;
    flex-direction: column;

    label {
        margin: $small 0 $smaller;
        font-weight: 500;
    }

    .et-input {
        border: none;
        background-color: $gray5;
        color: #fff;
        width: 100%;
        padding: $small $medium;
        font-size: 14px;
        outline: none;
        height: 2.75rem;
    }

    .et-number {
        width: 8rem;
    }

    .et-warning {
        color: $gray1;
        font-size: 0.8rem;
        margin: 1rem 0;
    }

    button[type='submit'] {
        margin-top: $small;

        &:disabled {
            opacity: 0.6;
            cursor: default;
        }
    }
}
</style>
