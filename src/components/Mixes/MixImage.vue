<template>
    <div class="miximage" :class="{ on_header }">
        <div class="infooverlay" v-if="!mix.extra['image']">
            <div class="type">{{ mix.extra['type'] }} mix</div>
            <div class="title ellip">{{ mix.title.replace('Radio', '') }}</div>
        </div>
        <img
            class="main"
            :src="getImageUrl(mix.extra['image']?.image || '', false)"
            v-if="mix.extra['image']"
            :key="mix.extra['image']['image']"
        />
        <div class="images" v-else>
            <img
                v-for="image in mix.extra['images']"
                :src="getImageUrl(image, true)"
                :key="image['image']"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { paths } from '@/config'
import { Mix } from '@/interfaces'

const props = defineProps<{
    mix: Mix
    on_header?: boolean
}>()

function getImageUrl(image: any, is_extra: boolean = false) {
    if (is_extra) {
        if (image['type'] == 'artist') {
            return paths.images.artist.medium + image['image']
        }

        return paths.images.thumb.medium + image['image']
    }

    if (props.on_header) {
        return paths.images.mix.medium + image
    }

    return paths.images.mix.medium + image
}
</script>

<style lang="scss">
.miximage {
    position: relative;
    aspect-ratio: 1;

    .infooverlay {
        position: absolute;
        bottom: $small;
        z-index: 1;
        left: $small;
        color: $candy-text;

        .type {
            font-size: 0.9rem;
            font-weight: 900;
            text-transform: capitalize;
            color: $candy-text-muted;
        }

        .title {
            font-size: 1.15rem;
            font-weight: 900;
        }
    }

    .main {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: $candy-border;
        border-radius: $candy-radius-sm;
    }

    .images {
        border: $candy-border;
        border-radius: $candy-radius-sm;
        overflow: hidden;
        height: 100%;
        width: 100%;
        position: relative;

        img {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            left: 0;
            height: 50%;
            object-fit: cover;
            border-radius: 0 !important;
        }

        img:nth-child(2) {
            left: 25%;
        }

        img:nth-child(3) {
            left: 50%;
        }
    }
}

.miximage.on_header {
    height: 100%;

    img {
        border: $candy-border;
        border-radius: 1.1rem;
    }

    .infooverlay {
        padding: $small;

        .type {
            font-size: 1.25rem;
            font-weight: 900;
        }

        .title {
            font-size: 2rem;
            font-weight: 900;
        }
    }
}
</style>
