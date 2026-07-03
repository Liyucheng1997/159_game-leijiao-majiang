import type { PlayerIdx } from '../../engine/types'

export type Mood = 'neutral' | 'happy' | 'worried' | 'discarding'

export interface CharacterProfile {
  id: string
  name: string
  accentColor: string
  hairColor: string
}

/** One profile per AI seat (1=east, 2=north, 3=west). Seat 0 is the human, no portrait needed. */
export const CHARACTER_PROFILES: Record<1 | 2 | 3, CharacterProfile> = {
  1: { id: 'char-east', name: '小雨', accentColor: '#d1477a', hairColor: '#3b2a2a' },
  2: { id: 'char-north', name: '阿雪', accentColor: '#4a7fd1', hairColor: '#1f1f1f' },
  3: { id: 'char-west', name: '小月', accentColor: '#5fae6b', hairColor: '#4a2f1f' },
}

export type PortraitSource = { type: 'image'; src: string } | { type: 'svg-placeholder' }

/**
 * Resolves which asset to render for a character/mood pair. There is no real
 * artwork yet (no image-generation tool available in this environment), so
 * this always falls back to the procedural SVG placeholder.
 *
 * To swap in real illustrations later: drop files at
 * `/public/assets/portraits/{characterId}/{mood}.webp` (see the README in
 * that folder for the exact naming convention) and change this function to
 * return `{ type: 'image', src: ... }` for the pairs that exist — nothing
 * else in the UI needs to change, PortraitCard already branches on this.
 */
export function getPortraitSrc(_characterId: string, _mood: Mood): PortraitSource {
  return { type: 'svg-placeholder' }
}

export function characterProfileForSeat(seatIndex: 1 | 2 | 3): CharacterProfile {
  return CHARACTER_PROFILES[seatIndex]
}

export function isOpponentSeat(playerIdx: PlayerIdx): playerIdx is 1 | 2 | 3 {
  return playerIdx === 1 || playerIdx === 2 || playerIdx === 3
}
