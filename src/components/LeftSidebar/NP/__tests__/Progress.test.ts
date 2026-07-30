import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The seek bar only needs the playhead and a seek() from the queue store;
// mounting the real one would drag in the player, device sync and requests.
const queue = reactive({
    duration: { current: 0, full: 200 },
    currenttrackhash: 'abc123',
    seek: vi.fn(),
})

vi.mock('@/stores/queue', () => ({ default: () => queue }))
vi.mock('@/stores/player', () => ({ maxSeekPercent: { value: 100 } }))
vi.mock('@/utils/colortools/pageGradient', () => ({
    MEMPHIS: { teal: '#2fbfa3', blush: '#f5c6ce', blushSoft: '#fbe3e7' },
}))

import Progress from '@/components/LeftSidebar/NP/Progress.vue'

describe('seek bar scrubbing', () => {
    beforeEach(() => {
        queue.duration.current = 40
        queue.duration.full = 200
        queue.seek.mockReset()
    })

    it('shows the playhead while nothing is being dragged', () => {
        const w = mount(Progress)
        expect((w.find('#progress').element as HTMLInputElement).value).toBe('40')
    })

    it('does not seek on every drag step — only when the drag ends', async () => {
        const w = mount(Progress)
        const input = w.find('#progress')

        await input.setValue('120')
        expect(queue.seek).not.toHaveBeenCalled()

        await input.trigger('change')
        expect(queue.seek).toHaveBeenCalledWith(120)
    })

    it('keeps the dragged position while the playhead moves under it', async () => {
        // The regression: the input's value is bound to the store, which ticks
        // several times a second, so mid-drag re-renders used to yank the knob
        // back to the playhead — on touch that read as "the knob will not move".
        const w = mount(Progress)
        const input = w.find('#progress')

        await input.setValue('120')
        queue.duration.current = 41
        await w.vm.$nextTick()

        expect((input.element as HTMLInputElement).value).toBe('120')
    })

    it('paints the fill at the dragged position, not the playhead', async () => {
        const w = mount(Progress)
        await w.find('#progress').setValue('100')

        // 100 of 200 seconds -> the fill (and its sprinkle overlay) sit at 50%.
        expect(w.find('.progress-wrap').attributes('style')).toContain('--played-frac: 0.5')
    })

    it('follows the playhead again once the drag is released', async () => {
        const w = mount(Progress)
        const input = w.find('#progress')

        await input.setValue('120')
        await input.trigger('change')

        queue.duration.current = 130
        await w.vm.$nextTick()
        expect((input.element as HTMLInputElement).value).toBe('130')
    })
})
