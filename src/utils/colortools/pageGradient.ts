import brandColors from '@/brand-colors.json'

// AivinNet brand colours — re-exported from the single source of truth
// (src/brand-colors.json, which also feeds SCSS $brand-green / $brand-red via
// vite.config). Import these anywhere a brand colour is needed in TS/Vue.
export const BRAND_GREEN = brandColors.green
export const BRAND_RED = brandColors.red

// Memphis design palette — the TS-side view of the same JSON source that
// feeds the SCSS $mem-* tokens. Use these for any colour set from script.
export const MEMPHIS = brandColors.memphis

/**
 * Single source of truth for the page background of the detail views
 * (Album / Artist / Playlist). The memphis design paints ONE grid-paper
 * ground on the content shell (#acontent, app-grid.scss) — pages themselves
 * are transparent so the grid shows through everywhere. The signature keeps
 * accepting the extracted colour so the call sites (and a future re-theme)
 * stay untouched.
 */
export function pageGradient(bg?: string): string {
    void bg
    return 'transparent'
}

/**
 * Page background for the top-level library pages (Home, Favorites,
 * Playlists, Stats). Transparent like the detail views — the shared
 * grid-paper ground lives on the content shell.
 */
export function brandGradient(color: string = BRAND_GREEN): string {
    void color
    return 'transparent'
}
