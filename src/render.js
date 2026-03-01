// ============================================================================
// Rendering
// ============================================================================

import {
  CANVAS_W, CANVAS_H, CAMERA_DEPTH, CAMERA_H, ROAD_W, SEG_LEN,
  DRAW_DIST, LANES, MAX_SPEED
} from './config.js';
import { game } from './state.js';
import { lerp, percentRemaining } from './utils.js';
import { isLeft, isRight } from './input.js';
import { getPalette } from './road.js';
import { drawHud } from './hud.js';

const ctx = game.ctx;

// =========================================================================
// Projection
// =========================================================================

export function project(p, cameraX, cameraY, cameraZ, roadWidth) {
  p.camera.x = p.world.x - cameraX;
  p.camera.y = p.world.y - cameraY;
  p.camera.z = p.world.z - cameraZ;

  if (p.camera.z < 0) p.camera.z += game.trackLength;

  if (p.camera.z <= 0) {
    p.screen.scale = 0;
    p.screen.x = 0;
    p.screen.y = CANVAS_H;
    p.screen.w = 0;
    return;
  }

  const w = roadWidth || ROAD_W;
  const scale = CAMERA_DEPTH / p.camera.z;
  p.screen.scale = scale;
  p.screen.x = Math.round(CANVAS_W / 2 + scale * p.camera.x * CANVAS_W / 2);
  p.screen.y = Math.round(CANVAS_H / 2 - scale * p.camera.y * CANVAS_H / 2);
  p.screen.w = Math.round(scale * w * CANVAS_W / 2);
}

// =========================================================================
// Drawing primitives
// =========================================================================

function drawPolygon(color, x1, y1, w1, x2, y2, w2) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1 - w1, y1);
  ctx.lineTo(x1 + w1, y1);
  ctx.lineTo(x2 + w2, y2);
  ctx.lineTo(x2 - w2, y2);
  ctx.closePath();
  ctx.fill();
}

function drawSegment(seg, clipY) {
  const p1 = seg.p1.screen;
  const p2 = seg.p2.screen;
  const color = seg.color;

  if (p1.y <= p2.y) return;
  if (p2.y >= clipY) return;

  let bottomY = p1.y, bottomX = p1.x, bottomW = p1.w;
  if (p1.y > clipY) {
    const t = (clipY - p2.y) / (p1.y - p2.y);
    bottomX = lerp(p2.x, p1.x, t);
    bottomW = lerp(p2.w, p1.w, t);
    bottomY = clipY;
  }

  const topY = Math.max(p2.y, 0);

  // Grass
  if (bottomY > topY) {
    ctx.fillStyle = color.grass;
    ctx.fillRect(0, topY, CANVAS_W, bottomY - topY);
  }

  // Rumble strips
  const rumbleW1 = bottomW * 1.15;
  const rumbleW2 = p2.w * 1.15;
  drawPolygon(color.rumble, bottomX, bottomY, rumbleW1, p2.x, topY, rumbleW2);
  // Road
  drawPolygon(color.road, bottomX, bottomY, bottomW, p2.x, topY, p2.w);

  // Lane markings (use per-segment lane count)
  if (color.lane) {
    const lanes = seg.lanes || LANES;
    const laneW1 = bottomW * 0.02;
    const laneW2 = p2.w * 0.02;
    const laneOffset1 = bottomW / lanes;
    const laneOffset2 = p2.w / lanes;
    for (let lane = 1; lane < lanes; lane++) {
      const lx1 = bottomX + (lane * 2 - lanes) * laneOffset1 / 2 * 2;
      const lx2 = p2.x + (lane * 2 - lanes) * laneOffset2 / 2 * 2;
      drawPolygon(color.lane, lx1, bottomY, laneW1, lx2, topY, laneW2);
    }
  }
}

function drawCarSprite(car, seg, clipY) {
  const p = seg.p1.screen;
  const scale = p.scale;
  if (scale <= 0) return;

  const segRoadW = seg.roadWidth || ROAD_W;
  const w = segRoadW * 0.18 * scale * CANVAS_W / 2;
  const h = w * 1.4;
  const x = p.x + car.offset * p.w;
  const y = p.y;

  if (y - h >= clipY) return;

  ctx.fillStyle = car.color;
  ctx.fillRect(x - w / 2, y - h, w, h);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - w / 2, y - h, w * 0.3, h);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - w * 0.35, y - h * 0.95, w * 0.7, h * 0.3);
}

function drawRoadsideSprite(sprite, seg, clipY) {
  const p = seg.p1.screen;
  const scale = p.scale;
  if (scale <= 0) return;

  const segRoadW = seg.roadWidth || ROAD_W;
  const x = p.x + sprite.offset * p.w;
  const y = p.y;

  if (sprite.type === 'building') {
    const w = segRoadW * 0.9 * scale * CANVAS_W / 2;
    const h = w * sprite.height;
    if (y - h >= clipY) return;

    ctx.fillStyle = sprite.color;
    ctx.fillRect(x - w / 2, y - h, w, h);

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x - w / 2, y - h, w * 0.3, h);

    ctx.fillStyle = 'rgba(50,70,90,0.6)';
    const winW = w * 0.15;
    const winH = h * 0.06;
    const cols = 3;
    const rows = Math.floor(sprite.height * 2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x - w * 0.3 + c * (w * 0.25);
        const wy = y - h + h * 0.1 + r * (h / (rows + 1));
        ctx.fillRect(wx, wy, winW, winH);
      }
    }

  } else if (sprite.type === 'tree') {
    const trunkW = segRoadW * 0.06 * scale * CANVAS_W / 2;
    const trunkH = trunkW * 3 * sprite.height;
    const canopyW = trunkW * 4;
    const canopyH = trunkH * 1.2;
    const totalH = trunkH + canopyH;
    if (y - totalH >= clipY) return;

    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH);

    ctx.fillStyle = sprite.color;
    ctx.beginPath();
    ctx.moveTo(x, y - totalH);
    ctx.lineTo(x - canopyW / 2, y - trunkH);
    ctx.lineTo(x + canopyW / 2, y - trunkH);
    ctx.closePath();
    ctx.fill();

  } else if (sprite.type === 'palm') {
    const trunkW = segRoadW * 0.05 * scale * CANVAS_W / 2;
    const trunkH = trunkW * 5 * sprite.height;
    if (y - trunkH * 1.3 >= clipY) return;

    const lean = sprite.offset > 0 ? trunkW * 1.5 : -trunkW * 1.5;
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = Math.max(1, trunkW);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * 0.5, y - trunkH * 0.5, x + lean, y - trunkH);
    ctx.stroke();

    const topX = x + lean;
    const topY = y - trunkH;
    const frondR = trunkW * 3;
    ctx.fillStyle = sprite.color;
    ctx.beginPath();
    ctx.arc(topX, topY, frondR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(topX - frondR * 0.6, topY + frondR * 0.3, frondR * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(topX + frondR * 0.6, topY + frondR * 0.3, frondR * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayerCar() {
  const player = game.player;
  const w = 60;
  const h = 80;
  const x = CANVAS_W / 2;
  const y = CANVAS_H - 20 - player.jumpH;

  if (player.jumpH > 0) {
    const groundY = CANVAS_H - 20;
    const shadowScale = 1 - player.jumpH / 300;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - w * shadowScale / 2, groundY - 4, w * shadowScale, 4);
  }

  ctx.fillStyle = '#2255ee';
  ctx.fillRect(x - w / 2, y - h, w, h);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x - w / 2, y - h, w * 0.3, h);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - w * 0.35, y - h * 0.95, w * 0.7, h * 0.3);

  if (isLeft()) {
    ctx.fillStyle = '#2255ee';
    ctx.fillRect(x - w / 2 - 4, y - h + 10, 4, h - 20);
  }
  if (isRight()) {
    ctx.fillStyle = '#2255ee';
    ctx.fillRect(x + w / 2, y - h + 10, 4, h - 20);
  }
}

function drawSpeechBubble(text, timer, side) {
  if (timer <= 0) return;

  const player = game.player;
  const alpha = timer < 0.5 ? timer / 0.5 : 1;
  const carX = CANVAS_W / 2;
  const carTopY = CANVAS_H - 20 - player.jumpH - 80;

  ctx.font = 'bold 14px monospace';
  const textW = ctx.measureText(text).width;
  const padX = 12;
  const padY = 8;
  const bw = textW + padX * 2;
  const bh = 26;
  const tailH = 10;
  const r = 8;

  const bx = side === 'left' ? carX - 30 - bw : carX + 30;
  const by = carTopY - 20 - tailH - bh;
  const tailX = side === 'left' ? bx + bw - 20 : bx + 20;

  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + bw - r, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
  ctx.lineTo(bx + bw, by + bh - r);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
  ctx.lineTo(bx + r, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
  ctx.lineTo(bx, by + r);
  ctx.quadraticCurveTo(bx, by, bx + r, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(tailX - 6, by + bh);
  ctx.lineTo(tailX + 6, by + bh);
  ctx.lineTo(tailX, by + bh + tailH);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tailX - 6, by + bh);
  ctx.lineTo(tailX, by + bh + tailH);
  ctx.lineTo(tailX + 6, by + bh);
  ctx.strokeStyle = '#333333';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tailX - 5, by + bh - 2, 10, 4);

  ctx.fillStyle = '#222222';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(text, bx + padX, by + bh - padY);

  ctx.globalAlpha = 1;
}

function drawBubble() {
  drawSpeechBubble(game.bubbleText, game.bubbleTimer, game.bubbleSide || 'left');
}

export function drawSky(palette) {
  const grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H / 2);
  grd.addColorStop(0, palette.sky);
  grd.addColorStop(1, palette.skyHorizon);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H / 2);
}

// =========================================================================
// Main render
// =========================================================================

export function render() {
  const player = game.player;
  const startIdx = Math.floor(player.z / SEG_LEN) % game.segments.length;
  const startSeg = game.segments[startIdx];
  const startPct = percentRemaining(player.z, SEG_LEN);

  const nextIdx = (startIdx + 1) % game.segments.length;
  const cameraY = lerp(startSeg.p1.world.y, game.segments[nextIdx].p1.world.y, startPct) + CAMERA_H;
  const playerRoadW = startSeg.roadWidth || ROAD_W;
  const cameraX = player.x * playerRoadW / 2;
  const cameraZ = player.z - CAMERA_DEPTH * CAMERA_H;

  // Sky
  const palette = getPalette(startIdx);
  drawSky(palette);

  // Grass base
  ctx.fillStyle = startSeg.color.grass;
  ctx.fillRect(0, CANVAS_H / 2, CANVAS_W, CANVAS_H / 2);

  // Project segments
  let maxY = CANVAS_H;
  let x = 0;
  let dx = 0;
  const spritesToDraw = [];

  for (let n = 0; n < DRAW_DIST; n++) {
    const segIdx = (startIdx + n) % game.segments.length;
    const seg = game.segments[segIdx];

    const segRoadW = seg.roadWidth || ROAD_W;
    project(seg.p1, cameraX - x, cameraY, cameraZ, segRoadW);
    project(seg.p2, cameraX - x - dx, cameraY, cameraZ, segRoadW);

    x += dx;
    dx += seg.curve;

    if (seg.p1.camera.z > 0) {
      for (const car of seg.cars) {
        spritesToDraw.push({ car, seg, n, clipY: maxY });
      }
      for (const sprite of seg.sprites) {
        spritesToDraw.push({ sprite, seg, n, clipY: maxY });
      }
    }

    if (seg.p1.camera.z <= 0 || seg.p2.screen.y >= maxY) continue;

    drawSegment(seg, maxY);
    maxY = Math.min(maxY, seg.p2.screen.y);
  }

  // Sprites back-to-front
  spritesToDraw.sort((a, b) => b.n - a.n);
  for (const item of spritesToDraw) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_W, item.clipY);
    ctx.clip();
    if (item.car) drawCarSprite(item.car, item.seg, item.clipY);
    else if (item.sprite) drawRoadsideSprite(item.sprite, item.seg, item.clipY);
    ctx.restore();
  }

  // Player car & HUD
  drawPlayerCar();
  drawBubble();
  drawHud();
}
