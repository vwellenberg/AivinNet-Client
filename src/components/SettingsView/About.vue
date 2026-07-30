<template>
    <div class="aboutswingmusic">
        <div class="version">AivinNet v{{ clientVersion }}</div>
        <div v-if="settings.version" class="server-version">Server v{{ settings.version }}</div>
        AivinNet is a fork of
        <a href="https://github.com/swingmx/swingmusic" target="_blank"><u>Swing Music</u></a>
        — a self-hosted music player for your local library.
        <br /><br />
        <div class="links">
            <h2>Links</h2>
            <div class="flex">
                <a href="https://github.com/vwellenberg/AivinNet" target="_blank">
                    <button class="btn-pill">Backend (GitHub)</button>
                </a>
                <a href="https://github.com/vwellenberg/AivinNet-Client" target="_blank">
                    <button class="btn-pill">Frontend (GitHub)</button>
                </a>
                <a href="https://github.com/swingmx/swingmusic" target="_blank">
                    <button class="btn-pill">Upstream: Swing Music</button>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import useSettings from '@/stores/settings'
import pkg from '../../../package.json'

const settings = useSettings()
const clientVersion = pkg.version
</script>

<style lang="scss">
.aboutswingmusic {
    padding: $small;

    .version {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: $smaller;
    }

    .server-version {
        font-size: 0.85rem;
        opacity: 0.55;
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
