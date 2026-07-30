import { DOMWrapper, mount } from '@vue/test-utils'
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

// One drag step. Written by hand instead of `setValue()`: on a range input that
// helper leaves the component's @input handler reading the OLD value, so the
// assertions would pass or fail for reasons that have nothing to do with the
// component. A real browser sets the value before dispatching `input`.
async function dragTo(input: DOMWrapper<Element>, value: string) {
    ;(input.element as HTMLInputElement).value = value
    await input.trigger('input')
}

const valueOf = (input: DOMWrapper<Element>) => (input.element as HTMLInputElement).value

describe('seek bar scrubbing', () => {
    beforeEach(() => {
        queue.duration.current = 40
        queue.duration.full = 200
        queue.seek.mockReset()
    })

    it('shows the playhead while nothing is being dragged', () => {
        const w = mount(Progress)
        expect(valueOf(w.find('#progress'))).toBe('40')
    })

    it('does not seek on every drag step — only when the drag ends', async () => {
        const w = mount(Progress)
        const input = w.find('#progress')

        await dragTo(input, '120')
        expect(queue.seek).not.toHaveBeenCalled()

        await input.trigger('change')
        expect(queue.seek).toHaveBeenCalledWith(120)
    })

    it('keeps the dragged position while the playhead moves under it', async () => {
        // The regression: the input's value is bound to the playhead, which
        // ticks several times a second, so mid-drag re-renders used to yank the
        // knob back — on touch that read as "the knob will not move".
        const w = mount(Progress)
        const input = w.find('#progress')

        await dragTo(input, '120')
        queue.duration.current = 41
        await w.vm.$nextTick()

        expect(valueOf(input)).toBe('120')
    })

    it('paints the fill at the dragged position, not the playhead', async () => {
        const w = mount(Progress)
        await dragTo(w.find('#progress'), '100')

        // 100 of 200 seconds -> the fill (and its sprinkle overlay) sit at 50%.
        expect(w.find('.progress-wrap').attributes('style')).toContain('--played-frac: 0.5')
    })

    it('follows the playhead again once the drag is released', async () => {
        const w = mount(Progress)
        const input = w.find('#progress')

        await dragTo(input, '120')
        await input.trigger('change')

        queue.duration.current = 130
        await w.vm.$nextTick()
        expect(valueOf(input)).toBe('130')
    })
})
