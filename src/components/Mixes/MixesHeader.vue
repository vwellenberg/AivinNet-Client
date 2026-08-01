<template>
    <div class="mixheader" v-if="mix.title">
        <MixImage :mix="mix" :on_header="true" class="dh-art" />
        <div class="mixinfo dh-body">
            <div class="header_type dh-type">{{ mix.extra['type'] }} mix</div>
            <div class="header_title dh-title">{{ mix.title }}</div>
            <div class="header_description ellip2">
                {{ mix.description }}
            </div>
            <div class="bunchofstuff dh-meta">
                {{ mix.trackcount }} track{{ mix.trackcount === 1 ? '' : 's' }} ▸ {{ mix.duration }}
            </div>
            <!-- Canonical order: Play · Favourite · Pin · Secondary action ·
                 Overflow. "Save mix" is this page's favourite (bookmark glyph,
                 the app's favourite iconography for a saved collection); the
                 remaining slots have no action here. -->
            <div class="buttons header-actions">
                <PlayBtnRect :source="playSources.mix" @click.prevent="$emit('playThis')" />
                <button class="savebtn" :title="saved ? 'Saved Mix' : 'Save Mix'" @click="saveMix">
                    <SaveFilledSvg v-if="saved" />
                    <SaveSvg v-else />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { FullMix } from '@/interfaces'
import MixImage from './MixImage.vue'
import PlayBtnRect from '../shared/PlayBtnRect.vue'
import SaveSvg from '@/assets/icons/bookmark.svg'
import SaveFilledSvg from '@/assets/icons/bookmark.fill.svg'
import { playSources } from '@/enums'
import useAxios from '@/requests/useAxios'
import { paths } from '@/config'
import { ref, watch } from 'vue'

const props = defineProps<{
    mix: FullMix
}>()

defineEmits<{
    (e: 'playThis'): void
}>()

const saved = ref(props.mix.saved)
watch(
    () => props.mix.saved,
    value => {
        saved.value = value
    }
)

async function saveMix() {
    const initialState = saved.value
    saved.value = !initialState

    const res = await useAxios({
        url: paths.api.mixes + '/save',
        method: 'POST',
        props: {
            type: props.mix.extra.type,
            mixid: props.mix.id,
            // INFO: save artist mixes using their sourcehash,
            // but track mixes using their og_sourcehash, as track mixes are based
            // on artist mixes
            sourcehash: props.mix.extra.type === 'artist' ? props.mix.sourcehash : props.mix.extra.og_sourcehash,
        },
    })

    if (res.status !== 200) {
        saved.value = initialState
    }
}
</script>

<style lang="scss">
// Geometry, frame, shadow and the small-screen sizes come from the shared
// anatomy in Global/detail-head.scss. What stood here — an 18rem head with a
// 17.5rem image column and a 4rem/900 title (the largest of the four detail
// headers, against a shared token of 2.75rem/700) — is the drift that anatomy
// prevents.
.mixheader {
    .header_type {
        text-transform: capitalize;
    }

    .header_description {
        font-size: 1rem;
        font-weight: 500;
        margin-top: $smaller;
        color: $candy-text-muted;
    }

    .bunchofstuff {
        margin-top: $small;
        font-size: 14px;
        font-weight: 500;
    }

    // The fourth detail header. Its row is `.header-actions` like the other
    // three now; only the gap to the meta line above it is this header's own.
    .buttons {
        margin-top: 1rem;

        // Was a bare `background: transparent; border: none; padding: 0` with a
        // 1.5rem glyph — verbatim the pattern #244 existed to delete, and a
        // ~24px touch target in a row where everything else is 44px. The role
        // supplies the plate, border, shadow, hover, press and glyph size.
        .savebtn {
            @include btn-action;
        }
    }
}
</style>
