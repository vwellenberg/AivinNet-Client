<template>
    <div v-if="notifStore.notifs" class="toasts">
        <div
            v-for="notif in notifStore.notifs"
            :key="notif.id"
            class="new-notif rounded-sm"
            :class="[notif.type, { 'has-action': notif.action }]"
        >
            <component :is="getSvg(notif.type)" class="notif-icon" />
            <div class="notif-text">{{ notif.text }}</div>
            <button v-if="notif.action" type="button" class="notif-action rounded-sm" @click="runAction(notif)">
                {{ notif.action.label }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Notif } from '../interfaces'
import { NotifType, useToast } from '../stores/notification'

import BookmarkSvg from '../assets/icons/bookmark.svg'
import ErrorSvg from '../assets/icons/toast/error.svg'
import InfoSvg from '../assets/icons/toast/info.svg'
import SuccessSvg from '../assets/icons/toast/ok.svg'
import WorkingSvg from '../assets/icons/toast/working.svg'

const notifStore = useToast()

function runAction(notif: Notif) {
    notifStore.dismiss(notif.id)
    notif.action?.handler()
}

function getSvg(notif: NotifType) {
    switch (notif) {
        case NotifType.Error:
            return ErrorSvg
        case NotifType.Info:
            return InfoSvg
        case NotifType.Success:
            return SuccessSvg
        case NotifType.Working:
            return WorkingSvg
        case NotifType.Favorite:
            return BookmarkSvg
    }
}
</script>
<style lang="scss">
.toasts {
    position: fixed;
    bottom: 6rem;
    left: 50%;
    width: 100%;
    transform: translate(-50%);
    z-index: 1003;
    display: flex;
    align-items: center;
    flex-direction: column-reverse;
    gap: 1rem;
}

.new-notif {
    position: relative;
    font-size: 0.85rem;
    font-weight: 600;
    color: $candy-text;
    display: grid;
    place-items: center;
    width: 100%;
    max-width: 18rem;
    min-height: 4rem;
    padding: 1rem $medium;
    padding-right: $large;
    @include candy-box($candy-white, $candy-radius-sm);
    @include candy-shadow(3px, 3px);

    grid-template-columns: 2rem 3fr;
    gap: $small;

    .notif-icon {
        color: $candy-text;
    }

    .notif-text {
        width: 100%;
    }

    &.has-action {
        grid-template-columns: 2rem 3fr max-content;
        padding-right: $medium;
    }

    .notif-action {
        background-color: transparent;
        border: $candy-border;
        color: $candy-text;
        font-weight: 700;
        padding: $smaller $small;
        height: unset;
        cursor: pointer;

        &:hover {
            background-color: $candy-pink-soft;
        }
    }

    @include smallestPhones {
        max-width: calc(100% - 2rem);
    }
}

.new-notif.success,
.new-notif.favorite {
    background-color: $candy-pink;
}

.new-notif.error {
    background-color: $candy-pink-deep;
}
</style>
