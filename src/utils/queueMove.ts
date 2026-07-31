export interface ResolvedQueueMove {
    /** Index the moved track ends up at, after the splice. */
    finalIndex: number
    /** Where the track that is currently playing sits once the move is applied. */
    currentindex: number
}

/**
 * Work out a queue reorder: where the dragged track lands, and where the
 * *playing* track ends up once it has landed.
 *
 * `to` follows the same convention as everywhere else in the app (SongItem,
 * `playlistMove.ts`): it is the *gap* the row was dropped into, i.e. the target
 * row's index when dropped on its top half and `index + 1` on its bottom half.
 * That is one larger than the final index when moving down, which is why
 * `finalIndex` corrects for it.
 *
 * The second half is the part a server cannot do for us. Only this client knows
 * whether the moved row passed *over* the playing track, and the playing track
 * must keep playing — a reorder is not a track change. Four cases:
 *
 *   - the playing track is the one being moved  -> it travels with it
 *   - a track from above it lands at or below it -> everything shifts up by one
 *   - a track from below it lands at or above it -> everything shifts down by one
 *   - anything else                              -> untouched
 *
 * Returns null when the move would not change anything (or the indices are out
 * of range), so callers can bail before mutating or broadcasting.
 */
export function resolveQueueMove(
    length: number,
    from: number,
    to: number,
    currentindex: number
): ResolvedQueueMove | null {
    if (!Number.isInteger(from) || from < 0 || from >= length) return null
    if (!Number.isInteger(to) || to < 0 || to > length) return null

    const finalIndex = to > from ? to - 1 : to
    if (finalIndex === from) return null

    let current = currentindex

    if (from === currentindex) {
        current = finalIndex
    } else if (from < currentindex && finalIndex >= currentindex) {
        current = currentindex - 1
    } else if (from > currentindex && finalIndex <= currentindex) {
        current = currentindex + 1
    }

    return { finalIndex, currentindex: current }
}
