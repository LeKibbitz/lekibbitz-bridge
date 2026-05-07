/**
 * Lekibbitz Bridge — Petit Bridge engine
 * Public API.
 */

export * from './types.ts';
export {
  buildDeck,
  shuffle,
  dealCards,
  sortHand,
  type RandomFn,
} from './deck.ts';
export {
  isLegalPlay,
  legalPlays,
  resolveTrickWinner,
  applyPlay,
  continueAfterTrick,
  dealOutcome,
  playerWonFirstTrick,
} from './play.ts';
export { chooseCard, type AiDifficulty } from './ai.ts';
export { startDeal, type StartDealOptions } from './setup.ts';
