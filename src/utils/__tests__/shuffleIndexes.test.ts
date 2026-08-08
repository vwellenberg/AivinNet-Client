import { describe, expect, it } from 'vitest'

import { remapAfterMove, shiftAfterInsert, shiftAfterRemove } from '@/utils/shuffleIndexes'

describe('shiftAfterInsert', () => {
    it('leaves indexes in front of the insert alone', () => {
        expect(shiftAfterInsert(2, 4, 1)).toBe(2)
        expect(shiftAfterInsert(3, 4, 1)).toBe(3)
    })

    it('pushes an index sitting exactly on the insert down', () => {
        // The new row takes that slot, so the tracked track moved.
        expect(shiftAfterInsert(4, 4, 1)).toBe(5)
    })

    it('shifts by the number of inserted rows', () => {
        expect(shiftAfterInsert(6, 2, 3)).toBe(9)
    })

    it('is a no-op for an empty insert', () => {
        expect(shiftAfterInsert(6, 2, 0)).toBe(6)
        expect(shiftAfterInsert(6, 2, -1)).toBe(6)
    })
})

describe('shiftAfterRemove', () => {
    it('moves indexes behind the removed row up', () => {
        expect(shiftAfterRemove(5, 2)).toBe(4)
    })

    it('leaves indexes in front of it alone', () => {
        expect(shiftAfterRemove(1, 2)).toBe(1)
    })

    it('returns null for the removed row itself', () => {
        // It names nothing now. Collapsing it onto a neighbour would hand back
        // a track the picker never chose.
        expect(shiftAfterRemove(2, 2)).toBeNull()
    })
})

describe('remapAfterMove', () => {
    it('travels with the row when it IS the moved one', () => {
        expect(remapAfterMove(3, 3, 7)).toBe(7)
    })

    it('shifts up when a row from above lands at or below it', () => {
        expect(remapAfterMove(5, 2, 5)).toBe(4)
        expect(remapAfterMove(5, 2, 8)).toBe(4)
    })

    it('shifts down when a row from below lands at or above it', () => {
        expect(remapAfterMove(5, 8, 5)).toBe(6)
        expect(remapAfterMove(5, 8, 2)).toBe(6)
    })

    it('stays put when the move happens entirely to one side', () => {
        expect(remapAfterMove(5, 7, 8)).toBe(5)
        expect(remapAfterMove(5, 1, 3)).toBe(5)
    })

    // The playing track goes through exactly these cases in resolveQueueMove;
    // shuffle's indexes have no reason to disagree with it.
    it('agrees with the currentindex arithmetic in resolveQueueMove', () => {
        const cases = [
            [3, 3, 7],
            [5, 2, 5],
            [5, 8, 5],
            [5, 7, 8],
        ]

        for (const [index, from, finalIndex] of cases) {
            let expected = index
            if (from === index) expected = finalIndex
            else if (from < index && finalIndex >= index) expected = index - 1
            else if (from > index && finalIndex <= index) expected = index + 1

            expect(remapAfterMove(index, from, finalIndex)).toBe(expected)
        }
    })
})
