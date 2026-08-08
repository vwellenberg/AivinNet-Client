import { readLocalStorage, writeLocalStorage } from './useLocalStorage'

const KEY = 'recentSearches'
// Set once the stored list has been normalised — see migrateStoredList.
const MIGRATED_KEY = 'recentSearchesFolded'
const MAX = 8

const isPrefixPair = (a: string, b: string) => a.startsWith(b) || b.startsWith(a)

/**
 * Collapses typing debris, one pair at a time: where a term and the entry
 * recorded immediately before it are a prefix pair, only the longer survives.
 *
 * The store records on every debounce tick, so every pause in typing writes an
 * entry and the half-typed states are candidates too. Folding used to happen in
 * ONE direction (a query extending an older entry: "war" → "warcraft"), which
 * covers typing forwards and nothing else: BACKSPACING out of "holiday island"
 * left "holiday islan", "holiday isla", … behind, because none of those extend
 * the entry above them. Reported as a recent-search list full of debris.
 *
 * Two things this rule deliberately is NOT, both of them wrong turns an earlier
 * pass took:
 *
 *   · it is not a fold over the whole list. Debris is written by the keystroke
 *     next to the term it is a fragment of; two entries further apart are two
 *     real searches, and collapsing those makes the band "Yes" unrecordable for
 *     anyone who has "yesterday" in their history;
 *   · it is not applied on every read. A list that is normalised on read
 *     re-folds after any change in the middle of it: deleting "bite" out of
 *     ["yes", "bite", "yesterday"] makes the survivors adjacent, and the very
 *     next render collapses them — one click on an X removing two chips.
 *
 * What remains true after both: the term the fold runs against is the one that
 * was searched immediately before, so shortening a term you JUST searched
 * promotes the longer one instead of storing the fragment.
 *
 * That trade has a sharp edge, and it is sharper than "one adjacency" sounds,
 * because the adjacency renews itself: while "yesterday" sits at the head,
 * searching the band "Yes" folds into it and leaves the head unchanged, so the
 * next attempt does the same — "Yes" is unrecordable until something else is
 * searched. Recording is driven by the debounce watcher, which cannot tell a
 * deliberate shorter query from a backspace; separating them needs a signal
 * this function is not given (the click that applied a chip, or a dwell timer),
 * and short of that, debris is the failure worth preventing.
 */
function foldAgainstPrevious(term: string, list: string[]): string[] {
    const previous = list[0]
    if (previous === undefined || !isPrefixPair(previous.toLowerCase(), term.toLowerCase())) {
        return [term, ...list]
    }

    return [term.length > previous.length ? term : previous, ...list.slice(1)]
}

/**
 * The lists this fix exists for are already in people's browsers, carrying the
 * fragments the old one-directional fold let through. They are normalised ONCE,
 * on first read, and the flag is what keeps it to once — see the second bullet
 * above for what re-normalising on every read costs.
 */
function migrateStoredList(list: string[]): string[] {
    if (readLocalStorage(MIGRATED_KEY) === true) return list

    // The flag goes down FIRST, and a refusal to store it cancels the whole
    // migration. Without the flag there is nothing keeping this to one run,
    // and a whole-list fold on every read is the two-chips-per-click bug the
    // second bullet above describes — worse than leaving the old debris in
    // place, which is at least only ugly. `writeLocalStorage` swallows quota
    // and refused-storage errors and reports them in its return value, so
    // this is the only place they can be noticed.
    if (!writeLocalStorage(MIGRATED_KEY, true)) return list

    // The same rule as above, applied to every adjacency the stored list
    // already has instead of to the one a new term creates.
    const folded: string[] = []
    for (const item of list) {
        const previous = folded[folded.length - 1]

        if (previous !== undefined && isPrefixPair(previous.toLowerCase(), item.toLowerCase())) {
            if (item.length > previous.length) folded[folded.length - 1] = item
            continue
        }

        folded.push(item)
    }

    writeLocalStorage(KEY, folded)
    return folded
}

/**
 * The most recent search terms, newest first. Persisted in localStorage so they
 * survive reloads.
 */
export function getRecentSearches(): string[] {
    const list = readLocalStorage(KEY)
    if (!Array.isArray(list)) return []

    return migrateStoredList(list.filter((item): item is string => typeof item === 'string'))
}

/**
 * Records a search term, newest first, capped at MAX. Terms shorter than 2
 * chars are ignored. An exact repeat moves back to the front; a term that is
 * one keystroke away from the entry recorded just before it folds into that
 * entry rather than joining it.
 */
export function recordRecentSearch(query: string) {
    const q = query.trim()
    if (q.length < 2) return

    // Fold FIRST, against the list as it stands — the head is then still the
    // entry that was recorded immediately before, which is the one thing this
    // rule is allowed to look at. Deduping first moves a stranger into that
    // position, and folding against a stranger deletes it.
    const folded = foldAgainstPrevious(q, getRecentSearches())
    const head = folded[0]
    const lower = head.toLowerCase()

    // Only THEN drop an older copy of the surviving term, so a repeat moves to
    // the front rather than appearing twice.
    //
    // Skipping the fold for a term that is already stored (to protect that
    // stranger) is the other way round, and it is worse: typing out a term
    // that sits deeper in the list — "yesterday", with ["bite", "yesterday"]
    // stored — leaves the last half-typed tick, "yesterda", at the head
    // FOREVER, since the migration runs once and never revisits it. That is
    // the debris class this module exists to remove. What the order here costs
    // instead: searching "yes" and then picking the "yesterday" chip drops
    // "yes" — where "yes" was, by the shape of the interaction, an abandoned
    // step on the way to the term that was picked.
    const deduped = folded.slice(1).filter(item => item.toLowerCase() !== lower)

    writeLocalStorage(KEY, [head, ...deduped].slice(0, MAX))
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
