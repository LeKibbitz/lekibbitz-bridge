/**
 * Deal setup — go from "nothing" to a Deal ready for the opening lead.
 */

import type { Card, Deal, DeckSize, Seat } from './types.ts';
import { partnerOf, nextSeat } from './types.ts';
import { buildDeck, dealCards, shuffle, type RandomFn } from './deck.ts';

export type StartDealOptions = {
  deckSize: DeckSize;
  dealer: Seat;            // also the declarer in Petit Bridge
  rng?: RandomFn;          // inject for deterministic lessons / tests
  predefinedHands?: Record<Seat, Card[]>; // skip random — for tutorials
};

export function startDeal(opts: StartDealOptions): Deal {
  const { deckSize, dealer, rng, predefinedHands } = opts;
  const cardsPerHand = deckSize / 4;

  const hands = predefinedHands
    ? predefinedHands
    : dealCards(shuffle(buildDeck(deckSize), rng), dealer);

  // Validate.
  for (const seat of ['N', 'E', 'S', 'W'] as Seat[]) {
    if (hands[seat].length !== cardsPerHand) {
      throw new Error(`Hand ${seat} has ${hands[seat].length}, expected ${cardsPerHand}`);
    }
  }

  const dummy = nextSeat(dealer);
  const defenders: [Seat, Seat] =
    dealer === 'N' || dealer === 'S' ? ['E', 'W'] : ['N', 'S'];

  return {
    deckSize,
    cardsPerHand,
    hands,
    dealer,
    declarer: dealer,
    dummy,
    defenders,
    phase: 'opening',
    currentTrick: { index: 0, plays: [], leader: dealer, leadSuit: null },
    completedTricks: [],
    tricksWon: { NS: 0, EW: 0 },
    nextToPlay: dealer,
  };
}
