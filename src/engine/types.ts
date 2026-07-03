import type { FanResult } from './fan'

/** 34 playable tile kinds: 0-8 万, 9-17 条, 18-26 筒, 27-30 风(东南西北), 31-33 箭(中发白) */
export type TileKindId = number

/** 8 flower kinds: 0-3 春夏秋冬, 4-7 梅兰竹菊 */
export type FlowerKindId = number

export type SuitKind = 'wan' | 'tiao' | 'tong'

export interface TileInstance {
  /** Stable across the whole game — used as React key / animation tracking id. */
  id: string
  kindId: TileKindId | null
  flowerKindId: FlowerKindId | null
  isFlower: boolean
}

export type MeldType = 'chi' | 'peng' | 'gang'

export interface Meld {
  type: MeldType
  /** True only for an 暗杠 (self-declared concealed kong). chi/peng/minggang are always false. */
  concealed: boolean
  /** The kind ids forming this meld: 3 tiles for chi/peng, 4 for gang (all equal for peng/gang). */
  tiles: TileKindId[]
  /** Player index the tile was claimed from. Absent for ankan (no claim involved). */
  calledFromPlayerIdx?: number
}

export type DecompSetType = 'triplet' | 'sequence'

export interface DecompSet {
  type: DecompSetType
  tiles: [TileKindId, TileKindId, TileKindId]
}

export interface StandardWinDecomposition {
  kind: 'standard'
  /** Concealed sets found within the hand (excludes already-exposed melds). */
  sets: DecompSet[]
  pair: TileKindId
}

export interface KokushiWinDecomposition {
  kind: 'kokushi'
}

export type WinDecomposition = StandardWinDecomposition | KokushiWinDecomposition

export type PlayerIdx = 0 | 1 | 2 | 3

export interface PlayerState {
  hand: TileInstance[]
  exposedMelds: Meld[]
  discards: TileInstance[]
  flowers: FlowerKindId[]
  /** True until the player calls 吃/碰/明杠 on someone else's discard. 暗杠 does not clear it. */
  isMenqing: boolean
}

export type Phase = 'AWAITING_DRAW' | 'AWAITING_DISCARD' | 'REACTION_WINDOW' | 'HAND_OVER'

export interface DiscardInFlight {
  tile: TileInstance
  fromPlayerIdx: PlayerIdx
}

export type ReactionChoice = 'hu' | 'peng' | 'gang' | 'chi' | 'pass'

export interface PendingReaction {
  playerIdx: PlayerIdx
  choice: Exclude<ReactionChoice, 'pass'>
  /** Only present for 'chi': the two kind ids from hand pairing with the discard. */
  chiPartner?: [TileKindId, TileKindId]
}

export interface HandResult {
  /** null when the hand ended in a draw (流局). */
  winnerIdx: PlayerIdx | null
  isSelfDraw: boolean
  discarderIdx: PlayerIdx | null
  fanResult: FanResult | null
  winningTile: TileKindId | null
}

export interface GameState {
  phase: Phase
  wall: TileInstance[]
  deadWall: TileInstance[]
  players: [PlayerState, PlayerState, PlayerState, PlayerState]
  currentPlayerIdx: PlayerIdx
  dealerIdx: PlayerIdx
  discardInFlight: DiscardInFlight | null
  /** The tile the current player just drew — needed to offer self-hu/ankan/jiagang. */
  justDrawnTileId: string | null
  /** Player indices who still owe a REACT response during REACTION_WINDOW. */
  awaitingReactionFrom: PlayerIdx[]
  pendingReactions: PendingReaction[]
  handResult: HandResult | null
}

export type GameEvent =
  | { type: 'draw'; playerIdx: PlayerIdx; tileId: string; fromDeadWall: boolean }
  | { type: 'flowerRevealed'; playerIdx: PlayerIdx; flowerKindId: FlowerKindId }
  | { type: 'discard'; playerIdx: PlayerIdx; tileId: string }
  | { type: 'meld'; playerIdx: PlayerIdx; meld: Meld; claimedTileId: string | null }
  | { type: 'handOver'; result: HandResult }

export type Action =
  | { type: 'DRAW' }
  | { type: 'DISCARD'; tileId: string }
  | { type: 'SELF_HU' }
  | { type: 'ANKAN'; kindId: TileKindId }
  | { type: 'JIAGANG'; kindId: TileKindId }
  | { type: 'REACT'; playerIdx: PlayerIdx; choice: ReactionChoice; chiPartner?: [TileKindId, TileKindId] }

export interface LegalReactions {
  hu: boolean
  peng: boolean
  gang: boolean
  chi: boolean
  chiOptions: [TileKindId, TileKindId][]
}
