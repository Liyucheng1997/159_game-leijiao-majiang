import { describe, expect, it } from 'vitest'
import { decideAiDiscard, decideAiReaction } from '../../src/engine/ai'
import { applyAction, canDeclareSelfHu, listAnkanOptions, listJiagangOptions } from '../../src/engine/gameState'
import { startMatch } from '../../src/engine/match'
import { calcShanten } from '../../src/engine/shanten'
import { countVectorFromHand } from '../../src/engine/tiles'
import { findWinDecompositions } from '../../src/engine/winCheck'
import { TILE_KIND_COUNT } from '../../src/engine/constants'
import type { Action, GameState } from '../../src/engine/types'

function autoAction(state: GameState): Action | null {
  if (state.phase === 'AWAITING_DRAW') return { type: 'DRAW' }
  if (state.phase === 'AWAITING_DISCARD') {
    if (canDeclareSelfHu(state)) return { type: 'SELF_HU' }
    const ankan = listAnkanOptions(state)
    if (ankan.length > 0) return { type: 'ANKAN', kindId: ankan[0] }
    const jiagang = listJiagangOptions(state)
    if (jiagang.length > 0) return { type: 'JIAGANG', kindId: jiagang[0] }
    return { type: 'DISCARD', tileId: decideAiDiscard(state).id }
  }
  if (state.phase === 'REACTION_WINDOW') {
    const reactor = state.awaitingReactionFrom[0]
    if (reactor !== undefined) {
      const d = decideAiReaction(state, reactor)
      return { type: 'REACT', playerIdx: reactor, choice: d.choice, chiPartner: d.chiPartner }
    }
  }
  return null
}

describe('full-hand simulation', () => {
  it('reports outcomes over many seeds', () => {
    let wins = 0
    let draws = 0
    const finalShantens: number[] = []
    const realTenpai: number[] = []
    for (let seed = 1; seed <= 50; seed++) {
      let state = startMatch(seed).game
      let guard = 0
      while (state.phase !== 'HAND_OVER' && guard++ < 2000) {
        const action = autoAction(state)
        if (!action) throw new Error(`stuck in phase ${state.phase}`)
        state = applyAction(state, action).state
      }
      if (guard >= 2000) throw new Error('runaway hand')
      if (state.handResult?.winnerIdx != null) {
        wins++
      } else {
        draws++
        for (const p of state.players) {
          const counts = countVectorFromHand(p.hand)
          const shanten = calcShanten(counts, p.exposedMelds.length).shanten
          finalShantens.push(shanten)
          if (shanten === 0) {
            // 真听牌验证:是否存在某张牌能让 findWinDecompositions 认定和牌
            let winners = 0
            for (let k = 0; k < TILE_KIND_COUNT; k++) {
              if (counts[k] >= 4) continue
              const c2 = counts.slice()
              c2[k]++
              if (findWinDecompositions(c2, p.exposedMelds.length).length > 0) winners++
            }
            realTenpai.push(winners)
          }
        }
      }
    }
    const dist: Record<number, number> = {}
    for (const s of finalShantens) dist[s] = (dist[s] ?? 0) + 1
    const zeroWinners = realTenpai.filter((w) => w === 0).length
    console.log(
      `wins=${wins} draws=${draws} finalShantenDist=${JSON.stringify(dist)} ` +
        `tenpaiChecked=${realTenpai.length} fakeTenpai=${zeroWinners} avgWinners=${(realTenpai.reduce((a, b) => a + b, 0) / Math.max(1, realTenpai.length)).toFixed(2)}`,
    )
    // 回归保护:曾因 winCheck 无视副露导致 0 胜率、全流局(见 winCheck.ts setsNeeded)。
    expect(wins).toBeGreaterThan(10)
    // 流局时声称听牌的玩家必须真的有能胡的牌(向听数与判胡一致)。
    expect(zeroWinners).toBe(0)
  })
})
