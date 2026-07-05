<template>
    <div
        class="artist-info"
        :style="{
            color: !useCircularImage ? (artist.colors!.bg ? getTextColor(artist.colors!.bg) : undefined) : undefined,
        }"
    >
        <section class="text">
            <div class="card-title">Artist</div>
            <div class="artist-name" :class="`${useCircularImage ? 'ellip' : 'ellip2'}`" :title="artist.name">
                {{ artist.name }}
            </div>
            <div class="stats">
                <span v-if="artist.trackcount">
                    {{ artist.trackcount.toLocaleString() }} Track{{ `${artist.trackcount == 1 ? '' : 's'} • ` }}
                </span>
                <span v-if="artist.albumcount">
                    {{ artist.albumcount.toLocaleString() }} Album{{ `${artist.albumcount == 1 ? '' : 's'} • ` }}
                </span>
                <span v-if="artist.duration">
                    {{ `${formatSeconds(artist.duration, true)}` }}
                </span>
            </div>
        </section>
        <Buttons :use-circular-image="useCircularImage" />
    </div>
</template>

<script setup lang="ts">
import { getTextColor } from '@/utils/colortools/shift'

import { Artist } from '@/interfaces'
import formatSeconds from '@/utils/useFormatSeconds'
import Buttons from './Buttons.vue'

defineProps<{
    // `colors` is the artist page store's gradient state (stores/pages/artist.ts);
    // the parent passes `store.info` (a plain Artist), so it is optional here.
    artist: Artist & { colors?: { bg: string; bg2: string; btn: string } }
    useCircularImage?: boolean
}>()
</script>

<style lang="scss">
.artist-info {
    z-index: 1;
    padding: 1rem;
    padding-right: 0;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    gap: 1rem;

    .text {
        display: flex;
        flex-direction: column;
        gap: $small;
    }

    .card-title {
        font-size: small;
        font-weight: 700;
    }

    .artist-name {
        font-size: 3.5rem;
        font-weight: 700;
        word-wrap: break-all;
        margin-left: -1px;
    }

    .stats {
        font-size: small;
        font-weight: 700;
    }
}
</style>
