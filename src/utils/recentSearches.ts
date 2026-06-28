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
 * Records a search term: drops an exact duplicate and any earlier entry that
 * this query merely extends ("war" → "warcraft" keeps only the latest), puts it
 * on top, and caps the list. Terms shorter than 2 chars are ignored.
 */
export function recordRecentSearch(query: string) {
    const q = query.trim()
    if (q.length < 2) return

    const lower = q.toLowerCase()
    const list = getRecentSearches().filter(
        item => item.toLowerCase() !== lower && !lower.startsWith(item.toLowerCase())
    )
    list.unshift(q)
    writeLocalStorage(KEY, list.slice(0, MAX))
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
