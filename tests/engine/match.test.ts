import { describe, expect, it } from 'vitest'
import { computePayouts, isMatchOver, onHandComplete, startMatch } from '../../src/engine/match'
import type { MatchState } from '../../src/engine/match'
import type { HandResult } from '../../src/engine/types'
import type { FanResult } from '../../src/engine/fan'

function fan(total: number): FanResult {
  return { total, breakdown: [{ name: 'test', fan: total }] }
}

function withHandResult(match: MatchState, result: HandResult): MatchState {
  return { ...match, game: { ...match.game, phase: 'HAND_OVER', handResult: result } }
}

describe('computePayouts', () => {
  it('self-draw: the other three each pay one share, winner collects three', () => {
    const result: HandResult = { winnerIdx: 1, isSelfDraw: true, discarderIdx: null, fanResult: fan(2), winningTile: 0 }
    const payouts = computePayouts(result, 10)
    expect(payouts).toEqual(
      expect.arrayContaining([
        { playerIdx: 0, delta: -20 },
        { playerIdx: 2, delta: -20 },
        { playerIdx: 3, delta: -20 },
        { playerIdx: 1, delta: 60 },
      ]),
    )
    expect(payouts.length).toBe(4)
  })

  it('discard win: only the discarder pays, in full, others untouched', () => {
    const result: HandResult = { winnerIdx: 2, isSelfDraw: false, discarderIdx: 3, fanResult: fan(3), winningTile: 0 }
    const payouts = computePayouts(result, 10)
    expect(payouts).toEqual([
      { playerIdx: 3, delta: -30 },
      { playerIdx: 2, delta: 30 },
    ])
  })

  it('draw game (流局): no payouts', () => {
    const result: HandResult = { winnerIdx: null, isSelfDraw: false, discarderIdx: null, fanResult: null, winningTile: null }
    expect(computePayouts(result, 10)).toEqual([])
  })
})

describe('dealer rotation', () => {
  it('dealer stays after winning', () => {
    let match = startMatch(1)
    match = withHandResult(match, { winnerIdx: 0, isSelfDraw: true, discarderIdx: null, fanResult: fan(1), winningTile: 0 })
    match = onHandComplete(match)
    expect(match.dealerIdx).toBe(0)
  })

  it('dealer stays after a draw game', () => {
    let match = startMatch(1)
    match = withHandResult(match, { winnerIdx: null, isSelfDraw: false, discarderIdx: null, fanResult: null, winningTile: null })
    match = onHandComplete(match)
    expect(match.dealerIdx).toBe(0)
  })

  it('dealer rotates to the next seat after losing', () => {
    let match = startMatch(1)
    match = withHandResult(match, { winnerIdx: 2, isSelfDraw: false, discarderIdx: 0, fanResult: fan(2), winningTile: 0 })
    match = onHandComplete(match)
    expect(match.dealerIdx).toBe(1)
  })
})

describe('score application', () => {
  it('applies the winning hand payout to the running scoreboard', () => {
    let match = startMatch(1)
    match = withHandResult(match, { winnerIdx: 1, isSelfDraw: true, discarderIdx: null, fanResult: fan(2), winningTile: 0 })
    match = onHandComplete(match)
    expect(match.scores).toEqual([-20, 60, -20, -20])
  })
})

describe('full scripted match', () => {
  it('reaches match-over after exactly handsPerMatch hands and deals a fresh hand between them', () => {
    let match = startMatch(42, 10, 4)
    expect(isMatchOver(match)).toBe(false)

    const results: HandResult[] = [
      { winnerIdx: 0, isSelfDraw: true, discarderIdx: null, fanResult: fan(1), winningTile: 0 }, // dealer wins, stays
      { winnerIdx: 2, isSelfDraw: false, discarderIdx: 0, fanResult: fan(2), winningTile: 0 }, // dealer loses, rotates 0->1
      { winnerIdx: null, isSelfDraw: false, discarderIdx: null, fanResult: null, winningTile: null }, // draw, dealer(1) stays
      { winnerIdx: 3, isSelfDraw: false, discarderIdx: 1, fanResult: fan(2), winningTile: 0 }, // dealer loses, rotates 1->2
    ]

    const dealerSequence: number[] = [match.dealerIdx]
    for (const result of results) {
      match = withHandResult(match, result)
      match = onHandComplete(match)
      dealerSequence.push(match.dealerIdx)
    }

    expect(dealerSequence).toEqual([0, 0, 1, 1, 2])
    expect(isMatchOver(match)).toBe(true)
    expect(match.handsPlayed).toBe(4)

    // hand1 self-draw, dealer(0) wins 1 fan * 10: others -10 each, dealer +30 -> [30,-10,-10,-10]
    // hand2 discard win (fan 2 * 10 = 20): player0 pays player2               -> [10,-10, 10,-10]
    // hand3 draw: no change                                                  -> [10,-10, 10,-10]
    // hand4 discard win (fan 2 * 10 = 20): player1 pays player3               -> [10,-30, 10, 10]
    expect(match.scores).toEqual([10, -30, 10, 10])
  })
})
