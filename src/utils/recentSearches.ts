import { readLocalStorage, writeLocalStorage } from './useLocalStorage'

const KEY = 'recentSearches'
const MAX = 8

/**
 * THE INVARIANT of this list: no entry is a prefix of another. Of any two that
 * are, only the LONGER survives, and it takes the earlier (= more recent) of
 * the two positions.
 *
 * The store records on every debounce tick, so every pause in typing writes an
 * entry — the half-typed states are candidates too, and folding them away is
 * this module's whole job. Folding used to happen in ONE direction (a query
 * extending an older entry: "war" → "warcraft"), which covers typing forwards
 * and nothing else: BACKSPACING out of "holiday island" left "holiday islan",
 * "holiday isla", … behind, because none of those extend the entry above them.
 * Reported as a recent-search list full of typing debris.
 */
function foldPrefixes(list: string[]): string[] {
    const kept: string[] = []

    for (const item of list) {
        const lower = item.toLowerCase()
        const clash = kept.findIndex(other => {
            const seen = other.toLowerCase()
            return seen.startsWith(lower) || lower.startsWith(seen)
        })

        if (clash === -1) kept.push(item)
        else if (item.length > kept[clash].length) kept[clash] = item
    }

    return kept
}

/**
 * The most recent search terms, newest first. Persisted in localStorage so they
 * survive reloads.
 *
 * Folded on READ, not only on write: the lists this fix exists for are already
 * in people's browsers. Folding on write alone would leave every stored
 * fragment ("age", "ae", "holiday islan") on screen until its full term happens
 * to be searched again — which is the reported symptom, not a step towards it.
 */
export function getRecentSearches(): string[] {
    const list = readLocalStorage(KEY)
    if (!Array.isArray(list)) return []

    return foldPrefixes(list.filter((item): item is string => typeof item === 'string'))
}

/**
 * Records a search term, newest first, capped at MAX. Terms shorter than 2
 * chars are ignored.
 *
 * A term that only shortens one already stored is not recorded as itself: the
 * longer entry is the one that was meant, and it is promoted instead. That does
 * cost the deliberate case — searching "beatles" after "beatles remastered"
 * promotes the longer term — and there is no way to tell the two apart from the
 * query alone. The debris is what people actually hit, so it is what this side
 * of the trade answers to; separating them would need a signal this function
 * does not get (a dwell timer, or recording on submit rather than on debounce).
 */
export function recordRecentSearch(query: string) {
    const q = query.trim()
    if (q.length < 2) return

    const lower = q.toLowerCase()
    const list = getRecentSearches()

    // The LONGEST match, not the first one: a term can be the prefix of several
    // entries ("holiday" of both "holiday island" and "holiday inn"), and
    // folding against the shorter of those would delete the longer one.
    const longer = list
        .filter(item => item.toLowerCase().startsWith(lower))
        .sort((a, b) => b.length - a.length)[0]

    writeLocalStorage(KEY, foldPrefixes([longer ?? q, ...list]).slice(0, MAX))
}

export function removeRecentSearch(query: string) {
    writeLocalStorage(
        KEY,
        getRecentSearches().filter(item => item !== query)
    )
}

export function clearRecentSearches() {
    writeLocalStorage(KEY, [])
}
