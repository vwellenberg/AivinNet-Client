/* eslint-disable no-undef */
/// <reference types="vitest" />

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const path = require("path");

export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    svgLoader(),
    VitePWA({
      // SERVICE WORKER DISABLED ON PURPOSE.
      // This is a self-hosted player on the LAN that we deploy to constantly.
      // A precaching service worker repeatedly served STALE assets: hard
      // refresh (Ctrl+Shift+R) and "clear cache" do NOT bypass a service
      // worker, so deployed fixes never reached the browser until the SW was
      // manually unregistered. skipWaiting/clientsClaim did not help because an
      // already-installed older SW kept waiting.
      // `selfDestroying` ships a SW whose only job is to unregister itself and
      // wipe the old caches. After it runs once, NO service worker controls the
      // page, so every deploy is visible on a normal reload. Do not re-enable
      // PWA caching here without a very good reason — see CLAUDE.md.
      selfDestroying: true,
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "AivinNet",
        short_name: "AivinNet",
        description: "AivinNet — selbst-gehosteter Musik-Player",
        theme_color: "#111",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Playlists",
            description: "View your playlists",
            url: "/#/playlists",
            icons: [
              {
                src: "/icons/playlist.svg",
                type: "image/svg+xml",
              },
            ],
          },
          {
            name: "Favorites",
            description: "View your favorites",
            url: "/#/favorites",
            icons: [
              {
                src: "/icons/heart.svg",
                type: "image/svg+xml",
              },
            ],
          },
          {
            name: "Settings",
            description: "Modify settings",
            url: "/#/settings",
            icons: [
              {
                src: "/icons/settings.svg",
                type: "image/svg+xml",
              },
            ],
          },
        ],
        start_url: "/",
        display: "standalone",
        background_color: "rgba(0, 0, 0, 0.95)",
      },
    }),
    viteCompression({
      threshold: 150,
    }),
    nodePolyfills({
      include: ['crypto'],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/scss/_variables.scss", "@/assets/scss/_mixins.scss";`,
      },
    },
  },
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
