<template>
    <div class="settingssidebar">
        <div class="groups">
            <div
                class="group"
                v-for="group in settingGroups.filter(g => {
                    // return true
                    return g.show_if ? g.show_if() : true
                })"
                :key="group.title"
            >
                <div class="gtitle" v-if="group.title">
                    {{ group.title }}
                </div>
                <div class="gitems">
                    <div
                        class="gitem rounded-sm"
                        v-for="item in group.groups"
                        :key="item.title"
                        :class="{
                            active: currentGroup && item.title === currentGroup.title,
                            about: item.title === 'About',
                        }"
                        @click="() => $emit('setTab', item.title || '')"
                    >
                        <Avatar :size="18" :name="auth.user.username || ''" v-if="item.title === 'Profile'" />
                        <span class="icon" v-html="item.icon" v-else></span>
                        <span>
                            {{ item.title }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { SettingGroup } from '@/interfaces/settings'
import settingGroups from '@/settings'
import useAuth from '@/stores/auth'

import Avatar from '@/components/shared/Avatar.vue'

const auth = useAuth()

defineProps<{
    currentGroup: SettingGroup
}>()

defineEmits<{
    (e: 'setTab', title: string): void
}>()
</script>

<style lang="scss">
.settingssidebar {
    border-right: $candy-border;
    background-color: $candy-pink-soft;
    padding: 1.5rem;

    display: grid;
    grid-template-rows: 1fr max-content;
    user-select: none;

    overflow: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    // Height comes from the modal's flex/grid box; min-height:0 lets this
    // pane shrink below its content so it scrolls within the modal.
    min-height: 0;

    @include largePhones {
        padding: 1rem;
    }

    .groups {
        display: flex;
        flex-direction: column;

        .group {
            &:first-child {
                .gitems {
                    .gitem {
                        margin-top: 0;
                    }
                }
            }
        }
    }

    .appversion {
        pointer-events: none;
        font-size: 12px;
        padding: 0 $small;
        color: $gray1;
    }

    .gtitle {
        font-weight: bold;
        font-size: 14px;
        margin: 1.25rem 0 $smaller $small;
    }

    .gitems {
        display: flex;
        flex-direction: column;
    }

    // These rows navigate the modal, so they are buttons and wear the plate the
    // app's own sidebar wears (#378). They were flat, hovered on a yellow accent
    // (`$candy-pink-deep` — "playing" in this palette, see #422) and marked the
    // active tab with a white fill and no frame; next to the plated sidebar two
    // panels away that read as a different kit.
    .gitem {
        padding: 6px $small;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: $medium;
        font-weight: 700;
        font-size: 14px;
        margin-top: $smaller;
        position: relative;
        // Parentheses on purpose: the hatch census reads the argument list, so
        // an argument-less include would read as "states no answer" (#468).
        @include mem-row-plate($hatch: true);

        @include largePhones {
            padding: 5px $small;
        }

        // Glyph and label ride on the smooth fill; the texture stays in the
        // ring. Only the spans: the Profile row renders an <Avatar> whose root
        // is the bare image/svg, and a cover with padding would shrink it
        // inside its fixed 20px box — and only for users who uploaded a picture,
        // because the two avatar variants render different elements.
        > span {
            @include mem-hatch-clear(4px);
        }

        svg {
            width: 1.25rem;
        }

        .icon {
            height: 1.25rem;
        }

        // Pointer-gated at the source (#457) — a latched tap would leave one
        // entry inverted on touch.
        @media (hover: hover) {
            &:hover {
                @include mem-row-plate-hover($hatch: true);
            }
        }

        &.active {
            @include mem-row-plate-active;
        }

        &.about {
            // The ink line above About reaches the frame instead of being a 1px
            // grey hairline drawn inside it — the same correction #422 made over
            // the LIBRARY caption.
            margin-top: 1rem;
        }

        // ⚠️ `left: 0` on an absolutely positioned child resolves against the
        // PADDING box, so the plate's own 3px border would inset the divider by
        // 3px on each side and leave it visibly short of the frame it is meant
        // to reach. Pulled back out by exactly the border width.
        &.about::before {
            content: '';
            height: $candy-border-w;
            position: absolute;
            top: -0.5rem;
            left: -$candy-border-w;

            background-color: $mem-line;
            width: calc(100% + #{$candy-border-w * 2});
        }
    }
}
</style>
