import { describe, expect, it } from 'vitest'
import { applyAction, canDeclareSelfHu, dealNewHand, getLegalReactions } from '../../src/engine/gameState'
import type { GameState, PlayerIdx, PlayerState, TileInstance } from '../../src/engine/types'

function tile(kindId: number, copy = 0): TileInstance {
  return { id: `k${kindId}-${copy}`, kindId, flowerKindId: null, isFlower: false }
}

function flower(flowerKindId: number): TileInstance {
  return { id: `f${flowerKindId}`, kindId: null, flowerKindId, isFlower: true }
}

function emptyPlayer(): PlayerState {
  return { hand: [], exposedMelds: [], discards: [], flowers: [], isMenqing: true }
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'AWAITING_DRAW',
    wall: [],
    deadWall: [],
    players: [emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer()],
    currentPlayerIdx: 0,
    dealerIdx: 0,
    discardInFlight: null,
    justDrawnTileId: null,
    awaitingReactionFrom: [],
    pendingReactions: [],
    handResult: null,
    ...overrides,
  }
}

describe('dealNewHand', () => {
  it('deals exactly 13 concealed tiles to every player and conserves all 144 tiles', () => {
    const state = dealNewHand(1234, 0)
    // Every player's concealed hand is exactly 13 non-flower tiles (flowers already replaced).
    for (const player of state.players) {
      expect(player.hand.every((t) => !t.isFlower)).toBe(true)
      expect(player.hand.length).toBe(13)
    }
    const total =
      state.wall.length +
      state.deadWall.length +
      state.players.reduce((sum, p) => sum + p.hand.length + p.flowers.length, 0)
    expect(total).toBe(144)
  })

  it('is deterministic for a given seed', () => {
    const a = dealNewHand(99, 1)
    const b = dealNewHand(99, 1)
    expect(a.players.map((p) => p.hand.map((t) => t.id))).toEqual(b.players.map((p) => p.hand.map((t) => t.id)))
  })

  it('sets the dealer as the current player, ready to draw', () => {
    const state = dealNewHand(5, 2)
    expect(state.currentPlayerIdx).toBe(2)
    expect(state.phase).toBe('AWAITING_DRAW')
  })
})

describe('flower replacement on draw', () => {
  it('auto-sets-aside a drawn flower and draws a replacement from the dead wall', () => {
    const state = baseState({
      wall: [flower(0), tile(1)],
      deadWall: [tile(5)],
    })
    const { state: next, events } = applyAction(state, { type: 'DRAW' })
    expect(next.players[0].flowers).toEqual([0])
    expect(next.players[0].hand.map((t) => t.id)).toEqual(['k5-0'])
    expect(next.justDrawnTileId).toBe('k5-0')
    expect(next.phase).toBe('AWAITING_DISCARD')
    expect(next.wall.map((t) => t.id)).toEqual(['k1-0']) // untouched, only the flower was popped from wall
    expect(next.deadWall).toEqual([])
    expect(events.filter((e) => e.type === 'flowerRevealed')).toHaveLength(1)
    expect(events.filter((e) => e.type === 'draw')).toHaveLength(1)
  })

  it('loops through two consecutive flowers before landing on a real tile', () => {
    const state = baseState({
      wall: [flower(0)],
      deadWall: [flower(1), tile(7)],
    })
    const { state: next, events } = applyAction(state, { type: 'DRAW' })
    expect(next.players[0].flowers.sort()).toEqual([0, 1])
    expect(next.players[0].hand.map((t) => t.id)).toEqual(['k7-0'])
    expect(events.filter((e) => e.type === 'flowerRevealed')).toHaveLength(2)
  })
})

describe('kong replacement draw', () => {
  it('ankan removes 4 concealed copies, exposes a concealed gang, and forces a replacement draw + discard', () => {
    const hand = [tile(0), tile(0, 1), tile(0, 2), tile(0, 3), tile(3), tile(4)]
    const state = baseState({
      phase: 'AWAITING_DISCARD',
      players: [{ ...emptyPlayer(), hand }, emptyPlayer(), emptyPlayer(), emptyPlayer()],
      deadWall: [tile(9)],
      justDrawnTileId: 'k4-0',
    })
    const { state: next, events } = applyAction(state, { type: 'ANKAN', kindId: 0 })
    expect(next.players[0].hand.some((t) => t.kindId === 0)).toBe(false)
    expect(next.players[0].exposedMelds).toEqual([{ type: 'gang', concealed: true, tiles: [0, 0, 0, 0] }])
    expect(next.players[0].isMenqing).toBe(true) // 暗杠 does not break 门清
    expect(next.justDrawnTileId).toBe('k9-0')
    expect(next.phase).toBe('AWAITING_DISCARD') // must discard again after the kong draw
    expect(events.some((e) => e.type === 'meld')).toBe(true)
    expect(events.some((e) => e.type === 'draw' && e.fromDeadWall === true)).toBe(true)
  })
})

describe('reaction priority: Hu > Peng/Gang > Chi', () => {
  function riggedDiscardState(): GameState {
    // Player 0 discards kind 12. Player 1 can Hu via 对对胡 (triplet 0, triplet 3,
    // triplet 6, triplet 12-with-the-discard, pair 9) = +2 fan, clears the discard-win
    // threshold. Player 2 can Peng the same discard. Player 3 has nothing relevant.
    const player1Hand = [tile(0), tile(0, 1), tile(0, 2), tile(3), tile(3, 1), tile(3, 2), tile(6), tile(6, 1), tile(6, 2), tile(9), tile(9, 1), tile(12), tile(12, 1)]
    const player2Hand = [tile(12, 2), tile(12, 3), tile(20), tile(21)]
    const player3Hand = [tile(15), tile(16)]
    const state = baseState({
      phase: 'AWAITING_DISCARD',
      currentPlayerIdx: 0,
      players: [
        { ...emptyPlayer(), hand: [tile(12, 3)] }, // irrelevant to the discarder's own hand contents here
        { ...emptyPlayer(), hand: player1Hand },
        { ...emptyPlayer(), hand: player2Hand },
        { ...emptyPlayer(), hand: player3Hand },
      ],
      justDrawnTileId: null,
    })
    return state
  }

  it('offers hu, peng, and no chi (player 2 is not the next seat) on the rigged discard', () => {
    const state = riggedDiscardState()
    const discardTile = tile(12, 9)
    const legalP1 = getLegalReactions(state, 1, discardTile, 0)
    const legalP2 = getLegalReactions(state, 2, discardTile, 0)
    expect(legalP1.hu).toBe(true)
    expect(legalP2.peng).toBe(true)
    expect(legalP2.chi).toBe(false)
  })

  it('resolves in favor of hu over peng regardless of dispatch order', () => {
    let state = riggedDiscardState()
    state = applyAction(state, { type: 'DISCARD', tileId: 'k12-3' }).state
    expect(state.phase).toBe('REACTION_WINDOW')
    expect(state.awaitingReactionFrom.sort()).toEqual([1, 2])

    // Dispatch the lower-priority reaction first to prove order doesn't matter.
    state = applyAction(state, { type: 'REACT', playerIdx: 2, choice: 'peng' }).state
    expect(state.phase).toBe('REACTION_WINDOW') // still waiting on player 1
    const final = applyAction(state, { type: 'REACT', playerIdx: 1, choice: 'hu' }).state

    expect(final.phase).toBe('HAND_OVER')
    expect(final.handResult?.winnerIdx).toBe(1)
    expect(final.handResult?.isSelfDraw).toBe(false)
    expect(final.handResult?.fanResult?.total).toBeGreaterThanOrEqual(2)
  })
})

describe('chi is restricted to the discarder’s next seat', () => {
  it('offers chi to the next player but not to a non-adjacent player holding the same tiles', () => {
    const discardTile = tile(5) // wan6 (index 5)
    const handWithNeighbors = [tile(4), tile(6)]
    const state = baseState({
      currentPlayerIdx: 0,
      players: [
        emptyPlayer(),
        { ...emptyPlayer(), hand: handWithNeighbors }, // seat 1 = next seat after discarder 0
        { ...emptyPlayer(), hand: handWithNeighbors }, // seat 2 = not adjacent
        emptyPlayer(),
      ],
    })
    const legalNext = getLegalReactions(state, 1 as PlayerIdx, discardTile, 0 as PlayerIdx)
    const legalNonAdjacent = getLegalReactions(state, 2 as PlayerIdx, discardTile, 0 as PlayerIdx)
    expect(legalNext.chi).toBe(true)
    expect(legalNonAdjacent.chi).toBe(false)
  })
})

describe('wall exhaustion', () => {
  it('ends the hand as a draw game (流局) when the wall is empty on draw', () => {
    const state = baseState({ phase: 'AWAITING_DRAW', wall: [], deadWall: [tile(0)] })
    const { state: next, events } = applyAction(state, { type: 'DRAW' })
    expect(next.phase).toBe('HAND_OVER')
    expect(next.handResult).toEqual({ winnerIdx: null, isSelfDraw: false, discarderIdx: null, fanResult: null, winningTile: null })
    expect(events).toEqual([{ type: 'handOver', result: next.handResult }])
  })
})

describe('self-draw win', () => {
  it('declares a self-draw win when the drawn tile completes the hand above the 1-fan threshold', () => {
    // Concealed, self-drawn: 123m 456m 789m 111tiao + 99tong pair, drawing the tile
    // that completes the pair -> 门清(1) + 自摸(1) + 单钓将(1) = 3 fan.
    const hand = [tile(0), tile(1), tile(2), tile(3), tile(4), tile(5), tile(6), tile(7), tile(8), tile(9), tile(9, 1), tile(9, 2), tile(26)]
    const state = baseState({
      phase: 'AWAITING_DISCARD',
      players: [{ ...emptyPlayer(), hand: [...hand, tile(26, 1)] }, emptyPlayer(), emptyPlayer(), emptyPlayer()],
      justDrawnTileId: 'k26-1',
    })
    const { state: next } = applyAction(state, { type: 'SELF_HU' })
    expect(next.phase).toBe('HAND_OVER')
    expect(next.handResult?.winnerIdx).toBe(0)
    expect(next.handResult?.isSelfDraw).toBe(true)
    expect(next.handResult?.fanResult?.total).toBe(3)
  })
})

describe('full hand playthrough (integration)', () => {
  it('plays an entire dealt hand to HAND_OVER via repeated draw/discard/pass without throwing', () => {
    let state: GameState = dealNewHand(777, 0)
    let guard = 0
    while (state.phase !== 'HAND_OVER' && guard < 1000) {
      guard++
      if (state.phase === 'AWAITING_DRAW') {
        state = applyAction(state, { type: 'DRAW' }).state
      } else if (state.phase === 'AWAITING_DISCARD') {
        if (canDeclareSelfHu(state)) {
          state = applyAction(state, { type: 'SELF_HU' }).state
          continue
        }
        const player = state.players[state.currentPlayerIdx]
        const tileToDiscard = player.hand[player.hand.length - 1]
        state = applyAction(state, { type: 'DISCARD', tileId: tileToDiscard.id }).state
      } else if (state.phase === 'REACTION_WINDOW') {
        const playerIdx = state.awaitingReactionFrom[0]
        state = applyAction(state, { type: 'REACT', playerIdx, choice: 'pass' }).state
      }
    }
    expect(guard).toBeLessThan(1000)
    expect(state.phase).toBe('HAND_OVER')
    expect(state.handResult).not.toBeNull()
  })

  it('completes cleanly across many different deals, exercising real peng/chi/hu opportunities along the way', () => {
    for (let seed = 1; seed <= 30; seed++) {
      let state: GameState = dealNewHand(seed, (seed % 4) as PlayerIdx)
      let guard = 0
      while (state.phase !== 'HAND_OVER' && guard < 1000) {
        guard++
        if (state.phase === 'AWAITING_DRAW') {
          state = applyAction(state, { type: 'DRAW' }).state
        } else if (state.phase === 'AWAITING_DISCARD') {
          if (canDeclareSelfHu(state)) {
            state = applyAction(state, { type: 'SELF_HU' }).state
            continue
          }
          const player = state.players[state.currentPlayerIdx]
          const tileToDiscard = player.hand[player.hand.length - 1]
          state = applyAction(state, { type: 'DISCARD', tileId: tileToDiscard.id }).state
        } else if (state.phase === 'REACTION_WINDOW') {
          const playerIdx = state.awaitingReactionFrom[0]
          state = applyAction(state, { type: 'REACT', playerIdx, choice: 'pass' }).state
        }
      }
      expect(guard, `seed ${seed} did not terminate`).toBeLessThan(1000)
      expect(state.phase, `seed ${seed}`).toBe('HAND_OVER')
    }
  })
})
