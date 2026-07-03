import { TILE_KIND_COUNT } from './constants'
import { calcShanten } from './shanten'
import type { DecompSet, KokushiWinDecomposition, StandardWinDecomposition, TileKindId, WinDecomposition } from './types'

/**
 * Is this concealed count vector (13 or 14 tiles, i.e. hand minus already-exposed
 * melds) a complete win, given how many melds are already exposed?
 */
export function isWinningHand(counts: number[], meldsAlreadyExposed: number): boolean {
  return calcShanten(counts, meldsAlreadyExposed).shanten === -1
}

/**
 * Enumerate every valid 4-sets-and-a-pair decomposition of a complete concealed
 * hand. A hand can be ambiguous (e.g. 234567 in one suit decomposes multiple
 * ways) — callers should score every decomposition and keep the best.
 */
export function enumerateStandardDecompositions(counts: number[]): StandardWinDecomposition[] {
  const working = counts.slice()
  const results: StandardWinDecomposition[] = []
  const seen = new Set<string>()

  function record(sets: DecompSet[], pair: TileKindId) {
    const sorted = sets
      .map((s) => [...s.tiles].sort((a, b) => a - b).join('-') + ':' + s.type)
      .sort()
      .join('|')
    const key = `${sorted}#${pair}`
    if (seen.has(key)) return
    seen.add(key)
    results.push({ kind: 'standard', sets: sets.map((s) => ({ ...s, tiles: [...s.tiles] as [number, number, number] })), pair })
  }

  function nextNonZero(from: number): number {
    let i = from
    while (i < TILE_KIND_COUNT && working[i] === 0) i++
    return i
  }

  function helper(index: number, sets: DecompSet[], pair: TileKindId | null) {
    const i = nextNonZero(index)
    if (i >= TILE_KIND_COUNT) {
      if (sets.length === 4 && pair !== null) record(sets, pair)
      return
    }
    if (sets.length < 4) {
      if (working[i] >= 3) {
        working[i] -= 3
        sets.push({ type: 'triplet', tiles: [i, i, i] })
        helper(i, sets, pair)
        sets.pop()
        working[i] += 3
      }

      const rankInSuit = i % 9
      if (i < 27 && rankInSuit <= 6 && working[i + 1] > 0 && working[i + 2] > 0) {
        working[i]--
        working[i + 1]--
        working[i + 2]--
        sets.push({ type: 'sequence', tiles: [i, i + 1, i + 2] })
        helper(i, sets, pair)
        sets.pop()
        working[i]++
        working[i + 1]++
        working[i + 2]++
      }
    }

    if (pair === null && working[i] >= 2) {
      working[i] -= 2
      helper(i, sets, i)
      working[i] += 2
    }
  }

  helper(0, [], null)
  return results
}

/**
 * Returns every valid decomposition of a winning hand (standard, possibly
 * ambiguous; or the single kokushi shape). Empty array if not actually a win.
 */
export function findWinDecompositions(counts: number[], meldsAlreadyExposed: number): WinDecomposition[] {
  const result = calcShanten(counts, meldsAlreadyExposed)
  if (result.shanten !== -1) return []
  if (result.kind === 'kokushi') {
    const kokushi: KokushiWinDecomposition = { kind: 'kokushi' }
    return [kokushi]
  }
  return enumerateStandardDecompositions(counts)
}
