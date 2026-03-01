// ============================================================================
// Utility functions
// ============================================================================

import { DRAW_DIST } from './config.js';

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function lerp(a, b, t) { return a + (b - a) * t; }

export function easeInOut(a, b, t) {
  return a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);
}

export function percentRemaining(n, total) {
  return (n % total) / total;
}

export function fogFactor(dist, density) {
  return 1 / (Math.pow(Math.E, (dist / DRAW_DIST) * (dist / DRAW_DIST) * density));
}
