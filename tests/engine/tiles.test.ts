import { describe, expect, it } from 'vitest'
import {
  buildDeck,
  countVectorFromHand,
  createSeededRng,
  isHonor,
  isTerminal,
  isTerminalOrHonor,
  rankOf,
  shuffle,
  suitOf,
} from '../../src/engine/tiles'

describe('buildDeck', () => {
  it('produces exactly 144 tiles: 136 playable + 8 flowers', () => {
    const deck = buildDeck()
    expect(deck.length).toBe(144)
    expect(deck.filter((t) => t.isFlower).length).toBe(8)
    expect(deck.filter((t) => !t.isFlower).length).toBe(136)
  })

  it('has exactly 4 copies of every one of the 34 playable kinds', () => {
    const deck = buildDeck()
    const counts = countVectorFromHand(deck)
    expect(counts.length).toBe(34)
    expect(counts.every((c) => c === 4)).toBe(true)
  })

  it('assigns every tile a unique id', () => {
    const deck = buildDeck()
    const ids = new Set(deck.map((t) => t.id))
    expect(ids.size).toBe(144)
  })
})

describe('tile classification helpers', () => {
  it('classifies suits and ranks correctly', () => {
    expect(suitOf(0)).toBe('wan')
    expect(suitOf(9)).toBe('tiao')
    expect(suitOf(18)).toBe('tong')
    expect(suitOf(27)).toBe(null)
    expect(rankOf(0)).toBe(1)
    expect(rankOf(8)).toBe(9)
    expect(rankOf(27)).toBe(-1)
  })

  it('classifies terminals and honors correctly', () => {
    expect(isTerminal(0)).toBe(true)
    expect(isTerminal(8)).toBe(true)
    expect(isTerminal(4)).toBe(false)
    expect(isHonor(27)).toBe(true)
    expect(isHonor(33)).toBe(true)
    expect(isHonor(26)).toBe(false)
    expect(isTerminalOrHonor(27)).toBe(true)
    expect(isTerminalOrHonor(0)).toBe(true)
    expect(isTerminalOrHonor(4)).toBe(false)
  })
})

describe('createSeededRng + shuffle', () => {
  it('is deterministic for a given seed', () => {
    const deck = buildDeck()
    const shuffled1 = shuffle(deck, createSeededRng(42))
    const shuffled2 = shuffle(deck, createSeededRng(42))
    expect(shuffled1.map((t) => t.id)).toEqual(shuffled2.map((t) => t.id))
  })

  it('produces a different order for a different seed', () => {
    const deck = buildDeck()
    const shuffled1 = shuffle(deck, createSeededRng(1))
    const shuffled2 = shuffle(deck, createSeededRng(2))
    expect(shuffled1.map((t) => t.id)).not.toEqual(shuffled2.map((t) => t.id))
  })

  it('preserves the full multiset of tiles', () => {
    const deck = buildDeck()
    const shuffled = shuffle(deck, createSeededRng(7))
    expect(shuffled.map((t) => t.id).sort()).toEqual(deck.map((t) => t.id).sort())
  })
})
