<template>
    <div class="right-group">
        <!-- On desktop shuffle/repeat live in the centre transport and the
             heart sits next to the track title; here they only appear on
             mobile, where all controls are crammed into one group. -->
        <template v-if="isMobile">
            <button
                class="repeat"
                :class="{ 'repeat-disabled': settings.repeat == 'none' }"
                :title="settings.repeat == 'all' ? 'Repeat all' : settings.repeat == 'one' ? 'Repeat one' : 'No repeat'"
                @click="settings.toggleRepeatMode"
            >
                <RepeatOneSvg v-if="settings.repeat == 'one'" />
                <RepeatAllSvg v-else />
            </button>
            <button title="Shuffle" @click="queue.shuffleQueue">
                <ShuffleSvg />
            </button>
            <HeartSvg
                v-if="!hideHeart"
                title="Favorite"
                :state="queue.currenttrack?.is_favorite"
                @handleFav="() => $emit('handleFav')"
            />
        </template>
        <LyricsButton />
        <Volume />
    </div>
</template>

<script setup lang="ts">
import useQueue from '@/stores/queue'
import useSettings from '@/stores/settings'
import { isMobile } from '@/stores/content-width'

import RepeatOneSvg from '@/assets/icons/repeat-one.svg'
import RepeatAllSvg from '@/assets/icons/repeat.svg'
import ShuffleSvg from '@/assets/icons/shuffle.svg'
import HeartSvg from '../shared/HeartSvg.vue'
import LyricsButton from '../shared/LyricsButton.vue'
import Volume from './Volume.vue'

const queue = useQueue()
const settings = useSettings()

defineProps<{
    hideHeart?: boolean
}>()

defineEmits<{
    (event: 'handleFav'): void
}>()
</script>

<style lang="scss">
.right-group {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 2px;
    height: 4rem;

    @include allPhones {
        width: max-content;
        height: unset;
    }

    button {
        height: 3rem !important;
        width: 3rem !important;
        background-color: transparent;
        border: solid 1px transparent;

        &:hover {
            border: solid 1px $gray3 !important;
            background-color: $gray !important;
        }
    }

    .lyrics,
    .repeat {
        svg {
            transform: scale(0.75);
        }

        &:active > svg {
            transform: scale(0.6);
        }
    }

    button.repeat.repeat-disabled {
        svg {
            opacity: 0.25;
        }
    }

    .heart-button {
        border: solid 1px $gray4 !important;
    }
}
</style>
