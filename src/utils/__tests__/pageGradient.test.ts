import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// pageGradient reads the settings store, which drags in requests, the router,
// the player and device sync. None of that matters for the gradient string.
vi.mock('@/requests/plugins', () => ({ pluginSetActive: vi.fn(), updatePluginSettings: vi.fn() }))
vi.mock('@/requests/settings', () => ({ updateConfig: vi.fn() }))
vi.mock('@/requests/useAxios', () => ({ default: vi.fn() }))
vi.mock('@/stores/devicesync', () => ({ default: () => ({ joined: false, applying: false, intercept: vi.fn() }) }))
vi.mock('@/stores/player', () => ({ usePlayer: () => ({ setVolume: vi.fn(), setMute: vi.fn() }) }))
vi.mock('@/context_menus/hashing', () => ({ getLastFmApiSig: vi.fn() }))
vi.mock('@/router', () => ({ router: { currentRoute: { value: { name: 'other' } } }, Routes: {} }))

import useSettings from '@/stores/settings'
import { brandGradient, pageGradient } from '@/utils/colortools/pageGradient'

// A dominant cover colour as setColorsToStore stores it (hex, already darkened).
const COVER_BG = '#3a5f8a'

describe('pageGradient', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('paints the cover-tinted fade by default', () => {
        const gradient = pageGradient(COVER_BG)

        expect(gradient).toContain('linear-gradient')
        // The extracted colour, not a hardcoded one.
        expect(gradient).toContain('rgba(58, 95, 138')
    })

    it('is transparent without a cover colour', () => {
        expect(pageGradient()).toBe('transparent')
        expect(pageGradient('')).toBe('transparent')
    })

    it('is transparent for every detail page once the setting is off', () => {
        useSettings().togglePageGradient()

        expect(pageGradient(COVER_BG)).toBe('transparent')
        // Different pages pass different cover colours; all of them go flat.
        expect(pageGradient('#a13b2f')).toBe('transparent')
    })

    it('comes back when the setting is switched on again', () => {
        const settings = useSettings()
        settings.togglePageGradient()
        settings.togglePageGradient()

        expect(pageGradient(COVER_BG)).toContain('linear-gradient')
    })
})

describe('brandGradient', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('stays transparent — the library pages show the bare grid ground', () => {
        expect(brandGradient()).toBe('transparent')
    })
})
