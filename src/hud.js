// ============================================================================
// HUD
// ============================================================================

import { CANVAS_W, MAX_SPEED } from './config.js';
import { game } from './state.js';
import { drawText } from './draw.js';

export function drawHud() {
  const player = game.player;
  const kmh = Math.round(player.speed / MAX_SPEED * 160);
  drawText(kmh + ' km/h', 20, 30, { color: '#ffffff', font: 'bold 20px monospace' });

  // Progress
  const pct = Math.round((player.z / game.trackLength) * 100);
  drawText(pct + '%', CANVAS_W - 80, 30, { color: '#ffffff', font: 'bold 20px monospace' });

  // Location name
  const section = game.currentSection || '';
  drawText(section, CANVAS_W / 2, 25, { color: '#ffffff', font: '14px monospace', align: 'center' });
}
