import { DEAD_WALL_SIZE, HAND_SIZE } from './constants'
import { bestFanResult, canDeclareHu } from './fan'
import { buildDeck, countVectorFromHand, createSeededRng, shuffle } from './tiles'
import { findWinDecompositions } from './winCheck'
import type {
  Action,
  DiscardInFlight,
  GameEvent,
  GameState,
  HandResult,
  LegalReactions,
  Meld,
  PendingReaction,
  PlayerIdx,
  PlayerState,
  TileInstance,
  TileKindId,
} from './types'

export interface ActionResult {
  state: GameState
  events: GameEvent[]
}

function otherPlayers(playerIdx: PlayerIdx): PlayerIdx[] {
  return [0, 1, 2, 3].filter((i) => i !== playerIdx) as PlayerIdx[]
}

function nextSeat(playerIdx: PlayerIdx): PlayerIdx {
  return (((playerIdx + 1) % 4) as PlayerIdx)
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    wall: [...state.wall],
    deadWall: [...state.deadWall],
    players: state.players.map((p) => ({
      hand: [...p.hand],
      exposedMelds: p.exposedMelds.map((m) => ({ ...m, tiles: [...m.tiles] })),
      discards: [...p.discards],
      flowers: [...p.flowers],
      isMenqing: p.isMenqing,
    })) as [PlayerState, PlayerState, PlayerState, PlayerState],
    discardInFlight: state.discardInFlight ? { ...state.discardInFlight, tile: { ...state.discardInFlight.tile } } : null,
    awaitingReactionFrom: [...state.awaitingReactionFrom],
    pendingReactions: state.pendingReactions.map((r) => ({ ...r })),
    handResult: state.handResult ? { ...state.handResult } : null,
  }
}

/** Builds a freshly-shuffled, freshly-dealt hand. Deterministic for a given seed. */
export function dealNewHand(seed: number, dealerIdx: PlayerIdx): GameState {
  const deck = shuffle(buildDeck(), createSeededRng(seed))
  const deadWall = deck.slice(0, DEAD_WALL_SIZE)
  const wall = deck.slice(DEAD_WALL_SIZE)
  const players: PlayerState[] = [0, 1, 2, 3].map(() => ({
    hand: [],
    exposedMelds: [],
    discards: [],
    flowers: [],
    isMenqing: true,
  }))

  function drawOne(fromDeadWall: boolean): TileInstance {
    const source = fromDeadWall ? deadWall : wall
    const tile = source.shift()
    if (!tile) throw new Error('deck exhausted during deal — should never happen with a full 144-tile deck')
    return tile
  }

  for (let round = 0; round < HAND_SIZE; round++) {
    for (let seat = 0; seat < 4; seat++) {
      const playerIdx = (dealerIdx + seat) % 4
      let tile = drawOne(false)
      while (tile.isFlower) {
        players[playerIdx].flowers.push(tile.flowerKindId as number)
        tile = drawOne(true)
      }
      players[playerIdx].hand.push(tile)
    }
  }

  return {
    phase: 'AWAITING_DRAW',
    wall,
    deadWall,
    players: players as [PlayerState, PlayerState, PlayerState, PlayerState],
    currentPlayerIdx: dealerIdx,
    dealerIdx,
    discardInFlight: null,
    justDrawnTileId: null,
    awaitingReactionFrom: [],
    pendingReactions: [],
    handResult: null,
  }
}

export function getLegalReactions(state: GameState, playerIdx: PlayerIdx, discardTile: TileInstance, discarderIdx: PlayerIdx): LegalReactions {
  const player = state.players[playerIdx]
  const kindId = discardTile.kindId as TileKindId
  const counts = countVectorFromHand(player.hand)

  const huCounts = counts.slice()
  huCounts[kindId]++
  const decomps = findWinDecompositions(huCounts, player.exposedMelds.length)
  const fanResult = bestFanResult(decomps, {
    winningTile: kindId,
    exposedMelds: player.exposedMelds,
    flowersHeld: player.flowers,
    isMenqing: player.isMenqing,
    isSelfDraw: false,
  })
  const hu = decomps.length > 0 && canDeclareHu(fanResult.total, false)

  const peng = counts[kindId] >= 2
  const gang = counts[kindId] >= 3

  let chi = false
  const chiOptions: [TileKindId, TileKindId][] = []
  if (playerIdx === nextSeat(discarderIdx) && kindId < 27) {
    const rank = kindId % 9
    const suitBase = kindId - rank
    const candidates: [number, number][] = []
    if (rank >= 2) candidates.push([kindId - 2, kindId - 1])
    if (rank >= 1 && rank <= 7) candidates.push([kindId - 1, kindId + 1])
    if (rank <= 6) candidates.push([kindId + 1, kindId + 2])
    for (const [a, b] of candidates) {
      if (a >= suitBase && b <= suitBase + 8 && counts[a] > 0 && counts[b] > 0) {
        chi = true
        chiOptions.push([a, b])
      }
    }
  }

  return { hu, peng, gang, chi, chiOptions }
}

/** Can the current player declare self-hu on the tile they just drew? */
export function canDeclareSelfHu(state: GameState): boolean {
  if (state.phase !== 'AWAITING_DISCARD' || !state.justDrawnTileId) return false
  const player = state.players[state.currentPlayerIdx]
  const drawnTile = player.hand.find((t) => t.id === state.justDrawnTileId)
  if (!drawnTile) return false
  const counts = countVectorFromHand(player.hand)
  const decomps = findWinDecompositions(counts, player.exposedMelds.length)
  if (decomps.length === 0) return false
  const fanResult = bestFanResult(decomps, {
    winningTile: drawnTile.kindId as TileKindId,
    exposedMelds: player.exposedMelds,
    flowersHeld: player.flowers,
    isMenqing: player.isMenqing,
    isSelfDraw: true,
  })
  return canDeclareHu(fanResult.total, true)
}

/** Kinds the current player could declare an 暗杠 (concealed kong) on right now. */
export function listAnkanOptions(state: GameState): TileKindId[] {
  if (state.phase !== 'AWAITING_DISCARD') return []
  const player = state.players[state.currentPlayerIdx]
  const counts = countVectorFromHand(player.hand)
  const options: TileKindId[] = []
  counts.forEach((count, kindId) => {
    if (count === 4) options.push(kindId)
  })
  return options
}

/** Kinds the current player could upgrade an existing 碰 into a 加杠 (exposed kong) right now. */
export function listJiagangOptions(state: GameState): TileKindId[] {
  if (state.phase !== 'AWAITING_DISCARD') return []
  const player = state.players[state.currentPlayerIdx]
  const pengKinds = new Set(player.exposedMelds.filter((m) => m.type === 'peng').map((m) => m.tiles[0]))
  const options: TileKindId[] = []
  for (const tile of player.hand) {
    if (tile.kindId !== null && pengKinds.has(tile.kindId) && !options.includes(tile.kindId)) {
      options.push(tile.kindId)
    }
  }
  return options
}

function computeLegalReactors(state: GameState, discarderIdx: PlayerIdx, tile: TileInstance): PlayerIdx[] {
  return otherPlayers(discarderIdx).filter((i) => {
    const legal = getLegalReactions(state, i, tile, discarderIdx)
    return legal.hu || legal.peng || legal.gang || legal.chi
  })
}

function endHandAsDraw(state: GameState, events: GameEvent[]): ActionResult {
  const result: HandResult = { winnerIdx: null, isSelfDraw: false, discarderIdx: null, fanResult: null, winningTile: null }
  state.phase = 'HAND_OVER'
  state.handResult = result
  events.push({ type: 'handOver', result })
  return { state, events }
}

/**
 * Draws one tile for the current player, transparently looping through any
 * flower replacements (which always come from the dead wall). `initialFromDeadWall`
 * is true for kong-replacement draws and false for a normal turn draw.
 */
function drawForCurrentPlayer(state: GameState, events: GameEvent[], initialFromDeadWall: boolean): ActionResult {
  const playerIdx = state.currentPlayerIdx
  const player = state.players[playerIdx]
  let pullFromDeadWall = initialFromDeadWall

  for (;;) {
    const source = pullFromDeadWall ? state.deadWall : state.wall
    if (source.length === 0) return endHandAsDraw(state, events)
    const tile = source.shift() as TileInstance

    if (tile.isFlower) {
      player.flowers.push(tile.flowerKindId as number)
      events.push({ type: 'flowerRevealed', playerIdx, flowerKindId: tile.flowerKindId as number })
      pullFromDeadWall = true
      continue
    }

    player.hand.push(tile)
    state.justDrawnTileId = tile.id
    state.phase = 'AWAITING_DISCARD'
    events.push({ type: 'draw', playerIdx, tileId: tile.id, fromDeadWall: pullFromDeadWall })
    return { state, events }
  }
}

function advanceTurnAfterDiscard(state: GameState, events: GameEvent[], discarderIdx: PlayerIdx, tile: TileInstance): ActionResult {
  state.players[discarderIdx].discards.push(tile)
  state.discardInFlight = null
  state.currentPlayerIdx = nextSeat(discarderIdx)
  state.phase = 'AWAITING_DRAW'
  return { state, events }
}

function removeNCopiesFromHand(hand: TileInstance[], kindId: TileKindId, n: number): void {
  let removed = 0
  for (let i = hand.length - 1; i >= 0 && removed < n; i--) {
    if (hand[i].kindId === kindId) {
      hand.splice(i, 1)
      removed++
    }
  }
  if (removed < n) throw new Error(`not enough copies of kind ${kindId} in hand to remove ${n}`)
}

function applyDiscardWin(state: GameState, events: GameEvent[], winnerIdx: PlayerIdx, discarderIdx: PlayerIdx, tile: TileInstance): ActionResult {
  const winner = state.players[winnerIdx]
  const kindId = tile.kindId as TileKindId
  const counts = countVectorFromHand(winner.hand)
  counts[kindId]++
  const decomps = findWinDecompositions(counts, winner.exposedMelds.length)
  const fanResult = bestFanResult(decomps, {
    winningTile: kindId,
    exposedMelds: winner.exposedMelds,
    flowersHeld: winner.flowers,
    isMenqing: winner.isMenqing,
    isSelfDraw: false,
  })
  if (decomps.length === 0 || !canDeclareHu(fanResult.total, false)) {
    throw new Error('illegal discard-hu: hand does not meet the fan threshold')
  }
  const result: HandResult = { winnerIdx, isSelfDraw: false, discarderIdx, fanResult, winningTile: kindId }
  state.phase = 'HAND_OVER'
  state.discardInFlight = null
  state.handResult = result
  events.push({ type: 'handOver', result })
  return { state, events }
}

function applyMeldClaim(
  state: GameState,
  events: GameEvent[],
  claimantIdx: PlayerIdx,
  fromPlayerIdx: PlayerIdx,
  tile: TileInstance,
  type: 'peng' | 'gang' | 'chi',
  chiPartner?: [TileKindId, TileKindId],
): ActionResult {
  const claimant = state.players[claimantIdx]
  const kindId = tile.kindId as TileKindId
  let meld: Meld

  if (type === 'peng') {
    removeNCopiesFromHand(claimant.hand, kindId, 2)
    meld = { type: 'peng', concealed: false, tiles: [kindId, kindId, kindId], calledFromPlayerIdx: fromPlayerIdx }
  } else if (type === 'gang') {
    removeNCopiesFromHand(claimant.hand, kindId, 3)
    meld = { type: 'gang', concealed: false, tiles: [kindId, kindId, kindId, kindId], calledFromPlayerIdx: fromPlayerIdx }
  } else {
    if (!chiPartner) throw new Error('chi requires two partner tile kinds')
    for (const partnerKind of chiPartner) {
      const idx = claimant.hand.findIndex((t) => t.kindId === partnerKind)
      if (idx === -1) throw new Error(`missing chi partner tile (kind ${partnerKind}) in hand`)
      claimant.hand.splice(idx, 1)
    }
    const seqTiles = [kindId, ...chiPartner].sort((a, b) => a - b) as [number, number, number]
    meld = { type: 'chi', concealed: false, tiles: seqTiles, calledFromPlayerIdx: fromPlayerIdx }
  }

  claimant.exposedMelds.push(meld)
  claimant.isMenqing = false
  events.push({ type: 'meld', playerIdx: claimantIdx, meld, claimedTileId: tile.id })

  state.discardInFlight = null
  state.currentPlayerIdx = claimantIdx
  state.justDrawnTileId = null

  if (type === 'gang') return drawForCurrentPlayer(state, events, true)

  state.phase = 'AWAITING_DISCARD'
  return { state, events }
}

/** Among tied-priority reactors, the one nearest the discarder in turn order goes first. */
function pickNearestInTurnOrder(candidates: PlayerIdx[], fromIdx: PlayerIdx): PlayerIdx {
  return candidates.reduce((best, candidate) => {
    const distCandidate = (candidate - fromIdx + 4) % 4
    const distBest = (best - fromIdx + 4) % 4
    return distCandidate < distBest ? candidate : best
  })
}

function resolveReactionWindow(state: GameState, events: GameEvent[]): ActionResult {
  const inFlight = state.discardInFlight as DiscardInFlight
  const { tile, fromPlayerIdx } = inFlight

  const huReactions = state.pendingReactions.filter((r) => r.choice === 'hu')
  if (huReactions.length > 0) {
    const winnerIdx = pickNearestInTurnOrder(huReactions.map((r) => r.playerIdx), fromPlayerIdx)
    return applyDiscardWin(state, events, winnerIdx, fromPlayerIdx, tile)
  }

  const pengGangReactions = state.pendingReactions.filter((r) => r.choice === 'peng' || r.choice === 'gang')
  if (pengGangReactions.length > 0) {
    const winnerIdx = pickNearestInTurnOrder(pengGangReactions.map((r) => r.playerIdx), fromPlayerIdx)
    const reaction = pengGangReactions.find((r) => r.playerIdx === winnerIdx) as PendingReaction
    return applyMeldClaim(state, events, winnerIdx, fromPlayerIdx, tile, reaction.choice as 'peng' | 'gang')
  }

  const chiReaction = state.pendingReactions.find((r) => r.choice === 'chi')
  if (chiReaction) {
    return applyMeldClaim(state, events, chiReaction.playerIdx, fromPlayerIdx, tile, 'chi', chiReaction.chiPartner)
  }

  return advanceTurnAfterDiscard(state, events, fromPlayerIdx, tile)
}

function handleDraw(state: GameState, events: GameEvent[]): ActionResult {
  if (state.phase !== 'AWAITING_DRAW') throw new Error('cannot draw outside of AWAITING_DRAW')
  return drawForCurrentPlayer(state, events, false)
}

function handleDiscard(state: GameState, events: GameEvent[], tileId: string): ActionResult {
  if (state.phase !== 'AWAITING_DISCARD') throw new Error('cannot discard outside of AWAITING_DISCARD')
  const playerIdx = state.currentPlayerIdx
  const player = state.players[playerIdx]
  const idx = player.hand.findIndex((t) => t.id === tileId)
  if (idx === -1) throw new Error('tile not in current player hand')
  const [tile] = player.hand.splice(idx, 1)
  state.justDrawnTileId = null

  events.push({ type: 'discard', playerIdx, tileId: tile.id })

  const reactors = computeLegalReactors(state, playerIdx, tile)
  if (reactors.length === 0) {
    return advanceTurnAfterDiscard(state, events, playerIdx, tile)
  }
  state.phase = 'REACTION_WINDOW'
  state.discardInFlight = { tile, fromPlayerIdx: playerIdx }
  state.awaitingReactionFrom = reactors
  state.pendingReactions = []
  return { state, events }
}

function handleSelfHu(state: GameState, events: GameEvent[]): ActionResult {
  if (!canDeclareSelfHu(state)) throw new Error('illegal self-hu')
  const playerIdx = state.currentPlayerIdx
  const player = state.players[playerIdx]
  const drawnTile = player.hand.find((t) => t.id === state.justDrawnTileId) as TileInstance
  const counts = countVectorFromHand(player.hand)
  const decomps = findWinDecompositions(counts, player.exposedMelds.length)
  const fanResult = bestFanResult(decomps, {
    winningTile: drawnTile.kindId as TileKindId,
    exposedMelds: player.exposedMelds,
    flowersHeld: player.flowers,
    isMenqing: player.isMenqing,
    isSelfDraw: true,
  })
  const result: HandResult = { winnerIdx: playerIdx, isSelfDraw: true, discarderIdx: null, fanResult, winningTile: drawnTile.kindId }
  state.phase = 'HAND_OVER'
  state.handResult = result
  events.push({ type: 'handOver', result })
  return { state, events }
}

function handleAnkan(state: GameState, events: GameEvent[], kindId: TileKindId): ActionResult {
  if (state.phase !== 'AWAITING_DISCARD') throw new Error('cannot ankan outside of AWAITING_DISCARD')
  const player = state.players[state.currentPlayerIdx]
  const matching = player.hand.filter((t) => t.kindId === kindId)
  if (matching.length !== 4) throw new Error('need exactly 4 concealed copies to declare ankan')
  player.hand = player.hand.filter((t) => t.kindId !== kindId)
  const meld: Meld = { type: 'gang', concealed: true, tiles: [kindId, kindId, kindId, kindId] }
  player.exposedMelds.push(meld)
  events.push({ type: 'meld', playerIdx: state.currentPlayerIdx, meld, claimedTileId: null })
  state.justDrawnTileId = null
  return drawForCurrentPlayer(state, events, true)
}

function handleJiagang(state: GameState, events: GameEvent[], kindId: TileKindId): ActionResult {
  if (state.phase !== 'AWAITING_DISCARD') throw new Error('cannot jiagang outside of AWAITING_DISCARD')
  const player = state.players[state.currentPlayerIdx]
  const pengIdx = player.exposedMelds.findIndex((m) => m.type === 'peng' && m.tiles[0] === kindId)
  if (pengIdx === -1) throw new Error('no matching 碰 to upgrade into 加杠')
  const tileIdx = player.hand.findIndex((t) => t.kindId === kindId)
  if (tileIdx === -1) throw new Error('missing matching tile in hand for jiagang')
  player.hand.splice(tileIdx, 1)
  const oldMeld = player.exposedMelds[pengIdx]
  const meld: Meld = { type: 'gang', concealed: false, tiles: [kindId, kindId, kindId, kindId], calledFromPlayerIdx: oldMeld.calledFromPlayerIdx }
  player.exposedMelds[pengIdx] = meld
  events.push({ type: 'meld', playerIdx: state.currentPlayerIdx, meld, claimedTileId: null })
  state.justDrawnTileId = null
  return drawForCurrentPlayer(state, events, true)
}

function handleReact(state: GameState, events: GameEvent[], action: Extract<Action, { type: 'REACT' }>): ActionResult {
  if (state.phase !== 'REACTION_WINDOW') throw new Error('not currently in a reaction window')
  if (!state.awaitingReactionFrom.includes(action.playerIdx)) throw new Error('player is not eligible to react right now')

  state.awaitingReactionFrom = state.awaitingReactionFrom.filter((i) => i !== action.playerIdx)
  if (action.choice !== 'pass') {
    state.pendingReactions.push({ playerIdx: action.playerIdx, choice: action.choice, chiPartner: action.chiPartner })
  }

  if (state.awaitingReactionFrom.length > 0) return { state, events }
  return resolveReactionWindow(state, events)
}

/**
 * Pure reducer: applies one Action to a GameState and returns the resulting
 * state plus a log of events for the render layer to animate. Never mutates
 * the input state. Throws on illegal actions — callers (store/UI/AI) are
 * expected to only dispatch actions that pass the relevant legality check.
 */
export function applyAction(state: GameState, action: Action): ActionResult {
  const draft = cloneState(state)
  const events: GameEvent[] = []
  switch (action.type) {
    case 'DRAW':
      return handleDraw(draft, events)
    case 'DISCARD':
      return handleDiscard(draft, events, action.tileId)
    case 'SELF_HU':
      return handleSelfHu(draft, events)
    case 'ANKAN':
      return handleAnkan(draft, events, action.kindId)
    case 'JIAGANG':
      return handleJiagang(draft, events, action.kindId)
    case 'REACT':
      return handleReact(draft, events, action)
  }
}
