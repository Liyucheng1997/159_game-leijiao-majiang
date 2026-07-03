import { describe, expect, it } from 'vitest'
import { calcShanten, kokushiShanten, standardShanten } from '../../src/engine/shanten'
import { countVectorFromKinds } from '../../src/engine/tiles'
import { TERMINAL_HONOR_INDICES } from '../../src/engine/constants'

// Index reference: wan 0-8, tiao 9-17, tong 18-26, winds 27-30, dragons 31-33.

describe('standardShanten', () => {
  it('recognizes a complete standard hand (4 sets + pair) as -1', () => {
    // 123m 456m 789m 111tiao + 99tong pair
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 26, 26]
    expect(standardShanten(countVectorFromKinds(kinds), 0)).toBe(-1)
  })

  it('recognizes a sequence-wait tenpai hand as 0', () => {
    // 123m 456m 67m(waiting 5m/8m) 111tiao 99tong pair
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 9, 9, 9, 26, 26]
    expect(standardShanten(countVectorFromKinds(kinds), 0)).toBe(0)
  })

  it('recognizes a tanki (single-wait pair) tenpai hand as 0', () => {
    // 123m 456m 789m 111tiao + lone 1tong waiting to pair
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 18]
    expect(standardShanten(countVectorFromKinds(kinds), 0)).toBe(0)
  })

  it('caps at 8 for a maximally scattered 13-tile hand', () => {
    // 13 mutually isolated kinds: no pairs, no adjacent/two-away partials.
    const kinds = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 28, 29, 30]
    expect(standardShanten(countVectorFromKinds(kinds), 0)).toBe(8)
  })

  it('credits already-exposed melds toward the 4 needed sets', () => {
    // Concealed remainder: 123m 456m + 11tong pair (2 sets + pair), 2 melds already exposed.
    const kinds = [0, 1, 2, 3, 4, 5, 18, 18]
    expect(standardShanten(countVectorFromKinds(kinds), 2)).toBe(-1)
  })
})

describe('kokushiShanten', () => {
  it('recognizes a complete thirteen-orphans hand as -1', () => {
    const kinds = [...TERMINAL_HONOR_INDICES, TERMINAL_HONOR_INDICES[0]]
    expect(kokushiShanten(countVectorFromKinds(kinds))).toBe(-1)
  })

  it('recognizes the classic 13-sided wait as tenpai (0)', () => {
    expect(kokushiShanten(countVectorFromKinds(TERMINAL_HONOR_INDICES))).toBe(0)
  })

  it('increases shanten for each missing/unpaired terminal-honor kind', () => {
    const kinds = TERMINAL_HONOR_INDICES.slice(0, 7)
    expect(kokushiShanten(countVectorFromKinds(kinds))).toBe(6)
  })
})

describe('calcShanten', () => {
  it('picks kokushi when it is strictly better than the standard shape', () => {
    const kinds = [...TERMINAL_HONOR_INDICES, TERMINAL_HONOR_INDICES[0]]
    const result = calcShanten(countVectorFromKinds(kinds), 0)
    expect(result).toEqual({ shanten: -1, kind: 'kokushi' })
  })

  it('picks standard when it is strictly better than kokushi', () => {
    const kinds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 26, 26]
    const result = calcShanten(countVectorFromKinds(kinds), 0)
    expect(result).toEqual({ shanten: -1, kind: 'standard' })
  })

  it('disqualifies kokushi entirely once any meld is exposed', () => {
    const kinds = TERMINAL_HONOR_INDICES.slice(0, 12)
    const result = calcShanten(countVectorFromKinds(kinds), 1)
    expect(result.kind).toBe('standard')
  })
})
