import { brightness } from '@nextcss/color-tools'
import rgb2Hex from '@/utils/colortools/rgb2Hex'

export function getTypeColor(color: string) {
    const lightness = brightness(rgb2Hex(color))
    const is_light = lightness > 50
    return is_light ? 'rgb(109, 69, 16)' : '#ac8e68'
}

export function lightenHex(hex: string, amount = 0.45): string {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return hex
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lr = Math.round(r + (255 - r) * amount)
    const lg = Math.round(g + (255 - g) * amount)
    const lb = Math.round(b + (255 - b) * amount)
    return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
}