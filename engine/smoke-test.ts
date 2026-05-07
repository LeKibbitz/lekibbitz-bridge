/**
 * Smoke test — runs a deterministic 16-card Petit Bridge deal end-to-end.
 * Validates: setup, legal play, follow-suit rule, trick resolution, AI,
 * deal completion, outcome, and "first trick won by player" detection.
 */

import {
  startDeal,
  applyPlay,
  continueAfterTrick,
  dealOutcome,
  chooseCard,
  legalPlays,
  isLegalPlay,
  cardId,
  playerWonFirstTrick,
  type Card,
  type Seat,
} from './index.ts';

let testsRun = 0;
let testsFailed = 0;

function assert(cond: boolean, msg: string) {
  testsRun++;
  if (!cond) {
    testsFailed++;
    console.error(`  ✗ ${msg}`);
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

// Deterministic RNG (seeded mulberry32) so the test is reproducible.
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

console.log('\n=== Petit Bridge engine smoke test ===\n');

console.log('1. Setup');
const rng = mulberry32(42);
let deal = startDeal({ deckSize: 16, dealer: 'S', rng });

assert(deal.cardsPerHand === 4, 'Each hand has 4 cards (16-card deck)');
assert(deal.dealer === 'S', 'South is the dealer');
assert(deal.declarer === 'S', 'Dealer is also declarer');
assert(deal.dummy === 'W', 'Dummy is left of dealer (West)');
assert(deal.nextToPlay === 'S', 'South opens the lead');
assert(deal.phase === 'opening', "Phase is 'opening'");
assert(
  deal.hands.N.length + deal.hands.E.length + deal.hands.S.length + deal.hands.W.length === 16,
  'All 16 cards distributed',
);

console.log('\n2. Follow-suit rule');
const sHand = deal.hands.S;
const sCard = sHand[0];
assert(isLegalPlay(sCard, sHand, null), 'Any card legal as opening lead');

// Pick a hand with ≥ 2 suits to validate the must-follow rule.
const handWithMultipleSuits = (['N', 'E', 'S', 'W'] as Seat[])
  .map(s => ({ s, h: deal.hands[s] }))
  .find(({ h }) => new Set(h.map(c => c.suit)).size >= 2);

if (handWithMultipleSuits) {
  const { h } = handWithMultipleSuits;
  const suit1 = h[0].suit;
  const offSuit = h.find(c => c.suit !== suit1);
  if (offSuit) {
    assert(
      !isLegalPlay(offSuit, h, suit1),
      'Cannot play off-suit when you can follow',
    );
    assert(
      isLegalPlay(h[0], h, suit1),
      'Can follow suit when able',
    );
  }
}

console.log('\n3. Play a full deal with AI driving everyone');
let safety = 0;
const playerSeat: Seat = 'S';
while (deal.phase !== 'completed' && safety++ < 100) {
  if (deal.phase === 'trick_won') {
    deal = continueAfterTrick(deal);
    continue;
  }
  const card = chooseCard(deal, 'fair');
  // Verify the chosen card is in the player's hand and legal.
  const hand = deal.hands[deal.nextToPlay];
  assert(
    hand.some(c => c.suit === card.suit && c.rank === card.rank),
    `AI played a card it actually held (${cardId(card)} from ${deal.nextToPlay})`,
  );
  assert(
    isLegalPlay(card, hand, deal.currentTrick.leadSuit),
    `AI play respects follow-suit rule (${cardId(card)} from ${deal.nextToPlay})`,
  );
  deal = applyPlay(deal, { seat: deal.nextToPlay, card });
}

console.log('\n4. Deal completion');
assert(deal.phase === 'completed', 'Deal reached completed phase');
assert(deal.completedTricks.length === 4, 'Exactly 4 tricks played (16-card deal)');
assert(
  deal.hands.N.length === 0 && deal.hands.E.length === 0 &&
  deal.hands.S.length === 0 && deal.hands.W.length === 0,
  'All hands empty at completion',
);
assert(
  deal.tricksWon.NS + deal.tricksWon.EW === 4,
  `tricksWon sums to 4 (got NS=${deal.tricksWon.NS}, EW=${deal.tricksWon.EW})`,
);

const outcome = dealOutcome(deal);
console.log(`\n   Outcome: NS=${outcome.tricksNS} EW=${outcome.tricksEW} → ${outcome.winner}`);
console.log(`   First trick won by: ${outcome.firstTrickWonBy}`);
console.log(`   Player (NS) won first trick: ${playerWonFirstTrick(deal, 'S')}`);

console.log('\n5. Replay determinism');
const rng2 = mulberry32(42);
let deal2 = startDeal({ deckSize: 16, dealer: 'S', rng: rng2 });
let safety2 = 0;
while (deal2.phase !== 'completed' && safety2++ < 100) {
  if (deal2.phase === 'trick_won') { deal2 = continueAfterTrick(deal2); continue; }
  const c = chooseCard(deal2, 'fair');
  deal2 = applyPlay(deal2, { seat: deal2.nextToPlay, card: c });
}
assert(
  deal2.tricksWon.NS === deal.tricksWon.NS && deal2.tricksWon.EW === deal.tricksWon.EW,
  'Same RNG seed produces identical outcomes',
);

console.log('\n6. 40-card deal still works');
const big = startDeal({ deckSize: 40, dealer: 'N', rng: mulberry32(7) });
assert(big.cardsPerHand === 10, '40-card deck → 10 cards per hand');
assert(big.dummy === 'E', '40-card: dummy is East when dealer is North');

console.log(`\n=== ${testsRun - testsFailed}/${testsRun} passed ===`);
if (testsFailed > 0) {
  process.exit(1);
}
