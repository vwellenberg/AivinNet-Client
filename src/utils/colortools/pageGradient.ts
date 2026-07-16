import brandColors from '@/brand-colors.json'

// AivinNet brand colours — re-exported from the single source of truth
// (src/brand-colors.json, which also feeds SCSS $brand-green / $brand-red via
// vite.config). Import these anywhere a brand colour is needed in TS/Vue.
export const BRAND_GREEN = brandColors.green
export const BRAND_RED = brandColors.red

// Candy design palette — the TS-side view of the same JSON source that feeds
// the SCSS $candy-* tokens. Use these for any colour set from script.
export const CANDY = brandColors.candy

// The app page background. Candy brutalism is FLAT: every page sits on the
// same pink surface, no fades.
const PAGE_BG = CANDY.pink

/**
 * Single source of truth for the page background of the detail views
 * (Album / Artist / Playlist). Under the candy design this is a flat pink —
 * the cover-derived colour is deliberately ignored so every page shares the
 * same surface. The signature keeps accepting the extracted colour so the
 * call sites (and a future re-theme) stay untouched.
 *
 * Centralised here so all views stay visually consistent — change the
 * surface once and it applies everywhere.
 */
export function pageGradient(bg?: string): string {
    void bg
    return PAGE_BG
}

/**
 * Page background for the top-level library pages (Home, Favorites,
 * Playlists, Stats). Flat candy pink, same as the detail views — kept as a
 * separate function so the library/detail call sites remain distinguishable.
 */
export function brandGradient(color: string = BRAND_GREEN): string {
    void color
    return PAGE_BG
}
