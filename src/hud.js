// ============================================================================
// HUD
// ============================================================================

import { CANVAS_W, MAX_SPEED, SEG_LEN } from './config.js';
import { game } from './state.js';

const ctx = game.ctx;

export function drawHud() {
  const player = game.player;
  const kmh = Math.round(player.speed / MAX_SPEED * 160);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(kmh + ' km/h', 20, 30);

  // Progress
  const pct = Math.round((player.z / game.trackLength) * 100);
  ctx.fillText(pct + '%', CANVAS_W - 80, 30);

  // Location name
  const section = game.currentSection || '';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(section, CANVAS_W / 2, 25);
  ctx.textAlign = 'left';
}
