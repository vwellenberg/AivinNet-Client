import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { paths } from '@/config'
import useAxios from '@/requests/useAxios'

import { Artist } from '@/interfaces'

/**
 * Everything whose name does not start with A–Z shares one key at the front of
 * the band: digits, "...Und Null Sekunden", the japanese names. Twenty-odd
 * artists that would otherwise be unreachable by letter.
 */
export const OTHER = '#'

export const LETTERS = [OTHER, ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]

/** The band key a name belongs under. */
export function initialOf(name: string): string {
    const first = (name || '').trim().charAt(0).toUpperCase()
    return /^[A-Z]$/.test(first) ? first : OTHER
}

// The list is fetched whole (names, hashes and image paths — no tracks), so the
// band can state a count per letter and switching letters costs no request.
// 500 at a time rather than one open-ended call: the response for a 500-artist
// library is ~50 kB, and a library ten times that size should arrive in pages
// rather than in one lump.
const PAGE = 500

export default defineStore('searchBrowse', () => {
    const artists = ref<Artist[]>([])
    const letter = ref<string | null>(null)
    const loading = ref(false)
    /** Guards against a second fetch while the first is still in flight. */
    const loaded = ref(false)
    const failed = ref(false)

    /** How many artists sit under each band key. Keys with none are absent. */
    const counts = computed(() => {
        const map: Record<string, number> = {}
        for (const artist of artists.value) {
            const key = initialOf(artist.name)
            map[key] = (map[key] || 0) + 1
        }
        return map
    })

    /**
     * What the row shows: the selected letter's artists, or the start of the
     * list while nothing is selected. The row itself renders as many as its
     * grid has columns (CardScroller), so this stays the full group.
     */
    const shown = computed(() =>
        letter.value === null
            ? artists.value
            : artists.value.filter(artist => initialOf(artist.name) === letter.value)
    )

    async function fetchArtists() {
        if (loaded.value || loading.value) return

        loading.value = true
        failed.value = false

        try {
            const all: Artist[] = []
            let total = Infinity

            while (all.length < total) {
                const { data } = await useAxios({
                    url:
                        paths.api.getall.artists +
                        `?start=${all.length}&limit=${PAGE}&sortby=name&reverse=0`,
                    method: 'GET',
                })

                total = data?.total ?? 0
                // A page that comes back empty ends the loop even if `total`
                // disagrees — otherwise a mismatch between the two spins here
                // forever.
                if (!data?.items?.length) break

                all.push(...data.items)
            }

            artists.value = all
            loaded.value = true
        } catch {
            failed.value = true
        } finally {
            loading.value = false
        }
    }

    function selectLetter(key: string | null) {
        letter.value = letter.value === key ? null : key
    }

    /**
     * Exported for tests: resetting the pinia registry between them is not
     * reliable here (see the note in gotcha_vitest_resetmodules_pinia).
     */
    function $reset() {
        artists.value = []
        letter.value = null
        loading.value = false
        loaded.value = false
        failed.value = false
    }

    return { artists, letter, loading, loaded, failed, counts, shown, fetchArtists, selectLetter, $reset }
})
