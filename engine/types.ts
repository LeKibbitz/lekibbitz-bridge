/**
 * Lekibbitz Bridge — Petit Bridge engine types
 *
 * Petit Bridge: 4 families × 10 cards (1-10), 4 players in 2 teams,
 * no bidding, no trump, no card values beyond rank order.
 * Reference: Eduscol "Oiseaux-compteurs" + FFB.
 */

/** Visual family identifier. UI maps these to colors/themes/icons. */
export type Suit = 'red' | 'blue' | 'green' | 'yellow';
export const SUITS: readonly Suit[] = ['red', 'blue', 'green', 'yellow'] as const;

/** Card rank — 1 (weakest) to 10 (strongest). */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Card = { suit: Suit; rank: Rank };

/** Stable string id of a card for React keys, comparisons, logs. */
export const cardId = (c: Card): string => `${c.suit[0].toUpperCase()}${c.rank}`;

/** Compass position around the table. */
export type Seat = 'N' | 'E' | 'S' | 'W';
export const SEATS: readonly Seat[] = ['N', 'E', 'S', 'W'] as const;

/** Team — bridge convention: North-South vs East-West. */
export type Team = 'NS' | 'EW';

export const teamOf = (seat: Seat): Team =>
  seat === 'N' || seat === 'S' ? 'NS' : 'EW';

export const partnerOf = (seat: Seat): Seat => {
  switch (seat) {
    case 'N': return 'S';
    case 'S': return 'N';
    case 'E': return 'W';
    case 'W': return 'E';
  }
};

export const nextSeat = (seat: Seat): Seat => {
  // Clockwise: N → E → S → W → N
  switch (seat) {
    case 'N': return 'E';
    case 'E': return 'S';
    case 'S': return 'W';
    case 'W': return 'N';
  }
};

/** Adaptive deck size — drop 10s, then 9s, etc. */
export type DeckSize = 16 | 20 | 24 | 28 | 32 | 36 | 40;

/** A single card played in a trick. */
export type Play = { seat: Seat; card: Card };

/** A completed trick (4 plays + winner). */
export type CompletedTrick = {
  index: number;          // 0-based trick number within the deal
  plays: Play[];          // ordered: leader first
  leader: Seat;
  leadSuit: Suit;
  winner: Seat;
};

/** A trick in progress. */
export type CurrentTrick = {
  index: number;
  plays: Play[];          // 0..3 plays so far
  leader: Seat;
  leadSuit: Suit | null;  // null until leader plays
};

/** Phase of the deal state machine. */
export type DealPhase =
  | 'setup'         // pre-deal, no cards distributed
  | 'opening'       // declarer plays the opening lead
  | 'playing'       // dummy revealed, normal play
  | 'trick_won'     // brief beat after a trick is completed
  | 'completed';    // all tricks played

/** Full state of a Petit Bridge deal. */
export type Deal = {
  deckSize: DeckSize;
  cardsPerHand: number;             // = deckSize / 4
  hands: Record<Seat, Card[]>;      // remaining cards in each hand
  dealer: Seat;                     // who deals; also opens the play in Petit Bridge
  declarer: Seat;                   // = dealer (Petit Bridge has no bidding)
  dummy: Seat;                      // = seat to the left of dealer
  defenders: [Seat, Seat];          // the two opponents of declarer
  phase: DealPhase;
  currentTrick: CurrentTrick;
  completedTricks: CompletedTrick[];
  tricksWon: { NS: number; EW: number };
  nextToPlay: Seat;
};

/** Outcome of a deal — useful for the lesson layer. */
export type DealOutcome = {
  tricksNS: number;
  tricksEW: number;
  winner: 'NS' | 'EW' | 'tie';
  declarerWon: boolean;             // did the declarer's team win?
  firstTrickWonBy: Team | null;     // anchors "Bravo, ton premier pli !"
};
