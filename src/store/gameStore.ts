import { create } from 'zustand'
import { soundManager } from '../audio/soundManager'
import { decideAiDiscard, decideAiReaction } from '../engine/ai'
import { applyAction, canDeclareSelfHu, listAnkanOptions, listJiagangOptions } from '../engine/gameState'
import { onHandComplete, startMatch } from '../engine/match'
import type { MatchState } from '../engine/match'
import type { Action, GameEvent, GameState, PlayerIdx } from '../engine/types'

export const HUMAN_PLAYER_IDX: PlayerIdx = 0

/** Dev/demo mode (?auto): the AI also plays the human seat, so a full hand runs hands-free. */
const AUTO_PILOT = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('auto')

/** ?fast: near-instant AI turns, used with ?auto to fast-forward whole hands in dev. */
const FAST_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fast')
const AI_THINK_DELAY_MS = FAST_MODE ? 40 : 500
soundManager.throttleVoice = FAST_MODE

/** Optional deterministic seed (?seed=123) so a game can be replayed exactly. */
function initialSeed(): number {
  if (typeof window !== 'undefined') {
    const raw = new URLSearchParams(window.location.search).get('seed')
    if (raw !== null && Number.isFinite(Number(raw))) return Number(raw)
  }
  return Date.now()
}

/** What should happen next without any human input? null means we must wait for the UI. */
function computeAutoAction(state: GameState): Action | null {
  // Drawing is never a real decision (no legal alternative), so it auto-fires for
  // every seat including the human — only the discard/reaction/hu choices wait for input.
  if (state.phase === 'AWAITING_DRAW') {
    return { type: 'DRAW' }
  }
  if (state.phase === 'AWAITING_DISCARD' && (AUTO_PILOT || state.currentPlayerIdx !== HUMAN_PLAYER_IDX)) {
    if (canDeclareSelfHu(state)) return { type: 'SELF_HU' }
    const ankanOptions = listAnkanOptions(state)
    if (ankanOptions.length > 0) return { type: 'ANKAN', kindId: ankanOptions[0] }
    const jiagangOptions = listJiagangOptions(state)
    if (jiagangOptions.length > 0) return { type: 'JIAGANG', kindId: jiagangOptions[0] }
    return { type: 'DISCARD', tileId: decideAiDiscard(state).id }
  }
  if (state.phase === 'REACTION_WINDOW') {
    const aiReactor = state.awaitingReactionFrom.find((idx) => AUTO_PILOT || idx !== HUMAN_PLAYER_IDX)
    if (aiReactor !== undefined) {
      const decision = decideAiReaction(state, aiReactor)
      return { type: 'REACT', playerIdx: aiReactor, choice: decision.choice, chiPartner: decision.chiPartner }
    }
  }
  return null
}

export interface NewMatchOptions {
  seed?: number
  baseUnit?: number
  handsPerMatch?: number
}

export interface GameStore {
  match: MatchState
  lastEvents: GameEvent[]
  dispatch: (action: Action) => void
  startNewMatch: (options?: NewMatchOptions) => void
  advanceHand: () => void
}

export const useGameStore = create<GameStore>()((set, get) => {
  function runAutoLoop() {
    const state = get().match.game
    if (state.phase === 'HAND_OVER') return
    const auto = computeAutoAction(state)
    if (!auto) return
    const { state: nextState, events } = applyAction(state, auto)
    set((store) => ({ match: { ...store.match, game: nextState }, lastEvents: events }))
    soundManager.handleEvents(events)
    setTimeout(runAutoLoop, AI_THINK_DELAY_MS)
  }

  setTimeout(runAutoLoop, AI_THINK_DELAY_MS)

  return {
    match: startMatch(initialSeed()),
    lastEvents: [],
    dispatch: (action) => {
      const state = get().match.game
      const { state: nextState, events } = applyAction(state, action)
      set((store) => ({ match: { ...store.match, game: nextState }, lastEvents: events }))
      soundManager.handleEvents(events)
      setTimeout(runAutoLoop, AI_THINK_DELAY_MS)
    },
    startNewMatch: (options = {}) => {
      const { seed = Date.now(), baseUnit, handsPerMatch } = options
      set({ match: startMatch(seed, baseUnit, handsPerMatch), lastEvents: [] })
      setTimeout(runAutoLoop, AI_THINK_DELAY_MS)
    },
    advanceHand: () => {
      set((store) => ({ match: onHandComplete(store.match) }))
      setTimeout(runAutoLoop, AI_THINK_DELAY_MS)
    },
  }
})
