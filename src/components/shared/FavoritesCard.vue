<template>
    <RouterLink :to="{ name: Routes.favoriteTracks }" class="favoritescard">
        <div class="img"></div>
        <div class="overlay">
            <PlayBtn :source="playSources.favorite" />
            <!-- Favorites iconography is the check-circle (never a heart). -->
            <CheckCircleSvg class="heart" />
        </div>
        <div class="info">
            <div class="rhelp playlist">
                <span class="help">PLAYLIST</span>
                <span class="time">{{ item.time }}</span>
            </div>
            <div class="title">Favorite Tracks</div>
            <div class="fcount">
                <b>{{ item.count + ` Track${item.count == 1 ? '' : 's'}` }}</b>
            </div>
        </div>
    </RouterLink>
</template>

<script setup lang="ts">
import { Routes } from '@/router'
import { playSources } from '@/enums'
import PlayBtn from '../shared/PlayBtn.vue'
import CheckCircleSvg from '@/assets/icons/check.circle.fill.svg'

defineProps<{
    item: {
        time: string
        count: number
        image: string
    }
}>()
</script>

<style lang="scss">
.favoritescard {
    padding: $medium;
    position: relative;
    @include candy-box($mem-panel, $candy-radius);
    // Hard offset shadow: the tile sits above the grid ground (memphis).
    @include candy-raised(3px, 3px, $press: false);
    transition: background-color 0.2s ease-out, box-shadow 0.12s ease-out;

    .img,
    .overlay {
        width: 100%;
        aspect-ratio: 1/1;
        border-radius: $candy-radius-sm;
        margin-bottom: $medium;
    }

    .img {
        overflow: hidden;
        @include candy-box($candy-pink-soft, $candy-radius-sm);
    }

    .overlay {
        display: flex;
        align-items: center;
        justify-content: center;
        $size: calc(100% - $medium * 2);
        position: absolute;
        top: $medium;
        left: $medium;
        width: $size;
        z-index: 1;
    }

    .heart {
        // Feeds the asset's `currentColor` disc, so this is the same teal the
        // toggle wears — the tile shows the marker, not a recoloured variant of
        // it. Ink here would paint disc, edge and tick in one colour and leave a
        // solid blob on the blush plate.
        color: $mem-teal;
        width: 45%;
        height: auto;
    }

    @include card-play-btn;

    .fcount {
        font-size: 0.8rem;
        color: $candy-text-muted;
        padding-top: 2px;
    }

    &:hover {
        background-color: $mem-hover;
    }

    .info {
        .title {
            font-weight: 700;
            font-size: 0.95rem;
            color: $candy-text;
        }
    }
}
</style>
