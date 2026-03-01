// ============================================================================
// Menu & screen overlays
// ============================================================================

import { CANVAS_W, CANVAS_H } from './config.js';
import { game } from './state.js';

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
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TOCA PRA FLORIPA', CANVAS_W / 2, 160);

  // Subtitle
  ctx.fillStyle = '#88aacc';
  ctx.font = '20px monospace';
  ctx.fillText('Porto Alegre \u2192 Florian\u00f3polis', CANVAS_W / 2, 210);

  // Tagline
  ctx.fillStyle = '#667788';
  ctx.font = '14px monospace';
  ctx.fillText('Uma viagem inesquec\u00edvel com a fam\u00edlia', CANVAS_W / 2, 245);

  // Start prompt (blinking)
  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('Aperte ENTER pra come\u00e7ar', CANVAS_W / 2, 380);
  }

  // Footer
  ctx.fillStyle = '#445566';
  ctx.font = '12px monospace';
  ctx.fillText('WASD ou setas pra dirigir', CANVAS_W / 2, CANVAS_H - 30);

  ctx.textAlign = 'left';
}

export function drawArrivalScreen() {
  ctx.fillStyle = '#0a2010';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#44dd66';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHEGAMOS!', CANVAS_W / 2, 180);

  ctx.fillStyle = '#88ccaa';
  ctx.font = '20px monospace';
  ctx.fillText('Florian\u00f3polis, finalmente!', CANVAS_W / 2, 230);

  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('Aperte ENTER pra jogar de novo', CANVAS_W / 2, 380);
  }

  ctx.textAlign = 'left';
}

export function drawGameOverScreen() {
  ctx.fillStyle = '#200a0a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#dd4444';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FIM DE VIAGEM', CANVAS_W / 2, 180);

  ctx.fillStyle = '#cc8888';
  ctx.font = '20px monospace';
  ctx.fillText('Ficou sem grana... ou sem carro.', CANVAS_W / 2, 230);

  const blink = Math.sin(Date.now() / 400) > 0;
  if (blink) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('Aperte ENTER pra tentar de novo', CANVAS_W / 2, 380);
  }

  ctx.textAlign = 'left';
}
