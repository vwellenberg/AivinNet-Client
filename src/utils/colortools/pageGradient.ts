import { parseColor } from '@/utils/colortools'
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
 * (Album / Artist / Playlist). The memphis ground (grid + doodles) lives on
 * the content shell (#acontent, app-grid.scss); this paints a LIGHT
 * cover-tinted veil over it — a translucent fade from the extracted cover
 * colour (colors.bg) that lets the grid and doodles show through, echoing
 * the old Spotify-style header fade in a memphis-compatible way.
 */
export function pageGradient(bg?: string): string {
    if (!bg) return 'transparent'
    const [r, g, b] = parseColor(bg)
    const stop = (a: number) => `rgba(${r}, ${g}, ${b}, ${a})`
    return `linear-gradient(180deg, ${stop(0.55)} 0%, ${stop(0.25)} 240px, ${stop(0)} 460px)`
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
