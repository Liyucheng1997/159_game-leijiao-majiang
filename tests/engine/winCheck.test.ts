import { describe, expect, it } from 'vitest'
import { enumerateStandardDecompositions, findWinDecompositions, isWinningHand } from '../../src/engine/winCheck'
import { countVectorFromKinds } from '../../src/engine/tiles'
import { TERMINAL_HONOR_INDICES } from '../../src/engine/constants'

describe('isWinningHand', () => {
  it('accepts a complete standard hand', () => {
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 26, 26]
    expect(isWinningHand(countVectorFromKinds(kinds), 0)).toBe(true)
  })

  it('rejects a tenpai (one tile short) hand', () => {
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 9, 9, 9, 26, 26]
    expect(isWinningHand(countVectorFromKinds(kinds), 0)).toBe(false)
  })

  it('accepts a complete thirteen-orphans hand', () => {
    const kinds = [...TERMINAL_HONOR_INDICES, TERMINAL_HONOR_INDICES[3]]
    expect(isWinningHand(countVectorFromKinds(kinds), 0)).toBe(true)
  })
})

describe('enumerateStandardDecompositions', () => {
  it('finds the single decomposition of an unambiguous hand', () => {
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 26, 26]
    const decomps = enumerateStandardDecompositions(countVectorFromKinds(kinds))
    expect(decomps.length).toBe(1)
    expect(decomps[0].pair).toBe(26)
    expect(decomps[0].sets.length).toBe(4)
  })

  it('finds multiple decompositions for an ambiguous run', () => {
    // 111222333m decomposes as three triplets OR three sequences (123 123 123,
    // 3 copies each) — plus an unambiguous 4th set and a pair to complete the hand.
    const kinds = [0, 1, 2, 0, 1, 2, 0, 1, 2, 18, 18, 18, 27, 27]
    const decomps = enumerateStandardDecompositions(countVectorFromKinds(kinds))
    // 111m 222m 333m (triplets) vs 123m 123m 123m (sequences) — two valid readings.
    expect(decomps.length).toBeGreaterThanOrEqual(2)
    for (const d of decomps) {
      expect(d.pair).toBe(27)
      expect(d.sets.length).toBe(4)
    }
  })

  it('returns nothing for an incomplete hand', () => {
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 9, 9, 9, 26, 26]
    expect(enumerateStandardDecompositions(countVectorFromKinds(kinds))).toEqual([])
  })
})

describe('findWinDecompositions', () => {
  it('returns a single kokushi marker for a complete thirteen-orphans hand', () => {
    const kinds = [...TERMINAL_HONOR_INDICES, TERMINAL_HONOR_INDICES[0]]
    const decomps = findWinDecompositions(countVectorFromKinds(kinds), 0)
    expect(decomps).toEqual([{ kind: 'kokushi' }])
  })

  it('returns standard decompositions for a complete standard hand', () => {
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 26, 26]
    const decomps = findWinDecompositions(countVectorFromKinds(kinds), 0)
    expect(decomps.length).toBeGreaterThan(0)
    expect(decomps[0].kind).toBe('standard')
  })

  it('returns an empty array for a non-winning hand', () => {
    const kinds = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 28, 29, 30]
    expect(findWinDecompositions(countVectorFromKinds(kinds), 0)).toEqual([])
  })
})
