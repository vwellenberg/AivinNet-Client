<template>
    <div class="last-updated">
        <span v-if="!isHeaderSmall" class="status">Last updated {{ playlist.info._last_updated }}</span>
        <!-- The separators used to be hardcoded around the actions, so on a
             narrow header (where the status text is hidden) two stray pipes
             were left floating. They belong to the text, and only render with
             it. The actions themselves are real buttons with a touch target,
             not clickable text. -->
        <div v-if="Number.isInteger(playlist.info.id)" class="edit-actions">
            <span v-if="!isHeaderSmall" class="sep">|</span>
            <button class="pl-action" title="Edit playlist" @click="editPlaylist">Edit</button>
            <button class="pl-action icon" title="Delete playlist" @click="deletePlaylist">
                <DeleteSvg />
            </button>
        </div>
    </div>
</template>
<script setup lang="ts">
import DeleteSvg from '@/assets/icons/delete.svg'

import { isHeaderSmall } from '@/stores/content-width'

import useModalStore from '@/stores/modal'
import usePStore from '@/stores/pages/playlist'

const playlist = usePStore()
const modal = useModalStore()

function editPlaylist() {
    modal.showEditPlaylistModal()
}

function deletePlaylist() {
    modal.showDeletePlaylistModal(playlist.info.id)
}
</script>

<style lang="scss">
.last-updated {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    padding: $smaller $small;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: $smaller;
    z-index: 12;

    // Sits on the playlist header ground (square-image mode) -> theme-aware.
    // Banner-image mode overrides to $candy-white in Header.vue.
    color: $mem-content-text;

    display: flex;
    align-items: center;
    gap: $smaller;

    .edit-actions {
        display: flex;
        align-items: center;
        gap: $smaller;
    }

    .sep {
        opacity: 0.5;
        padding: 0 $smaller;
    }

    // Same anatomy as the other header actions; the text one keeps its label,
    // so it sizes to the word and only takes the height.
    .pl-action {
        @include btn-action;
        font-size: 0.9rem;
        font-weight: 500;

        &:not(.icon) {
            width: auto;
            padding: 0 $small;
        }
    }
}
</style>
