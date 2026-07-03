import { TERMINAL_HONOR_INDICES, TILE_KIND_COUNT } from './constants'

export type HandShape = 'standard' | 'kokushi'

export interface ShantenResult {
  shanten: number
  kind: HandShape
}

/**
 * Standard shanten (4 sets + 1 pair) via recursive decomposition over the 34-kind
 * count vector, memoized on (index, remaining counts, melds, pairs, partials).
 *
 * At each nonzero index we try: triplet, sequence (suited only), pair, partial
 * (two-away proto-sequence), or discarding the tile as floating — then take the
 * minimum shanten over every full decomposition explored.
 */
export function standardShanten(counts: number[], meldsAlreadyExposed: number): number {
  const working = counts.slice()
  const memo = new Map<string, number>()

  function leafShanten(melds: number, pairs: number, partials: number): number {
    const effectiveMelds = melds + meldsAlreadyExposed
    const needed = Math.max(0, 4 - effectiveMelds)
    const partialsCapped = Math.min(partials, needed)
    const hasPair = pairs >= 1 ? 1 : 0
    return needed * 2 - partialsCapped - hasPair
  }

  function scan(index: number, melds: number, pairs: number, partials: number): number {
    while (index < TILE_KIND_COUNT && working[index] === 0) index++
    if (index >= TILE_KIND_COUNT) return leafShanten(melds, pairs, partials)

    const key = `${index}|${working.slice(index).join(',')}|${melds},${pairs},${partials}`
    const cached = memo.get(key)
    if (cached !== undefined) return cached

    let best = Infinity
    const groupCount = melds + pairs + partials
    const rankInSuit = index % 9
    const isSuited = index < 27

    if (working[index] >= 3 && groupCount < 5) {
      working[index] -= 3
      best = Math.min(best, scan(index, melds + 1, pairs, partials))
      working[index] += 3
    }

    if (isSuited && rankInSuit <= 6 && working[index + 1] > 0 && working[index + 2] > 0 && groupCount < 5) {
      working[index]--
      working[index + 1]--
      working[index + 2]--
      best = Math.min(best, scan(index, melds + 1, pairs, partials))
      working[index]++
      working[index + 1]++
      working[index + 2]++
    }

    if (working[index] >= 2 && groupCount < 5) {
      working[index] -= 2
      if (pairs === 0) {
        best = Math.min(best, scan(index, melds, pairs + 1, partials))
      } else {
        best = Math.min(best, scan(index, melds, pairs, partials + 1))
      }
      working[index] += 2
    }

    if (isSuited && groupCount < 5) {
      if (rankInSuit <= 7 && working[index + 1] > 0) {
        working[index]--
        working[index + 1]--
        best = Math.min(best, scan(index, melds, pairs, partials + 1))
        working[index]++
        working[index + 1]++
      }
      if (rankInSuit <= 6 && working[index + 2] > 0) {
        working[index]--
        working[index + 2]--
        best = Math.min(best, scan(index, melds, pairs, partials + 1))
        working[index]++
        working[index + 2]++
      }
    }

    // Floating tile: always a valid (if unproductive) fallback, guarantees termination.
    working[index]--
    best = Math.min(best, scan(index, melds, pairs, partials))
    working[index]++

    memo.set(key, best)
    return best
  }

  return scan(0, 0, 0, 0)
}

/** 十三幺: shanten = 13 - (distinct terminal/honor kinds present) - (1 if any of them is paired). */
export function kokushiShanten(counts: number[]): number {
  let distinct = 0
  let hasPair = false
  for (const idx of TERMINAL_HONOR_INDICES) {
    if (counts[idx] > 0) distinct++
    if (counts[idx] >= 2) hasPair = true
  }
  return 13 - distinct - (hasPair ? 1 : 0)
}

/**
 * Combined entry point: returns the lower (better) shanten across standard and
 * kokushi shapes. Kokushi requires a fully concealed hand, so any exposed meld
 * rules it out entirely.
 */
export function calcShanten(counts: number[], meldsAlreadyExposed: number): ShantenResult {
  const std = standardShanten(counts, meldsAlreadyExposed)
  const kok = meldsAlreadyExposed > 0 ? Infinity : kokushiShanten(counts)
  if (kok < std) return { shanten: kok, kind: 'kokushi' }
  return { shanten: std, kind: 'standard' }
}
