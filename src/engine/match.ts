import { DEFAULT_BASE_UNIT, DEFAULT_HANDS_PER_MATCH } from './constants'
import { dealNewHand } from './gameState'
import type { GameState, HandResult, PlayerIdx } from './types'

export interface MatchState {
  handsPlayed: number
  handsPerMatch: number
  baseUnit: number
  dealerIdx: PlayerIdx
  scores: [number, number, number, number]
  /** Seed for the *next* hand to be dealt; incremented each hand for determinism. */
  seedCounter: number
  game: GameState
}

export interface PayoutEntry {
  playerIdx: PlayerIdx
  delta: number
}

/**
 * points = fan总数 × baseUnit (屁胡: linear, no doubling).
 * Self-draw: the other 3 players each pay the winner one share.
 * Discard win: only the discarder pays, in full.
 */
export function computePayouts(result: HandResult, baseUnit: number): PayoutEntry[] {
  if (result.winnerIdx === null || !result.fanResult) return []
  const amount = result.fanResult.total * baseUnit
  const winner = result.winnerIdx

  if (result.isSelfDraw) {
    const payouts: PayoutEntry[] = []
    for (let i = 0; i < 4; i++) {
      if (i === winner) continue
      payouts.push({ playerIdx: i as PlayerIdx, delta: -amount })
    }
    payouts.push({ playerIdx: winner, delta: amount * 3 })
    return payouts
  }

  const discarder = result.discarderIdx as PlayerIdx
  return [
    { playerIdx: discarder, delta: -amount },
    { playerIdx: winner, delta: amount },
  ]
}

/** Dealer stays on a win or a draw game; rotates to the next seat on any loss. */
function nextDealer(current: PlayerIdx, result: HandResult): PlayerIdx {
  const isDraw = result.winnerIdx === null
  const dealerWon = result.winnerIdx === current
  if (isDraw || dealerWon) return current
  return ((current + 1) % 4) as PlayerIdx
}

export function startMatch(seed: number, baseUnit = DEFAULT_BASE_UNIT, handsPerMatch = DEFAULT_HANDS_PER_MATCH): MatchState {
  const dealerIdx: PlayerIdx = 0
  return {
    handsPlayed: 0,
    handsPerMatch,
    baseUnit,
    dealerIdx,
    scores: [0, 0, 0, 0],
    seedCounter: seed,
    game: dealNewHand(seed, dealerIdx),
  }
}

export function isMatchOver(match: MatchState): boolean {
  return match.handsPlayed >= match.handsPerMatch
}

/** Applies the just-finished hand's payout, rotates the dealer, and deals the next hand. */
export function onHandComplete(match: MatchState): MatchState {
  const result = match.game.handResult
  if (!result) throw new Error('cannot complete a hand that has not reached HAND_OVER')

  const scores = [...match.scores] as [number, number, number, number]
  for (const payout of computePayouts(result, match.baseUnit)) {
    scores[payout.playerIdx] += payout.delta
  }

  const dealerIdx = nextDealer(match.dealerIdx, result)
  const handsPlayed = match.handsPlayed + 1
  const seedCounter = match.seedCounter + 1
  const matchOver = handsPlayed >= match.handsPerMatch

  return {
    ...match,
    handsPlayed,
    dealerIdx,
    scores,
    seedCounter,
    game: matchOver ? match.game : dealNewHand(seedCounter, dealerIdx),
  }
}
