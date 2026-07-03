import { describe, expect, it } from 'vitest'
import { bestFanResult, calcFan, canDeclareHu, type FanContext } from '../../src/engine/fan'
import type { Meld, StandardWinDecomposition, WinDecomposition } from '../../src/engine/types'

// Index reference: wan 0-8, tiao 9-17, tong 18-26, winds 27-30, dragons 31-33.

function standardDecomp(overrides: Partial<StandardWinDecomposition> = {}): StandardWinDecomposition {
  return {
    kind: 'standard',
    sets: [
      { type: 'sequence', tiles: [0, 1, 2] },
      { type: 'sequence', tiles: [3, 4, 5] },
      { type: 'sequence', tiles: [6, 7, 8] },
      { type: 'sequence', tiles: [9, 10, 11] },
    ],
    pair: [26, 26][0],
    ...overrides,
  }
}

function baseCtx(overrides: Partial<FanContext> = {}): FanContext {
  return {
    decomposition: standardDecomp(),
    winningTile: 11,
    exposedMelds: [],
    flowersHeld: [],
    isMenqing: false,
    isSelfDraw: false,
    ...overrides,
  }
}

describe('calcFan — 平胡', () => {
  it('bare win with no bonuses scores 0 fan', () => {
    const result = calcFan(baseCtx())
    expect(result.total).toBe(0)
    expect(result.breakdown).toEqual([])
  })
})

describe('calcFan — 门清 + 自摸', () => {
  it('concealed self-draw win scores 门清(1) + 自摸(1) = 2', () => {
    const result = calcFan(baseCtx({ isMenqing: true, isSelfDraw: true }))
    expect(result.total).toBe(2)
    expect(result.breakdown).toEqual(
      expect.arrayContaining([
        { name: '门清', fan: 1 },
        { name: '自摸', fan: 1 },
      ]),
    )
  })

  it('concealed discard win (no self-draw bonus) scores only 1 fan', () => {
    const result = calcFan(baseCtx({ isMenqing: true, isSelfDraw: false }))
    expect(result.total).toBe(1)
  })
})

describe('calcFan — 对对胡', () => {
  it('all-triplet hand (concealed + exposed) scores +2', () => {
    const decomposition = standardDecomp({
      sets: [
        { type: 'triplet', tiles: [0, 0, 0] },
        { type: 'triplet', tiles: [3, 3, 3] },
      ],
    })
    const exposedMelds: Meld[] = [{ type: 'peng', concealed: false, tiles: [9, 9, 9] }]
    const result = calcFan(baseCtx({ decomposition, exposedMelds, winningTile: 0 }))
    expect(result.total).toBe(2)
  })

  it('a hand with any sequence does not qualify', () => {
    const decomposition = standardDecomp({
      sets: [
        { type: 'triplet', tiles: [0, 0, 0] },
        { type: 'sequence', tiles: [3, 4, 5] },
      ],
    })
    const result = calcFan(baseCtx({ decomposition, winningTile: 0 }))
    expect(result.total).toBe(0)
  })
})

describe('calcFan — 清一色', () => {
  it('a hand entirely within one suit scores +4', () => {
    const decomposition = standardDecomp({
      sets: [
        { type: 'sequence', tiles: [0, 1, 2] },
        { type: 'sequence', tiles: [3, 4, 5] },
      ],
      pair: 8,
    })
    // winningTile completes a set, not the pair, so this isolates 清一色 alone.
    const result = calcFan(baseCtx({ decomposition, winningTile: 0 }))
    expect(result.total).toBe(4)
  })

  it('a single honor tile disqualifies 清一色', () => {
    const decomposition = standardDecomp({
      sets: [
        { type: 'sequence', tiles: [0, 1, 2] },
        { type: 'sequence', tiles: [3, 4, 5] },
      ],
      pair: 27, // wind pair breaks purity
    })
    const result = calcFan(baseCtx({ decomposition, winningTile: 0 }))
    expect(result.total).toBe(0)
  })
})

describe('calcFan — 十三幺', () => {
  it('scores a flat MAX_FAN regardless of other conditions', () => {
    const decomposition: WinDecomposition = { kind: 'kokushi' }
    const result = calcFan(
      baseCtx({
        decomposition,
        flowersHeld: [0, 1, 2],
        isMenqing: true,
        isSelfDraw: true,
      }),
    )
    expect(result.total).toBe(88)
    expect(result.breakdown).toEqual([{ name: '十三幺', fan: 88 }])
  })
})

describe('calcFan — 花牌 stacking', () => {
  it('each flower held adds +1, additive with other bonuses', () => {
    const result = calcFan(baseCtx({ flowersHeld: [0, 1, 2], isMenqing: true }))
    expect(result.total).toBe(4) // 3 flowers + 门清
  })
})

describe('calcFan — 杠 stacking and 门清 interaction', () => {
  it('暗杠(+2) and 明杠(+1) stack to +3', () => {
    const exposedMelds: Meld[] = [
      { type: 'gang', concealed: true, tiles: [0, 0, 0, 0] },
      { type: 'gang', concealed: false, tiles: [3, 3, 3, 3] },
    ]
    const result = calcFan(baseCtx({ exposedMelds }))
    expect(result.total).toBe(3)
  })

  it('an ankan alone is compatible with 门清 staying true (gameState is the source of truth for the flag)', () => {
    const exposedMelds: Meld[] = [{ type: 'gang', concealed: true, tiles: [0, 0, 0, 0] }]
    const result = calcFan(baseCtx({ exposedMelds, isMenqing: true }))
    expect(result.total).toBe(3) // 暗杠(2) + 门清(1)
  })

  it('an exposed minggang implies 门清 is false (as set by the caller)', () => {
    const exposedMelds: Meld[] = [{ type: 'gang', concealed: false, tiles: [0, 0, 0, 0] }]
    const result = calcFan(baseCtx({ exposedMelds, isMenqing: false }))
    expect(result.total).toBe(1) // 明杠(1) only, no 门清
  })
})

describe('calcFan — 单钓将', () => {
  it('winning tile completing the pair scores +1', () => {
    const decomposition = standardDecomp({ pair: 20 })
    const result = calcFan(baseCtx({ decomposition, winningTile: 20 }))
    expect(result.total).toBe(1)
  })

  it('winning tile completing a set (not the pair) scores 0 for this rule', () => {
    const decomposition = standardDecomp({ pair: 20 })
    const result = calcFan(baseCtx({ decomposition, winningTile: 0 }))
    expect(result.total).toBe(0)
  })
})

describe('canDeclareHu — 屁胡 threshold boundaries', () => {
  const cases: Array<[fan: number, isSelfDraw: boolean, expected: boolean]> = [
    [0, true, false],
    [0, false, false],
    [1, true, true],
    [1, false, false],
    [2, true, true],
    [2, false, true],
    [3, true, true],
    [3, false, true],
  ]

  for (const [fan, isSelfDraw, expected] of cases) {
    it(`fan=${fan} isSelfDraw=${isSelfDraw} -> ${expected}`, () => {
      expect(canDeclareHu(fan, isSelfDraw)).toBe(expected)
    })
  }
})

describe('bestFanResult', () => {
  it('picks the highest-scoring decomposition among ambiguous readings', () => {
    const allTripletsDecomp = standardDecomp({
      sets: [
        { type: 'triplet', tiles: [0, 0, 0] },
        { type: 'triplet', tiles: [1, 1, 1] },
        { type: 'triplet', tiles: [2, 2, 2] },
        { type: 'triplet', tiles: [9, 9, 9] },
      ],
      pair: 27,
    })
    const sequenceDecomp = standardDecomp({
      sets: [
        { type: 'sequence', tiles: [0, 1, 2] },
        { type: 'sequence', tiles: [0, 1, 2] },
        { type: 'sequence', tiles: [0, 1, 2] },
        { type: 'triplet', tiles: [9, 9, 9] },
      ],
      pair: 27,
    })
    // winningTile completes the shared 4th set, not the pair, isolating the
    // 对对胡 differential between the two readings.
    const result = bestFanResult([sequenceDecomp, allTripletsDecomp], {
      winningTile: 9,
      exposedMelds: [],
      flowersHeld: [],
      isMenqing: false,
      isSelfDraw: false,
    })
    expect(result.total).toBe(2) // picks 对对胡 over the plain sequence reading
  })

  it('returns a zero result when given no decompositions', () => {
    const result = bestFanResult([], {
      winningTile: 0,
      exposedMelds: [],
      flowersHeld: [],
      isMenqing: false,
      isSelfDraw: false,
    })
    expect(result).toEqual({ total: 0, breakdown: [] })
  })
})
