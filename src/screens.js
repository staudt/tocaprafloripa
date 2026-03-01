// ============================================================================
// Menu & screen overlays
// ============================================================================

import { CANVAS_W, CANVAS_H } from './config.js';
import { game } from './state.js';
import { drawText } from './draw.js';

const ctx = game.ctx;

export function drawMenuScreen() {
  // Background
  const grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grd.addColorStop(0, '#1a2a4a');
  grd.addColorStop(1, '#0a1020');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Road lines decoration
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const y = CANVAS_H * 0.6 + i * 20;
    const spread = (i + 1) * 60;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2 - spread, y);
    ctx.lineTo(CANVAS_W / 2 + spread, y);
    ctx.stroke();
  }

  // Title
  drawText('TOCA PRA FLORIPA', CANVAS_W / 2, 160, { color: '#ffcc00', font: 'bold 52px monospace', align: 'center' });

  // Subtitle
  drawText('Porto Alegre \u2192 Florian\u00f3polis', CANVAS_W / 2, 210, { color: '#88aacc', font: '20px monospace', align: 'center' });

  // Tagline
  drawText('Uma viagem inesquec\u00edvel com a fam\u00edlia', CANVAS_W / 2, 245, { color: '#667788', font: '14px monospace', align: 'center' });

  // Start prompt (blinking)
  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    drawText('Aperte ENTER pra come\u00e7ar', CANVAS_W / 2, 380, { color: '#ffffff', font: 'bold 18px monospace', align: 'center' });
  }

  // Footer
  drawText('WASD ou setas pra dirigir', CANVAS_W / 2, CANVAS_H - 30, { color: '#445566', font: '12px monospace', align: 'center' });
}

export function drawArrivalScreen() {
  ctx.fillStyle = '#0a2010';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawText('CHEGAMOS!', CANVAS_W / 2, 180, { color: '#44dd66', font: 'bold 42px monospace', align: 'center' });
  drawText('Florian\u00f3polis, finalmente!', CANVAS_W / 2, 230, { color: '#88ccaa', font: '20px monospace', align: 'center' });

  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    drawText('Aperte ENTER pra jogar de novo', CANVAS_W / 2, 380, { color: '#ffffff', font: 'bold 18px monospace', align: 'center' });
  }
}

export function drawGameOverScreen() {
  ctx.fillStyle = '#200a0a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawText('FIM DE VIAGEM', CANVAS_W / 2, 180, { color: '#dd4444', font: 'bold 42px monospace', align: 'center' });
  drawText('Ficou sem grana... ou sem carro.', CANVAS_W / 2, 230, { color: '#cc8888', font: '20px monospace', align: 'center' });

  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    drawText('Aperte ENTER pra tentar de novo', CANVAS_W / 2, 380, { color: '#ffffff', font: 'bold 18px monospace', align: 'center' });
  }
}
