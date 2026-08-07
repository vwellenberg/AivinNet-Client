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

    it('promotes the longer term instead of storing the shortened one', () => {
        recordRecentSearch('age of empires')
        recordRecentSearch('weezer')
        recordRecentSearch('age')

        expect(getRecentSearches()).toEqual(['age of empires', 'weezer'])
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

    it('survives a stored list that is not an array of strings', () => {
        localStorage.setItem('recentSearches', JSON.stringify({ nope: true }))
        expect(getRecentSearches()).toEqual([])

        localStorage.setItem('recentSearches', JSON.stringify(['weezer', 7, null]))
        expect(getRecentSearches()).toEqual(['weezer'])
    })

    // A term can be the prefix of more than one entry; folding against the
    // shorter of those would delete the longer one.
    it('promotes the longest match, not the first', () => {
        localStorage.setItem('recentSearches', JSON.stringify(['holiday inn', 'holiday island']))
        recordRecentSearch('holiday')

        expect(getRecentSearches()).toEqual(['holiday island', 'holiday inn'])
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
