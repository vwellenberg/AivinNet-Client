<template>
    <div class="cardlistrow">
        <component v-for="item in items" :key="item.key" :is="item.component" v-bind="item.props" />
    </div>
</template>

<script setup lang="ts">
import { Album, Artist, Playlist } from '@/interfaces'
import AlbumCard from './AlbumCard.vue'
import ArtistCard from './ArtistCard.vue'
import PlaylistCard from '../PlaylistsList/PlaylistCard.vue'
import { computed } from 'vue'

const props = defineProps<{
    items: Album[] | Artist[] | Playlist[]
}>()

const items = computed(() => {
    return props.items.map((item: any) => {
        const i = {
            component: <any>null,
            props: {},
            key: '',
        }

        switch (item['type']) {
            case 'album':
                i.component = AlbumCard
                i.key = item.albumhash
                i.props = {
                    album: item,
                }
                break
            case 'artist':
                i.component = ArtistCard
                i.key = item.artisthash
                i.props = {
                    artist: item,
                }
                break
            case 'playlist':
                i.component = PlaylistCard
                i.key = item.id
                i.props = {
                    playlist: item,
                }
                break
        }

        return i
    })
})
</script>

<style lang="scss">
.cardlistrow {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax($cardwidth, 1fr));
    padding-bottom: 2rem;
    z-index: -1;

    @include mediumPhones {
        grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    }
}
</style>
