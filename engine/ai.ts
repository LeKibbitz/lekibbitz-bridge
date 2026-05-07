/**
 * Beginner-grade AI for Petit Bridge.
 *
 * Design intent: NOT to play optimally. To play in a way that lets a beginner
 * have a fair shot at winning the first trick — pleasure-first pedagogy.
 * Three difficulty levels:
 *
 *   - 'gentle'  : opponents play their lowest card; partner (dummy) plays its
 *                 lowest. Easy mode for absolute beginners.
 *   - 'fair'    : opponents play "naive" — dump high if they win the trick,
 *                 dump low otherwise. Most realistic at zero-knowledge level.
 *   - 'sharp'   : same as fair but always second-hand-low / third-hand-high
 *                 heuristic. Light strategy.
 *
 * The DUMMY is controlled by the human declarer (Petit Bridge rule), so the AI
 * here drives ONLY the two defenders by default. We expose `chooseDummyCard`
 * separately so a UI can call it when the human is playing the dummy via
 * voice-over or a hint button.
 */

import type { Card, Deal, Seat } from './types.ts';
import { legalPlays } from './play.ts';

export type AiDifficulty = 'gentle' | 'fair' | 'sharp';

function lowest(cards: Card[]): Card {
  return cards.reduce((a, b) => (a.rank <= b.rank ? a : b));
}
function highest(cards: Card[]): Card {
  return cards.reduce((a, b) => (a.rank >= b.rank ? a : b));
}

/** Currently-winning play in the in-progress trick, or null if no plays yet. */
function currentWinner(deal: Deal): { seat: Seat; rank: number } | null {
  const plays = deal.currentTrick.plays;
  if (plays.length === 0) return null;
  const leadSuit = deal.currentTrick.leadSuit!;
  const followers = plays.filter(p => p.card.suit === leadSuit);
  const top = followers.reduce((a, b) => (a.card.rank >= b.card.rank ? a : b));
  return { seat: top.seat, rank: top.card.rank };
}

/**
 * Pick a card for the given seat. Caller is responsible for making sure it's
 * actually that seat's turn; we trust deal.nextToPlay.
 */
export function chooseCard(
  deal: Deal,
  difficulty: AiDifficulty = 'fair',
): Card {
  const seat = deal.nextToPlay;
  const hand = deal.hands[seat];
  const leadSuit = deal.currentTrick.leadSuit;
  const candidates = legalPlays(hand, leadSuit);

  if (candidates.length === 1) return candidates[0];

  if (difficulty === 'gentle') {
    return lowest(candidates);
  }

  // For 'fair' and 'sharp' we look at trick context.
  const winner = currentWinner(deal);
  const isLeading = winner === null;

  if (isLeading) {
    // Opening lead: play a middling card from the longest suit. For simplicity
    // at this difficulty, just lead the lowest of any suit.
    return lowest(candidates);
  }

  const followingSuit = candidates.every(c => c.suit === leadSuit);
  const opponentWinning = winner !== null; // someone is winning; figure out which team

  if (!followingSuit) {
    // Can't follow — discard lowest. (No trump in Petit Bridge.)
    return lowest(candidates);
  }

  // Following suit. Can we beat the current winner?
  const beats = candidates.filter(c => c.rank > winner!.rank);

  if (difficulty === 'sharp') {
    // Third-hand-high if partner hasn't won the trick yet, else cover with
    // smallest beat or duck.
    return beats.length > 0 ? highest(beats) : lowest(candidates);
  }

  // 'fair': try to win cheaply if possible, else duck.
  return beats.length > 0 ? lowest(beats) : lowest(candidates);
}
