<template>
    <div class="aboutswingmusic">
        <div class="version">AivinNet v{{ settings.version }}</div>
        AivinNet ist ein Fork von
        <a href="https://github.com/swingmx/swingmusic" target="_blank"><u>Swing Music</u></a>
        — ein selbst gehosteter Musik-Player für deine lokale Bibliothek.
        <br /><br />
        <div class="links">
            <h2>Links</h2>
            <div class="flex">
                <a href="https://github.com/vwellenberg/SubspaceRadio" target="_blank">
                    <button>Backend (GitHub)</button>
                </a>
                <a href="https://github.com/vwellenberg/SubspaceRadio-Client" target="_blank">
                    <button>Frontend (GitHub)</button>
                </a>
                <a href="https://github.com/swingmx/swingmusic" target="_blank">
                    <button>Upstream: Swing Music</button>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import useSettings from '@/stores/settings'

const settings = useSettings()
</script>

<style lang="scss">
.aboutswingmusic {
    padding: $small;

    .version {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: $small;
        border-bottom: solid 1px $separator;
        padding-bottom: 1rem;
    }

    .links .flex {
        flex-wrap: wrap;
        margin-top: $small;
        gap: 1rem;
    }

    h2 {
        margin-top: 0;
        margin-bottom: $smaller;
    }
}
</style>
