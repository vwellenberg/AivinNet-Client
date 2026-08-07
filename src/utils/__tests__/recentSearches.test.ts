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
