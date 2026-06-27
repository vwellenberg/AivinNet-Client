import { parseColor } from '@/utils/colortools'

/**
 * Brightens a colour toward a vivid version by scaling its RGB channels while
 * preserving hue. The scale factor is capped so the brightest channel never
 * exceeds 255, so it lifts dark colours strongly but can't blow bright colours
 * out to white. Used for the vivid top stop of the page gradient.
 */
function vividTop(color: string, factor = 2.3): string {
    const [r, g, b] = parseColor(color)
    const max = Math.max(r, g, b)
    if (max === 0) return 'rgb(60, 60, 60)'
    const scale = Math.min(factor, 255 / max)
    const c = (v: number) => Math.round(v * scale)
    return `rgb(${c(r)}, ${c(g)}, ${c(b)})`
}

/**
 * Single source of truth for the page background gradient of the detail views
 * (Album / Artist / Playlist). Spotify-style header fade: a brighter, vivid
 * accent at the very top that fades down through the header + action row into
 * the page background (#121212). Pass the view's dominant `colors.bg`; falls
 * back to a neutral dark gradient when no colour is available.
 *
 * Centralised here so all three views stay visually consistent — change the
 * fade once and it applies everywhere.
 */
export function pageGradient(bg?: string): string {
    if (!bg) return 'linear-gradient(180deg, #2a2a2a 0%, #121212 45%)'
    return `linear-gradient(180deg, ${vividTop(bg)} 0%, ${bg} 32%, #121212 72%)`
}
