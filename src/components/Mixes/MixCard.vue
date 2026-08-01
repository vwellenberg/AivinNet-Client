<template>
    <RouterLink
        :to="{
            name: Routes.Mix,
            params: {
                mixid: mix.id,
            },
            query: mix.extra.type === 'artist' ? { src: mix.sourcehash } : { src: mix.extra.og_sourcehash },
        }"
        class="mixcard"
    >
        <CardTypeLabel type="mix" />
        <MixImage :mix="mix" :on_header="on_header" class="card-art" />
        <div class="info card-plate">
            <div class="mix rhelp" v-if="mix.time || mix.help_text">
                <span class="help" v-if="mix.help_text">{{ mix.extra.type }} {{ mix.help_text }} </span>
                <span class="time"> {{ mix.time }} </span>
            </div>
            <div class="description ellip2">
                {{ mix.description }}
            </div>
        </div>
    </RouterLink>
</template>

<script setup lang="ts">
import { Mix } from '@/interfaces'

import { RouterLink } from 'vue-router'
import { Routes } from '@/router'
import CardTypeLabel from '../shared/CardTypeLabel.vue'
import MixImage from './MixImage.vue'

defineProps<{
    mix: Mix
    on_header?: boolean
}>()
</script>

<style lang="scss">
// Shape, frame, shadow and hover live in the shared anatomy
// (Global/cards.scss). Only what is specific to a mix tile stays here.
.mixcard {
    cursor: pointer;

    .info {
        .title {
            font-size: 1rem;
            font-weight: 700;
            color: $candy-text;
        }

        .description {
            font-size: 0.8rem;
            font-weight: 500;
            color: $candy-text-muted;
            margin-top: $smaller;
        }
    }
}
</style>
