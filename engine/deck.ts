/**
 * Deck construction, shuffling, and dealing for Petit Bridge.
 *
 * Adaptive deck: deckSize ∈ {16, 20, 24, 28, 32, 36, 40}.
 * Lower = simpler. We always keep the smallest ranks first.
 *   16 → ranks 1-4 (4 tricks per deal)
 *   20 → ranks 1-5
 *   24 → ranks 1-6
 *   ...
 *   40 → ranks 1-10 (10 tricks per deal, full Petit Bridge)
 */

import type { Card, DeckSize, Rank, Seat } from './types.ts';
import { SEATS, SUITS } from './types.ts';

export type RandomFn = () => number;

/** Build an ordered deck for the given size — smallest ranks across all 4 suits. */
export function buildDeck(deckSize: DeckSize): Card[] {
  const ranksPerSuit = deckSize / 4;
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let r = 1; r <= ranksPerSuit; r++) {
      deck.push({ suit, rank: r as Rank });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle. Pure — does not mutate input. Inject `rng` for deterministic tests. */
export function shuffle<T>(items: readonly T[], rng: RandomFn = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal cards 1-by-1 clockwise starting to the LEFT of the dealer
 * (standard bridge convention — dealer receives the last card).
 */
export function dealCards(deck: Card[], dealer: Seat): Record<Seat, Card[]> {
  if (deck.length % 4 !== 0) {
    throw new Error(`Deck length ${deck.length} not divisible by 4`);
  }
  const hands: Record<Seat, Card[]> = { N: [], E: [], S: [], W: [] };
  // Start with the seat to the left of the dealer.
  const dealerIdx = SEATS.indexOf(dealer);
  for (let i = 0; i < deck.length; i++) {
    const seat = SEATS[(dealerIdx + 1 + i) % 4];
    hands[seat].push(deck[i]);
  }
  return hands;
}

/** Sort a hand the way a Petit Bridge player arranges it: by suit, then rank descending. */
export function sortHand(hand: readonly Card[]): Card[] {
  const suitOrder: Record<string, number> = { red: 0, yellow: 1, green: 2, blue: 3 };
  return [...hand].sort((a, b) => {
    if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
    return b.rank - a.rank; // strongest first
  });
}
