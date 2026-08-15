import { readFileSync, readdirSync, statSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

// ---------------------------------------------------------------------------
// Census: a menu entry that queues MANY tracks has to name its subject.
//
// Reported 2026-08-15: "Play next" on an album page dropped the whole album
// into the queue. Measured against the deployed app, every path was correct —
// the track row inserts one song, the album header inserts the album, both
// right behind the playing track. What was wrong is that BOTH menus said the
// same four letters. On the album page they are one right-click apart, so the
// container action reads as if it applied to the row under the cursor.
//
// The rule that follows: the bare labels belong to the single track, and every
// container menu (album/artist/folder/playlist/playlist folder) names what it
// is about — "Play album next", "Add playlist to queue".
//
// Enumerated from the SOURCE rather than from a fixed list of files: naming the
// five known menus would stay green for the sixth one somebody adds — which is
// how the sidebar's playlist-folder menu came to carry the bare labels in the
// first place (it is not in `src/context_menus/` at all). A source-scanning
// test goes silently green when its parser breaks, so the first describe()
// guards its own inputs (.claude/rules/testing.md).
// ---------------------------------------------------------------------------

// Read off disk with a project-root-relative path, the same anchor
// `queueSeamCensus` uses and for the same reasons (see its note).
const ROOT = 'src'

function walk(dir: string): string[] {
    return readdirSync(dir).flatMap(entry => {
        const path = `${dir}/${entry}`
        if (statSync(path).isDirectory()) return walk(path)
        return /\.(ts|vue)$/.test(path) && !path.includes('__tests__') ? [path] : []
    })
}

/** Queue calls that take a LIST — the container actions. */
const BULK = /\b(?:insertAfterCurrent|addTracks)\s*\(/

/** Queue calls that take ONE track — the track row's actions. */
const SINGLE = /\b(?:playTrackNext|addTrack)\s*\(/

/**
 * The labels that mean "the one row you clicked". A container entry carrying
 * one of these is the bug this census exists for.
 *
 * Cased variants included on purpose: the menus wrote "Add to Queue" and
 * "Add to queue" side by side, and a census that only knew one spelling would
 * wave the other one through.
 */
const BARE = ['Play next', 'Add to queue', 'Add to Queue']

interface Entry {
    file: string
    label: string
    body: string
}

/**
 * Every `label: '…'` in the file, paired with the source that follows it up to
 * the next label — i.e. the option's own `action`. Menu options are object
 * literals whose label comes first, so the slice holds that option and nothing
 * else. Brace-matching would be more principled and buys nothing here: the only
 * question asked of the slice is which queue call it contains.
 */
function entriesOf(file: string): Entry[] {
    const source = readFileSync(file, 'utf-8')
    const marks = [...source.matchAll(/label:\s*(['"`])([^'"`]*)\1/g)]

    return marks.map((mark, i) => ({
        file,
        label: mark[2],
        body: source.slice(mark.index, i + 1 < marks.length ? marks[i + 1].index : source.length),
    }))
}

const ENTRIES = walk(ROOT).flatMap(entriesOf)
const BULK_ENTRIES = ENTRIES.filter(entry => BULK.test(entry.body))
const SINGLE_ENTRIES = ENTRIES.filter(entry => SINGLE.test(entry.body))

describe('menu label census — inputs', () => {
    it('walks the source tree and parses labelled options out of it', () => {
        expect(ENTRIES.length).toBeGreaterThan(30)
        expect([...new Set(ENTRIES.map(entry => entry.file))]).toEqual(
            expect.arrayContaining([
                'src/context_menus/album.ts',
                'src/context_menus/track.ts',
                'src/components/LeftSidebar/index.vue',
            ])
        )
    })

    it('finds both queue lanes, in every menu that has them', () => {
        // Five containers × two actions. Anchored on the FILES rather than a
        // count, so a menu that loses its entries is loud instead of absent.
        expect([...new Set(BULK_ENTRIES.map(entry => entry.file))].sort()).toEqual([
            'src/components/LeftSidebar/index.vue',
            'src/context_menus/album.ts',
            'src/context_menus/artist.ts',
            'src/context_menus/folder.ts',
            'src/context_menus/playlist.ts',
        ])
        expect(SINGLE_ENTRIES.map(entry => entry.file)).toEqual([
            'src/context_menus/track.ts',
            'src/context_menus/track.ts',
        ])
    })
})

describe('menu label census', () => {
    it('every entry that queues a whole container names its subject', () => {
        const offenders = BULK_ENTRIES.filter(entry => BARE.includes(entry.label)).map(
            entry => `${entry.file}: "${entry.label}"`
        )

        expect(offenders).toEqual([])
    })

    it('the bare labels stay with the single track', () => {
        expect(SINGLE_ENTRIES.map(entry => entry.label).sort()).toEqual(['Add to queue', 'Play next'])
    })

    it('no two menus disagree about the spelling of the same action', () => {
        const spellings = [...new Set([...BULK_ENTRIES, ...SINGLE_ENTRIES].map(entry => entry.label))]
        const collisions = spellings.filter(
            label => spellings.some(other => other !== label && other.toLowerCase() === label.toLowerCase())
        )

        expect(collisions).toEqual([])
    })
})
