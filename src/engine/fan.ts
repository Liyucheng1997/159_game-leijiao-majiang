import { DISCARD_WIN_MIN_FAN, MAX_FAN, SELF_DRAW_MIN_FAN } from './constants'
import { isHonor, suitOf } from './tiles'
import type { FlowerKindId, Meld, TileKindId, WinDecomposition } from './types'

export interface FanContext {
  decomposition: WinDecomposition
  /** The tile that completed the hand (drawn or claimed from a discard). */
  winningTile: TileKindId
  exposedMelds: Meld[]
  flowersHeld: FlowerKindId[]
  isMenqing: boolean
  isSelfDraw: boolean
}

export interface FanBreakdownEntry {
  name: string
  fan: number
}

export interface FanResult {
  total: number
  breakdown: FanBreakdownEntry[]
}

interface FanRule {
  name: string
  evaluate: (ctx: FanContext) => number
}

function isAllTriplets(ctx: FanContext): boolean {
  if (ctx.decomposition.kind !== 'standard') return false
  const concealedAllTriplets = ctx.decomposition.sets.every((s) => s.type === 'triplet')
  const exposedAllTriplets = ctx.exposedMelds.every((m) => m.type === 'peng' || m.type === 'gang')
  return concealedAllTriplets && exposedAllTriplets
}

function isPureOneSuit(ctx: FanContext): boolean {
  if (ctx.decomposition.kind !== 'standard') return false
  const kinds: TileKindId[] = [
    ...ctx.decomposition.sets.flatMap((s) => s.tiles),
    ctx.decomposition.pair,
    ...ctx.exposedMelds.flatMap((m) => m.tiles),
  ]
  if (kinds.some(isHonor)) return false
  const suits = new Set(kinds.map(suitOf))
  return suits.size === 1
}

function isSingleWait(ctx: FanContext): boolean {
  if (ctx.decomposition.kind !== 'standard') return false
  return ctx.decomposition.pair === ctx.winningTile
}

function kongFanValue(meld: Meld): number {
  if (meld.type !== 'gang') return 0
  return meld.concealed ? 2 : 1
}

/**
 * Extensible fan table for "雷焦麻将". Adding a new fan type = append one entry
 * here; nothing else needs to change.
 */
export const FAN_RULES: FanRule[] = [
  { name: '门清', evaluate: (ctx) => (ctx.isMenqing ? 1 : 0) },
  { name: '花牌', evaluate: (ctx) => ctx.flowersHeld.length },
  { name: '杠', evaluate: (ctx) => ctx.exposedMelds.reduce((sum, m) => sum + kongFanValue(m), 0) },
  { name: '单钓将', evaluate: (ctx) => (isSingleWait(ctx) ? 1 : 0) },
  { name: '对对胡', evaluate: (ctx) => (isAllTriplets(ctx) ? 2 : 0) },
  { name: '清一色', evaluate: (ctx) => (isPureOneSuit(ctx) ? 4 : 0) },
  { name: '自摸', evaluate: (ctx) => (ctx.isSelfDraw ? 1 : 0) },
]

/** 十三幺 overrides the normal sum entirely and is worth a flat MAX_FAN. */
export function calcFan(ctx: FanContext): FanResult {
  if (ctx.decomposition.kind === 'kokushi') {
    return { total: MAX_FAN, breakdown: [{ name: '十三幺', fan: MAX_FAN }] }
  }
  const breakdown = FAN_RULES.map((rule) => ({ name: rule.name, fan: rule.evaluate(ctx) })).filter((entry) => entry.fan > 0)
  const total = breakdown.reduce((sum, entry) => sum + entry.fan, 0)
  return { total, breakdown }
}

/** 屁胡 thresholds: self-draw needs >=1 fan, winning off a discard needs >=2. */
export function canDeclareHu(fanTotal: number, isSelfDraw: boolean): boolean {
  return isSelfDraw ? fanTotal >= SELF_DRAW_MIN_FAN : fanTotal >= DISCARD_WIN_MIN_FAN
}

/**
 * A winning hand may have several valid decompositions (ambiguous set/pair
 * groupings). Score every one and keep the highest — the standard convention.
 */
export function bestFanResult(decompositions: WinDecomposition[], base: Omit<FanContext, 'decomposition'>): FanResult {
  let best: FanResult | null = null
  for (const decomposition of decompositions) {
    const result = calcFan({ ...base, decomposition })
    if (!best || result.total > best.total) best = result
  }
  return best ?? { total: 0, breakdown: [] }
}
