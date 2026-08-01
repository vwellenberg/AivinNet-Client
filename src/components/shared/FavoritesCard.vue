<template>
    <RouterLink :to="{ name: Routes.favoriteTracks }" class="favoritescard">
        <CardTypeLabel type="favorite" />
        <!-- The marker and the play disc live INSIDE the artwork box now; they
             used to be an absolutely positioned sibling offset by the card's
             own padding, which no longer exists. -->
        <div class="img card-art is-glyph">
            <!-- Favorites iconography is the check-circle (never a heart). -->
            <CheckCircleSvg class="heart" />
            <PlayBtn :source="playSources.favorite" />
        </div>
        <div class="info card-plate">
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
import CardTypeLabel from '../shared/CardTypeLabel.vue'
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
// Shape, frame, shadow and hover live in the shared anatomy
// (Global/cards.scss). Only what is specific to the favourites tile stays here.
.favoritescard {
    .heart {
        // Feeds the asset's `currentColor` disc, so this is the same teal the
        // toggle wears — the tile shows the marker, not a recoloured variant of
        // it. Ink here would paint disc, edge and tick in one colour and leave a
        // solid blob on the blush plate.
        color: $mem-teal;
        width: 45%;
        height: auto;
    }

    .fcount {
        font-size: 0.8rem;
        color: $candy-text-muted;
        padding-top: 2px;
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
