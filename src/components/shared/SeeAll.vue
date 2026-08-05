<template>
    <span class="see-all">
        <RouterLink :to="route">
            <b>{{ text || `SEE ALL` }}</b>
        </RouterLink>
    </span>
</template>

<script setup lang="ts">
defineProps<{
    route: string
    text?: string
}>()
</script>

<style lang="scss">
// "SEE ALL" / "VIEW HISTORY" sits at the right end of a section caption, on the
// memphis ground — so it is a sticker like the caption itself. It IS pressable,
// but it is a text link rather than a control surface, so it takes the sticker
// (no hatch) and answers with the row-plate's hover tint instead.
.see-all {
    @include mem-sticker(999px, 0.25rem 0.7rem);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    flex-shrink: 0;
    transition: background-color 0.2s ease-out, box-shadow 0.12s ease-out;

    &:hover {
        background-color: $mem-hover;
        @include candy-shadow(4px, 4px);

        // The text token travels with the fill (#422): the link below pins its
        // own colour, so the flip has to reach past the sticker to it — or the
        // pill is a solid ink capsule with invisible text.
        a {
            color: var(--mem-hover-text);
        }
    }

    a {
        color: $candy-text;
        transition: color 0.2s ease-out;
    }
}
</style>
