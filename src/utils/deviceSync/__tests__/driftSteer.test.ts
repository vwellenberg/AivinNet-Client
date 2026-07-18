import { describe, expect, it } from 'vitest'
import { computeCorrection } from '../driftSteer'

// Convention across these tests: expected position is fixed at 0 and the
// device's currentTime carries the error, so error === currentTimeMs.

describe('computeCorrection', () => {
    it('does nothing inside the deadband (both signs)', () => {
        expect(computeCorrection(0, 0)).toEqual({ action: 'none' })
        expect(computeCorrection(30, 0)).toEqual({ action: 'none' })
        expect(computeCorrection(-30, 0)).toEqual({ action: 'none' })
        expect(computeCorrection(49, 0)).toEqual({ action: 'none' })
        expect(computeCorrection(-49, 0)).toEqual({ action: 'none' })
    })

    it('nudges the rate down when the device is ahead (error > 0)', () => {
        // +500 → 500/1000*0.5 = 0.25 → clamped to 0.04 → rate 0.96
        const c = computeCorrection(500, 0)
        expect(c.action).toBe('rate')
        if (c.action === 'rate') {
            expect(c.rate).toBeCloseTo(0.96, 6)
            expect(c.rate).toBeLessThan(1)
        }
    })

    it('nudges the rate up when the device is behind (error < 0)', () => {
        // -500 → -0.25 → clamped to -0.04 → rate 1.04
        const c = computeCorrection(-500, 0)
        expect(c.action).toBe('rate')
        if (c.action === 'rate') {
            expect(c.rate).toBeCloseTo(1.04, 6)
            expect(c.rate).toBeGreaterThan(1)
        }

        // -200 → -0.1 → clamped to -0.04 → rate 1.04
        const c2 = computeCorrection(-200, 0)
        if (c2.action === 'rate') {
            expect(c2.rate).toBeCloseTo(1.04, 6)
        }
    })

    it('keeps small errors inside the clamp (unclamped rate)', () => {
        // +60 → 60/1000*0.5 = 0.03 (< 0.04) → rate 0.97
        const c = computeCorrection(60, 0)
        if (c.action === 'rate') {
            expect(c.rate).toBeCloseTo(0.97, 6)
        }

        // +100 → 0.05 (> 0.04) → clamped → rate 0.96
        const c2 = computeCorrection(100, 0)
        if (c2.action === 'rate') {
            expect(c2.rate).toBeCloseTo(0.96, 6)
        }
    })

    it('uses the rate branch at the deadband boundary (|e| = 50)', () => {
        // 50 → 0.025 → rate 0.975
        const c = computeCorrection(50, 0)
        expect(c.action).toBe('rate')
        if (c.action === 'rate') {
            expect(c.rate).toBeCloseTo(0.975, 6)
        }

        const c2 = computeCorrection(-50, 0)
        expect(c2.action).toBe('rate')
        if (c2.action === 'rate') {
            expect(c2.rate).toBeCloseTo(1.025, 6)
        }
    })

    it('uses the rate branch at the hard boundary (|e| = 1000)', () => {
        // 1000 → 0.5 → clamped 0.04 → rate 0.96
        const c = computeCorrection(1000, 0)
        expect(c.action).toBe('rate')
        if (c.action === 'rate') {
            expect(c.rate).toBeCloseTo(0.96, 6)
        }

        const c2 = computeCorrection(-1000, 0)
        expect(c2.action).toBe('rate')
    })

    it('hard-seeks to the expected position past the hard threshold', () => {
        const c = computeCorrection(4000, 2500) // error +1500 > 1000
        expect(c).toEqual({ action: 'seek', seekToMs: 2500 })

        const c2 = computeCorrection(0, 2000) // error -2000
        expect(c2).toEqual({ action: 'seek', seekToMs: 2000 })
    })
})
