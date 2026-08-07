import { readLocalStorage, writeLocalStorage } from './useLocalStorage'

const KEY = 'recentSearches'
const MAX = 8

const isPrefixPair = (a: string, b: string) => a.startsWith(b) || b.startsWith(a)

/**
 * Collapses typing debris: of two ADJACENT entries where one is a prefix of the
 * other, only the longer survives, at the newer one's position.
 *
 * The store records on every debounce tick, so every pause in typing writes an
 * entry and the half-typed states are candidates too. Folding used to happen in
 * ONE direction (a query extending an older entry: "war" → "warcraft"), which
 * covers typing forwards and nothing else: BACKSPACING out of "holiday island"
 * left "holiday islan", "holiday isla", … behind, because none of those extend
 * the entry above them. Reported as a recent-search list full of debris.
 *
 * ADJACENT is the whole precision of this rule, and folding the list globally
 * instead is what an earlier pass got wrong. Debris is always adjacent — it is
 * written by the keystroke before or after the term it is a fragment of — while
 * two entries that merely happen to share a prefix are two real searches. A
 * global fold makes the band "Yes" permanently unrecordable for anyone with
 * "yesterday" in their history: it is never stored, and "yesterday" jumps to the
 * top instead, every time.
 */
function foldTypingDebris(list: string[]): string[] {
    const kept: string[] = []

    for (const item of list) {
        const previous = kept[kept.length - 1]

        if (previous !== undefined && isPrefixPair(previous.toLowerCase(), item.toLowerCase())) {
            if (item.length > previous.length) kept[kept.length - 1] = item
            continue
        }

        kept.push(item)
    }

    return kept
}

/**
 * The most recent search terms, newest first. Persisted in localStorage so they
 * survive reloads.
 *
 * Folded on READ, not only on write: the lists this fix exists for are already
 * in people's browsers. Folding on write alone would leave every stored
 * fragment ("age", "holiday islan") on screen until its full term happened to
 * be searched again — which is the reported symptom, not a step towards it.
 */
export function getRecentSearches(): string[] {
    const list = readLocalStorage(KEY)
    if (!Array.isArray(list)) return []

    return foldTypingDebris(list.filter((item): item is string => typeof item === 'string'))
}

/**
 * Records a search term, newest first, capped at MAX. Terms shorter than 2
 * chars are ignored. An exact repeat moves back to the front; a term that is
 * only a keystroke away from the one recorded just before it folds into it.
 */
export function recordRecentSearch(query: string) {
    const q = query.trim()
    if (q.length < 2) return

    const lower = q.toLowerCase()
    const list = getRecentSearches().filter(item => item.toLowerCase() !== lower)

    writeLocalStorage(KEY, foldTypingDebris([q, ...list]).slice(0, MAX))
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
