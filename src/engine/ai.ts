import { calcShanten } from './shanten'
import { countVectorFromHand, isTerminalOrHonor } from './tiles'
import { getLegalReactions } from './gameState'
import type { GameState, PlayerIdx, ReactionChoice, TileInstance, TileKindId } from './types'

function shantenOf(hand: TileInstance[], meldsExposed: number): number {
  return calcShanten(countVectorFromHand(hand), meldsExposed).shanten
}

function removeNCopies(hand: TileInstance[], kindId: TileKindId, n: number): TileInstance[] {
  const result = [...hand]
  let removed = 0
  for (let i = result.length - 1; i >= 0 && removed < n; i--) {
    if (result[i].kindId === kindId) {
      result.splice(i, 1)
      removed++
    }
  }
  return result
}

function removeSpecificKinds(hand: TileInstance[], kinds: [TileKindId, TileKindId]): TileInstance[] {
  const result = [...hand]
  for (const kindId of kinds) {
    const idx = result.findIndex((t) => t.kindId === kindId)
    if (idx !== -1) result.splice(idx, 1)
  }
  return result
}

/**
 * Which tile to discard: the one that minimizes the resulting 13-tile shanten.
 * Ties are broken in favor of an isolated terminal/honor tile (lowest future risk).
 */
export function chooseDiscard(hand: TileInstance[], meldsExposed: number): TileInstance {
  let bestShanten = Infinity
  let candidates: TileInstance[] = []
  for (const tile of hand) {
    const remaining = hand.filter((t) => t.id !== tile.id)
    const shanten = shantenOf(remaining, meldsExposed)
    if (shanten < bestShanten) {
      bestShanten = shanten
      candidates = [tile]
    } else if (shanten === bestShanten) {
      candidates.push(tile)
    }
  }
  const isolated = candidates.filter(
    (t) => t.kindId !== null && isTerminalOrHonor(t.kindId) && hand.filter((h) => h.kindId === t.kindId).length === 1,
  )
  const pool = isolated.length > 0 ? isolated : candidates
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Accept a peng/gang/chi only if it doesn't make the resulting hand's shanten worse. */
export function shouldCallPeng(hand: TileInstance[], meldsExposed: number, kindId: TileKindId): boolean {
  const before = shantenOf(hand, meldsExposed)
  const after = shantenOf(removeNCopies(hand, kindId, 2), meldsExposed + 1)
  return after <= before
}

export function shouldCallGang(hand: TileInstance[], meldsExposed: number, kindId: TileKindId): boolean {
  const before = shantenOf(hand, meldsExposed)
  const after = shantenOf(removeNCopies(hand, kindId, 3), meldsExposed + 1)
  return after <= before
}

export interface ChiDecision {
  accept: boolean
  chosen?: [TileKindId, TileKindId]
}

export function shouldCallChi(hand: TileInstance[], meldsExposed: number, options: [TileKindId, TileKindId][]): ChiDecision {
  if (options.length === 0) return { accept: false }
  const before = shantenOf(hand, meldsExposed)
  let best: { after: number; option: [TileKindId, TileKindId] } | null = null
  for (const option of options) {
    const after = shantenOf(removeSpecificKinds(hand, option), meldsExposed + 1)
    if (!best || after < best.after) best = { after, option }
  }
  return { accept: (best as { after: number }).after <= before, chosen: (best as { option: [TileKindId, TileKindId] }).option }
}

export interface AiReactionDecision {
  choice: ReactionChoice
  chiPartner?: [TileKindId, TileKindId]
}

/** Full reaction decision for playerIdx against the currently in-flight discard. */
export function decideAiReaction(state: GameState, playerIdx: PlayerIdx): AiReactionDecision {
  const inFlight = state.discardInFlight
  if (!inFlight) throw new Error('no discard in flight to react to')
  const legal = getLegalReactions(state, playerIdx, inFlight.tile, inFlight.fromPlayerIdx)
  if (legal.hu) return { choice: 'hu' }

  const player = state.players[playerIdx]
  const kindId = inFlight.tile.kindId as TileKindId
  const meldsExposed = player.exposedMelds.length

  if (legal.gang && shouldCallGang(player.hand, meldsExposed, kindId)) return { choice: 'gang' }
  if (legal.peng && shouldCallPeng(player.hand, meldsExposed, kindId)) return { choice: 'peng' }
  if (legal.chi) {
    const decision = shouldCallChi(player.hand, meldsExposed, legal.chiOptions)
    if (decision.accept && decision.chosen) return { choice: 'chi', chiPartner: decision.chosen }
  }
  return { choice: 'pass' }
}

/** Which tile the current player (an AI) should discard on their own turn. */
export function decideAiDiscard(state: GameState): TileInstance {
  const player = state.players[state.currentPlayerIdx]
  return chooseDiscard(player.hand, player.exposedMelds.length)
}
