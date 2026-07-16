<template>
    <div ref="avatarRef" class="avatar">
        <div class="img circular" @click="toggle">
            <Avatar :name="auth.user.username || ''" :size="36" :image="auth.user.image" />
        </div>
        <Transition name="profiledrop-fade">
            <ProfileDropdown v-if="isOpen" @close="close" />
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'

import useAuth from '@/stores/auth';
const auth = useAuth()

import Avatar from '../shared/Avatar.vue';
import ProfileDropdown from './ProfileDropdown.vue';

const isOpen = ref(false)
const avatarRef = ref<HTMLElement>()

function toggle() {
    isOpen.value = !isOpen.value
}

function close() {
    isOpen.value = false
}

// Tap/click anywhere outside the avatar closes the dropdown.
// (Pure CSS :hover left the menu stuck open on touch devices, where it
// overlapped the settings modal and blocked it from closing.)
onClickOutside(avatarRef, () => {
    isOpen.value = false
})
</script>

<style lang="scss">
.avatar {
    position: relative;
    aspect-ratio: 1;
    cursor: pointer;
    transition: background-color 0.2s ease-out, color 0.2s ease-out;

    display: grid;
    place-items: center;
    border-radius: 40%;

    .img {
        height: 36px;
        transition: transform 0.15s ease;

        // White circle with the candy border; the image/generated avatar
        // fills it (border-box, so the visible artwork sits inside the ring).
        img,
        svg {
            border: $candy-border;
            border-radius: 50%;
            // The "white circle" behind the avatar art — keep it static light so
            // the ring stays a light disc in dark (pairs with the paper border).
            background-color: $mem-panel-static;
        }

        &:hover {
            transform: scale(1.05);
        }
    }

    .profiledrop-fade-enter-active,
    .profiledrop-fade-leave-active {
        transition: opacity 0.2s ease-out, transform 0.2s ease-out;
    }

    .profiledrop-fade-enter-from,
    .profiledrop-fade-leave-to {
        opacity: 0;
        transform: translateY(0.5rem);
    }

    @include allPhones {
        height: unset;
        background-color: transparent;
    }
}
</style>
