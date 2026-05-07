/**
 * Trick play resolution for Petit Bridge.
 *
 * Single rule during play: if you have the led suit, you MUST follow.
 * The highest card of the led suit wins (no trump).
 * Winner of the trick leads the next.
 */

import type {
  Card,
  CompletedTrick,
  CurrentTrick,
  Deal,
  DealOutcome,
  DealPhase,
  Play,
  Seat,
  Suit,
} from './types.ts';
import { nextSeat, partnerOf, teamOf } from './types.ts';

/**
 * Is `card` a legal play from `hand` given the led suit?
 * - If no card has been led yet, anything is legal.
 * - If a suit was led: must follow if able; otherwise free discard.
 */
export function isLegalPlay(
  card: Card,
  hand: readonly Card[],
  leadSuit: Suit | null,
): boolean {
  if (!hand.some(c => c.suit === card.suit && c.rank === card.rank)) {
    return false; // can't play a card you don't hold
  }
  if (!leadSuit) return true;
  const hasLeadSuit = hand.some(c => c.suit === leadSuit);
  return hasLeadSuit ? card.suit === leadSuit : true;
}

/** All legal cards from `hand` given the current trick's lead suit. */
export function legalPlays(hand: readonly Card[], leadSuit: Suit | null): Card[] {
  if (!leadSuit) return [...hand];
  const followups = hand.filter(c => c.suit === leadSuit);
  return followups.length > 0 ? followups : [...hand];
}

/** Determine the winner of a completed (4-play) trick. */
export function resolveTrickWinner(plays: readonly Play[]): Seat {
  if (plays.length !== 4) {
    throw new Error(`resolveTrickWinner expects 4 plays, got ${plays.length}`);
  }
  const leadSuit = plays[0].card.suit;
  let winningPlay = plays[0];
  for (const p of plays.slice(1)) {
    if (p.card.suit === leadSuit && p.card.rank > winningPlay.card.rank) {
      winningPlay = p;
    }
  }
  return winningPlay.seat;
}

/** Remove a specific card from a hand (returns a new array). */
function removeCard(hand: readonly Card[], card: Card): Card[] {
  const idx = hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
  if (idx === -1) throw new Error(`Card ${card.suit}/${card.rank} not in hand`);
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}

/**
 * Apply a single play to the deal state, returning the next state.
 * Pure: does not mutate input.
 *
 * Throws if the play is illegal (wrong seat or doesn't follow suit when required).
 */
export function applyPlay(deal: Deal, play: Play): Deal {
  if (play.seat !== deal.nextToPlay) {
    throw new Error(`Out of turn: expected ${deal.nextToPlay}, got ${play.seat}`);
  }
  if (deal.phase !== 'opening' && deal.phase !== 'playing') {
    throw new Error(`Cannot play during phase '${deal.phase}'`);
  }
  const hand = deal.hands[play.seat];
  if (!isLegalPlay(play.card, hand, deal.currentTrick.leadSuit)) {
    throw new Error(
      `Illegal play: must follow suit (${deal.currentTrick.leadSuit}) if able`,
    );
  }

  const newHands = { ...deal.hands, [play.seat]: removeCard(hand, play.card) };
  const newPlays: Play[] = [...deal.currentTrick.plays, play];
  const isLeader = newPlays.length === 1;
  const leadSuit = isLeader ? play.card.suit : deal.currentTrick.leadSuit;

  // Trick incomplete?
  if (newPlays.length < 4) {
    return {
      ...deal,
      hands: newHands,
      phase: deal.phase === 'opening' ? 'playing' : deal.phase, // dummy reveals after opening
      currentTrick: { ...deal.currentTrick, plays: newPlays, leadSuit },
      nextToPlay: nextSeat(play.seat),
    };
  }

  // Trick complete — resolve.
  const winner = resolveTrickWinner(newPlays);
  const completed: CompletedTrick = {
    index: deal.currentTrick.index,
    plays: newPlays,
    leader: deal.currentTrick.leader,
    leadSuit: leadSuit!,
    winner,
  };
  const tricksWon = { ...deal.tricksWon };
  tricksWon[teamOf(winner)] += 1;

  const remainingCards = newHands[winner].length;
  const dealComplete = remainingCards === 0;
  const nextPhase: DealPhase = dealComplete ? 'completed' : 'trick_won';

  return {
    ...deal,
    hands: newHands,
    phase: nextPhase,
    currentTrick: {
      index: completed.index + 1,
      plays: [],
      leader: winner,
      leadSuit: null,
    },
    completedTricks: [...deal.completedTricks, completed],
    tricksWon,
    nextToPlay: winner,
  };
}

/** Advance from the post-trick "trick_won" beat into the next playing phase. */
export function continueAfterTrick(deal: Deal): Deal {
  if (deal.phase !== 'trick_won') return deal;
  return { ...deal, phase: 'playing' };
}

/** Compute the outcome once the deal is complete. */
export function dealOutcome(deal: Deal): DealOutcome {
  if (deal.phase !== 'completed') {
    throw new Error('dealOutcome called before deal completion');
  }
  const { NS, EW } = deal.tricksWon;
  const winner: 'NS' | 'EW' | 'tie' = NS > EW ? 'NS' : EW > NS ? 'EW' : 'tie';
  const declarerTeam = teamOf(deal.declarer);
  const declarerWon = winner === declarerTeam;
  const firstTrick = deal.completedTricks[0];
  const firstTrickWonBy = firstTrick ? teamOf(firstTrick.winner) : null;
  return {
    tricksNS: NS,
    tricksEW: EW,
    winner,
    declarerWon,
    firstTrickWonBy,
  };
}

/** Did the player's team (always NS — the human is South) win the very first trick? */
export function playerWonFirstTrick(deal: Deal, playerSeat: Seat = 'S'): boolean {
  const first = deal.completedTricks[0];
  if (!first) return false;
  return teamOf(first.winner) === teamOf(playerSeat);
}
