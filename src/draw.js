// ============================================================================
// Shared canvas drawing helpers
// ============================================================================

import { game } from './state.js';

const ctx = game.ctx;

// Rounded rectangle path (traces path only — caller must fill/stroke)
export function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Draw text — sets style/font/align, draws, resets align to 'left'
export function drawText(text, x, y, { color = '#fff', font = '14px monospace', align = 'left' } = {}) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  if (align !== 'left') ctx.textAlign = 'left';
}

// Shaded rectangle — base color + dark left strip + dark top strip
// Used by car sprites and player car
export function drawShadedRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x, y, w * 0.3, h);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x + w * 0.15, y + h * 0.05, w * 0.7, h * 0.3);
}
