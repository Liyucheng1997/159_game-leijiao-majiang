import { FLOWER_KIND_COUNT, TILE_KIND_COUNT } from './constants'
import type { FlowerKindId, SuitKind, TileInstance, TileKindId } from './types'

export function isSuited(kindId: TileKindId): boolean {
  return kindId < 27
}

export function isHonor(kindId: TileKindId): boolean {
  return kindId >= 27
}

export function suitOf(kindId: TileKindId): SuitKind | null {
  if (kindId < 9) return 'wan'
  if (kindId < 18) return 'tiao'
  if (kindId < 27) return 'tong'
  return null
}

/** 1-9 for suited tiles, -1 for honors. */
export function rankOf(kindId: TileKindId): number {
  if (kindId >= 27) return -1
  return (kindId % 9) + 1
}

export function isTerminal(kindId: TileKindId): boolean {
  if (!isSuited(kindId)) return false
  const rank = rankOf(kindId)
  return rank === 1 || rank === 9
}

export function isTerminalOrHonor(kindId: TileKindId): boolean {
  return isTerminal(kindId) || isHonor(kindId)
}

export function buildDeck(): TileInstance[] {
  const tiles: TileInstance[] = []
  for (let kind = 0; kind < TILE_KIND_COUNT; kind++) {
    for (let copy = 0; copy < 4; copy++) {
      tiles.push({ id: `k${kind}-${copy}`, kindId: kind, flowerKindId: null, isFlower: false })
    }
  }
  for (let flower = 0; flower < FLOWER_KIND_COUNT; flower++) {
    tiles.push({ id: `f${flower}`, kindId: null, flowerKindId: flower as FlowerKindId, isFlower: true })
  }
  return tiles
}

/** Deterministic PRNG (mulberry32) so tests/replays can use a fixed seed. */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function countVectorFromKinds(kinds: TileKindId[]): number[] {
  const counts = new Array(TILE_KIND_COUNT).fill(0)
  for (const kind of kinds) counts[kind]++
  return counts
}

export function countVectorFromHand(hand: TileInstance[]): number[] {
  const counts = new Array(TILE_KIND_COUNT).fill(0)
  for (const tile of hand) {
    if (!tile.isFlower && tile.kindId !== null) counts[tile.kindId]++
  }
  return counts
}
