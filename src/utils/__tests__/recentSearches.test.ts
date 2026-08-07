import { beforeEach, describe, expect, it } from 'vitest'
import {
    clearRecentSearches,
    getRecentSearches,
    recordRecentSearch,
    removeRecentSearch,
} from '../recentSearches'

/** Every intermediate state the store sees while a term is typed out. */
function type(term: string) {
    for (let i = 1; i <= term.length; i++) recordRecentSearch(term.slice(0, i))
}

/** …and while it is deleted again, one backspace at a time. */
function backspace(term: string, to = 0) {
    for (let i = term.length - 1; i >= to; i--) recordRecentSearch(term.slice(0, i))
}

describe('recentSearches', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('returns an empty list when nothing is stored', () => {
        expect(getRecentSearches()).toEqual([])
    })

    it('ignores terms shorter than two characters', () => {
        recordRecentSearch('a')
        recordRecentSearch(' ')
        expect(getRecentSearches()).toEqual([])
    })

    it('records newest first', () => {
        recordRecentSearch('weezer')
        recordRecentSearch('lion king')
        expect(getRecentSearches()).toEqual(['lion king', 'weezer'])
    })

    it('keeps only the longest term while one is typed out', () => {
        type('weezer')
        expect(getRecentSearches()).toEqual(['weezer'])
    })

    // The bug this list was reported for: "age", "ae", "holiday islan" sitting
    // next to the terms they are fragments of. Deleting backwards produced them
    // — the old filter only folded a query that EXTENDED an existing entry.
    it('leaves no debris when a term is deleted backwards', () => {
        type('holiday island')
        backspace('holiday island', 4)
        expect(getRecentSearches()).toEqual(['holiday island'])
    })

    // The lists this fix exists for are already stored in people's browsers.
    // Folding only on write would leave every fragment on screen until its
    // full term happened to be searched again.
    it('folds a list that was stored before the fix, on read', () => {
        localStorage.setItem(
            'recentSearches',
            JSON.stringify(['age', 'age of empires', 'holiday islan', 'holiday island', 'bite'])
        )
        expect(getRecentSearches()).toEqual(['age of empires', 'holiday island', 'bite'])
    })

    it('normalises the stored list once, not on every read', () => {
        localStorage.setItem('recentSearches', JSON.stringify(['age', 'age of empires']))
        expect(getRecentSearches()).toEqual(['age of empires'])
        // The migration persists, so nothing re-folds afterwards.
        expect(localStorage.getItem('recentSearches')).toBe(JSON.stringify(['age of empires']))

        localStorage.setItem('recentSearches', JSON.stringify(['yes', 'yesterday']))
        expect(getRecentSearches()).toEqual(['yes', 'yesterday'])
    })

    it('survives a stored list that is not an array of strings', () => {
        localStorage.setItem('recentSearches', JSON.stringify({ nope: true }))
        expect(getRecentSearches()).toEqual([])

        localStorage.setItem('recentSearches', JSON.stringify(['weezer', 7, null]))
        expect(getRecentSearches()).toEqual(['weezer'])
    })

    // Reading is the first thing the search page does, and it used to be an
    // unguarded JSON.parse: a corrupt entry threw during setup and took the
    // whole view — and the store's query watcher — down with it.
    it('survives a stored value that is not JSON at all', () => {
        localStorage.setItem('recentSearches', 'not json {')
        expect(() => getRecentSearches()).not.toThrow()
        expect(getRecentSearches()).toEqual([])
    })

    it('folds a shortened term into the one recorded just before it', () => {
        recordRecentSearch('age of empires')
        recordRecentSearch('age')

        expect(getRecentSearches()).toEqual(['age of empires'])
    })

    // Debris is written by the keystroke next to the term it is a fragment of.
    // Two entries that merely share a prefix are two real searches — folding
    // those made the band "Yes" permanently unrecordable for anyone with
    // "yesterday" in their history.
    it('keeps a short term that shares a prefix with a term further down', () => {
        recordRecentSearch('yesterday')
        recordRecentSearch('bite')
        recordRecentSearch('yes')

        expect(getRecentSearches()).toEqual(['yes', 'bite', 'yesterday'])
    })

    // Folding on every read instead of once: deleting the entry between two
    // prefix-related terms makes them adjacent, and the next render collapses
    // them. One click on an X, two chips gone.
    it('does not collapse the survivors when an entry between them is removed', () => {
        recordRecentSearch('yesterday')
        recordRecentSearch('bite')
        recordRecentSearch('yes')

        removeRecentSearch('bite')
        expect(getRecentSearches()).toEqual(['yes', 'yesterday'])
        // …and still there on the read after that.
        expect(getRecentSearches()).toEqual(['yes', 'yesterday'])
    })

    it('does not collapse the survivors when an unrelated term is re-searched', () => {
        recordRecentSearch('yesterday')
        recordRecentSearch('bite')
        recordRecentSearch('yes')

        recordRecentSearch('bite')
        expect(getRecentSearches()).toEqual(['bite', 'yes', 'yesterday'])
    })

    it('keeps a term that is not a prefix of anything stored', () => {
        recordRecentSearch('age of empires')
        recordRecentSearch('bite')
        expect(getRecentSearches()).toEqual(['bite', 'age of empires'])
    })

    it('folds prefixes case-insensitively', () => {
        recordRecentSearch('Weezer')
        recordRecentSearch('weez')
        expect(getRecentSearches()).toEqual(['Weezer'])
    })

    it('moves an exact repeat back to the front', () => {
        recordRecentSearch('weezer')
        recordRecentSearch('bite')
        recordRecentSearch('weezer')
        expect(getRecentSearches()).toEqual(['weezer', 'bite'])
    })

    it('caps the stored history length', () => {
        for (const term of ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj']) {
            recordRecentSearch(term)
        }
        const list = getRecentSearches()
        expect(list).toHaveLength(8)
        expect(list[0]).toBe('jj')
        expect(list).not.toContain('aa')
    })

    it('removes a single term and clears the list', () => {
        recordRecentSearch('weezer')
        recordRecentSearch('bite')

        removeRecentSearch('weezer')
        expect(getRecentSearches()).toEqual(['bite'])

        clearRecentSearches()
        expect(getRecentSearches()).toEqual([])
    })
})
