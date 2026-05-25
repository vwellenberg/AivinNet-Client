import { brightness } from '@nextcss/color-tools'
import rgb2Hex from '@/utils/colortools/rgb2Hex'

export function getTypeColor(color: string) {
    const lightness = brightness(rgb2Hex(color))
    const is_light = lightness > 50
    return is_light ? 'rgb(109, 69, 16)' : '#ac8e68'
}

export function vibrateHex(hex: string): string {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return hex
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h = 0, s = 0
    let l = (max + min) / 2

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1))
        if (max === r) h = ((g - b) / delta + 6) % 6
        else if (max === g) h = (b - r) / delta + 2
        else h = (r - g) / delta + 4
        h /= 6
    }

    // boost saturation to at least 65%, clamp lightness to 25-40% for vivid visible gradient
    s = Math.max(s, 0.65)
    l = Math.min(Math.max(l, 0.25), 0.40)

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h * 6) % 2 - 1))
    const m = l - c / 2

    let r1 = 0, g1 = 0, b1 = 0
    const sector = Math.floor(h * 6)
    switch (sector) {
        case 0: r1 = c; g1 = x; b1 = 0; break
        case 1: r1 = x; g1 = c; b1 = 0; break
        case 2: r1 = 0; g1 = c; b1 = x; break
        case 3: r1 = 0; g1 = x; b1 = c; break
        case 4: r1 = x; g1 = 0; b1 = c; break
        default: r1 = c; g1 = 0; b1 = x; break
    }

    const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`
}