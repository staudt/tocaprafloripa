// ============================================================================
// Dialogue / speech bubble system
// ============================================================================

import { game } from './state.js';
import { DT } from './config.js';

// Speaker sides: driver = left, wife/kid = right
const SPEAKER_SIDE = { driver: 'left', wife: 'right', kid: 'right' };

export function showBubble(text, duration = 3, speaker = 'driver') {
  game.bubbleText = text;
  game.bubbleTimer = duration;
  game.bubbleSide = SPEAKER_SIDE[speaker] || 'left';
}

export function updateBubble() {
  if (game.bubbleTimer > 0) game.bubbleTimer -= DT;
}

export function isBubbleActive() {
  return game.bubbleTimer > 0;
}
