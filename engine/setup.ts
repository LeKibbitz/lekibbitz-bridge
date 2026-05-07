/**
 * Deal setup — go from "nothing" to a Deal ready for the opening lead.
 *
 * Classic bridge convention (used in Lekibbitz Bridge):
 *   - The DECLARER's partner is the dummy (face up after the opening lead).
 *   - The OPENING LEADER is the player to the left of the declarer.
 *   - The declarer plays both his own hand and the dummy.
 *
 * In our pedagogical mode, declarer defaults to South (the human player) so:
 *   declarer = 'S'  → dummy = 'N', opening leader = 'W'
 */

import type { Card, Deal, DeckSize, Seat } from './types.ts';
import { partnerOf, nextSeat } from './types.ts';
import { buildDeck, dealCards, shuffle, type RandomFn } from './deck.ts';

export type StartDealOptions = {
  deckSize: DeckSize;
  /** Who shuffled / dealt the cards. Mostly cosmetic; doesn't determine the leader. */
  dealer: Seat;
  /** Who plays both his own hand and the dummy. Defaults to South. */
  declarer?: Seat;
  rng?: RandomFn;          // inject for deterministic lessons / tests
  predefinedHands?: Record<Seat, Card[]>; // skip random — for tutorials
};

export function startDeal(opts: StartDealOptions): Deal {
  const { deckSize, dealer, rng, predefinedHands } = opts;
  const declarer = opts.declarer ?? 'S';
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

  // Classic bridge: dummy = declarer's partner; opening leader = left of declarer.
  const dummy = partnerOf(declarer);
  const openingLeader = nextSeat(declarer);
  const defenders: [Seat, Seat] =
    declarer === 'N' || declarer === 'S' ? ['E', 'W'] : ['N', 'S'];

  return {
    deckSize,
    cardsPerHand,
    hands,
    dealer,
    declarer,
    dummy,
    defenders,
    phase: 'opening',
    currentTrick: { index: 0, plays: [], leader: openingLeader, leadSuit: null },
    completedTricks: [],
    tricksWon: { NS: 0, EW: 0 },
    nextToPlay: openingLeader,
  };
}
