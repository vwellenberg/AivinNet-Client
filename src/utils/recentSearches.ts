import { readLocalStorage, writeLocalStorage } from './useLocalStorage'

const KEY = 'recentSearches'
const MAX = 8

/**
 * The most recent search terms, newest first. Persisted in localStorage so they
 * survive reloads.
 */
export function getRecentSearches(): string[] {
    const list = readLocalStorage(KEY)
    return Array.isArray(list) ? list : []
}

/**
 * Records a search term: of any two entries where one is a prefix of the other,
 * only the LONGER one survives, and it moves to the top. Terms shorter than 2
 * chars are ignored.
 *
 * The store records on every debounce tick, so the list is written once per
 * pause in typing — which means the half-typed states are candidates too, and
 * folding them away is the whole job here. It used to fold in one direction
 * only (the new query extends an older entry: "war" → "warcraft"). That covers
 * typing forwards and nothing else: BACKSPACING out of "holiday island" left
 * "holiday islan", "holiday isla", … behind, because none of those extend the
 * entry above them. Reported as a recent-search list full of typing debris.
 */
export function recordRecentSearch(query: string) {
    const q = query.trim()
    if (q.length < 2) return

    const lower = q.toLowerCase()
    const list = getRecentSearches()

    // Deleting back into a term you already searched for is not a new search:
    // the longer entry is the one that was meant, so it is what gets kept and
    // promoted. Typing forwards has no such entry and keeps the new query.
    const keep = list.find(item => item.toLowerCase().startsWith(lower)) ?? q
    const kept = keep.toLowerCase()

    const rest = list.filter(item => {
        const other = item.toLowerCase()
        return !other.startsWith(kept) && !kept.startsWith(other)
    })
    writeLocalStorage(KEY, [keep, ...rest].slice(0, MAX))
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
