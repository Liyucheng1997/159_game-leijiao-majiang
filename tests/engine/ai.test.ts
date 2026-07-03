import { describe, expect, it } from 'vitest'
import { chooseDiscard, decideAiDiscard, decideAiReaction, shouldCallChi, shouldCallGang, shouldCallPeng } from '../../src/engine/ai'
import type { GameState, PlayerState, TileInstance } from '../../src/engine/types'

// Index reference: wan 0-8, tiao 9-17, tong 18-26, winds 27-30, dragons 31-33.

function tile(kindId: number, copy = 0): TileInstance {
  return { id: `k${kindId}-${copy}`, kindId, flowerKindId: null, isFlower: false }
}

function emptyPlayer(): PlayerState {
  return { hand: [], exposedMelds: [], discards: [], flowers: [], isMenqing: true }
}

describe('chooseDiscard', () => {
  it('discards an isolated honor tile rather than break a complete set', () => {
    // 123m 456m 789m 111tiao (4 complete sets) + two lone, unrelated honors.
    const hand = [
      tile(0), tile(1), tile(2), tile(3), tile(4), tile(5), tile(6), tile(7), tile(8),
      tile(9), tile(9, 1), tile(9, 2), tile(27), tile(30),
    ]
    const discard = chooseDiscard(hand, 0)
    expect([27, 30]).toContain(discard.kindId)
  })
})

describe('shouldCallPeng', () => {
  it('accepts when the peng completes the hand', () => {
    // pair(0,0) + pair(5,5) [tenpai on the 3rd 5 to triplet] + 3 complete sequences.
    const hand = [tile(0), tile(0, 1), tile(5), tile(5, 1), tile(9), tile(10), tile(11), tile(12), tile(13), tile(14), tile(15), tile(16), tile(17)]
    expect(shouldCallPeng(hand, 0, 5)).toBe(true)
  })
})

describe('shouldCallGang', () => {
  it('accepts when the gang does not worsen the resulting shanten', () => {
    // Same tenpai shape but with 3 concealed copies of 5, gang-ing the discarded 4th.
    const hand = [tile(0), tile(0, 1), tile(5), tile(5, 1), tile(5, 2), tile(9), tile(10), tile(11), tile(12), tile(13), tile(14), tile(15), tile(16)]
    expect(shouldCallGang(hand, 0, 5)).toBe(true)
  })
})

describe('shouldCallChi', () => {
  it('picks whichever sequence option yields the better shanten', () => {
    // Hand can chi a discarded "5m" (index 4) either as 3-4-5 (using 3m,4m) or 4-5-6
    // (using 4m,6m). Only the 3-4-5 reading completes a clean run alongside the rest.
    const hand = [tile(2), tile(3), tile(6), tile(9), tile(9, 1), tile(9, 2), tile(12), tile(13), tile(14), tile(18), tile(18, 1)]
    const options: [number, number][] = [
      [2, 3], // 3m,4m -> forms 3-4-5
      [3, 6], // 4m,6m -> forms 4-5-6 (leaves a lone 2m and 6m has no further support)
    ]
    const decision = shouldCallChi(hand, 0, options)
    expect(decision.accept).toBe(true)
    expect(decision.chosen).toEqual([2, 3])
  })

  it('rejects when there are no options at all', () => {
    expect(shouldCallChi([tile(0)], 0, []).accept).toBe(false)
  })
})

describe('decideAiReaction', () => {
  it('prefers hu over a simultaneously-legal peng on the same discard', () => {
    // Player 1: pair(9,9)+pair(3,3)? no — build a real hu opportunity: 对对胡 shape.
    const player1Hand = [tile(0), tile(0, 1), tile(0, 2), tile(3), tile(3, 1), tile(3, 2), tile(6), tile(6, 1), tile(6, 2), tile(9), tile(9, 1), tile(12), tile(12, 1)]
    const state: GameState = {
      phase: 'AWAITING_DISCARD',
      wall: [],
      deadWall: [],
      players: [
        { ...emptyPlayer(), hand: [tile(12, 3)] },
        { ...emptyPlayer(), hand: player1Hand }, // can hu on kind 12 via 对对胡
        emptyPlayer(),
        emptyPlayer(),
      ],
      currentPlayerIdx: 0,
      dealerIdx: 0,
      discardInFlight: { tile: tile(12, 9), fromPlayerIdx: 0 },
      justDrawnTileId: null,
      awaitingReactionFrom: [1],
      pendingReactions: [],
      handResult: null,
    }
    const decision = decideAiReaction(state, 1)
    expect(decision.choice).toBe('hu')
  })
})

describe('decideAiDiscard', () => {
  it('discards from the current player’s hand using the same shanten heuristic', () => {
    const hand = [
      tile(0), tile(1), tile(2), tile(3), tile(4), tile(5), tile(6), tile(7), tile(8),
      tile(9), tile(9, 1), tile(9, 2), tile(27), tile(30),
    ]
    const state: GameState = {
      phase: 'AWAITING_DISCARD',
      wall: [],
      deadWall: [],
      players: [emptyPlayer(), { ...emptyPlayer(), hand }, emptyPlayer(), emptyPlayer()],
      currentPlayerIdx: 1,
      dealerIdx: 0,
      discardInFlight: null,
      justDrawnTileId: null,
      awaitingReactionFrom: [],
      pendingReactions: [],
      handResult: null,
    }
    const discard = decideAiDiscard(state)
    expect([27, 30]).toContain(discard.kindId)
  })
})
