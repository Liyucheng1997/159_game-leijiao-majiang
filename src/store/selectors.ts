import { canDeclareSelfHu, getLegalReactions, listAnkanOptions, listJiagangOptions } from '../engine/gameState'
import type { GameState, LegalReactions } from '../engine/types'
import { HUMAN_PLAYER_IDX } from './gameStore'

/** The human's legal reaction to the in-flight discard, or null if it's not their turn to react. */
export function selectHumanLegalReactions(state: GameState): LegalReactions | null {
  if (state.phase !== 'REACTION_WINDOW' || !state.discardInFlight) return null
  if (!state.awaitingReactionFrom.includes(HUMAN_PLAYER_IDX)) return null
  return getLegalReactions(state, HUMAN_PLAYER_IDX, state.discardInFlight.tile, state.discardInFlight.fromPlayerIdx)
}

export interface HumanTurnOptions {
  canSelfHu: boolean
  ankanOptions: number[]
  jiagangOptions: number[]
}

/** What the human may declare on their own turn (self-hu / ankan / jiagang) beyond a plain discard. */
export function selectHumanTurnOptions(state: GameState): HumanTurnOptions {
  if (state.phase !== 'AWAITING_DISCARD' || state.currentPlayerIdx !== HUMAN_PLAYER_IDX) {
    return { canSelfHu: false, ankanOptions: [], jiagangOptions: [] }
  }
  return {
    canSelfHu: canDeclareSelfHu(state),
    ankanOptions: listAnkanOptions(state),
    jiagangOptions: listJiagangOptions(state),
  }
}

export function selectIsHumanDiscardTurn(state: GameState): boolean {
  return state.phase === 'AWAITING_DISCARD' && state.currentPlayerIdx === HUMAN_PLAYER_IDX
}
