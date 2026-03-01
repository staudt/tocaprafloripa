// ============================================================================
// Road generation — procedural, data-driven by location configs
// ============================================================================

import { SEG_LEN, RUMBLE_LEN, ROAD_W } from './config.js';
import { game } from './state.js';
import { easeInOut } from './utils.js';
import { LOCATIONS } from './locations.js';

// --- Segment factory -----------------------------------------------------

function makeSegment(index, curve, y, location) {
  return {
    index: index,
    curve: curve,
    p1: { world: { x: 0, y: y, z: index * SEG_LEN }, camera: {}, screen: {} },
    p2: { world: { x: 0, y: y, z: (index + 1) * SEG_LEN }, camera: {}, screen: {} },
    color: null,
    palette: null,
    cars: [],
    sprites: [],
    // Per-segment properties from location
    locationId: location.id,
    lanes: location.lanes,
    roadWidth: location.roadWidth,
    twoWay: location.twoWay,
  };
}

// --- Low-level road builders ---------------------------------------------
// These push segments directly onto game.segments using the current location

let _currentLocation = null;

function addRoad(enter, hold, leave, curve, y) {
  const startY = game.segments.length === 0 ? 0 : game.segments[game.segments.length - 1].p2.world.y;
  const total = enter + hold + leave;
  for (let n = 0; n < total; n++) {
    const idx = game.segments.length;

    let c = 0;
    if (enter > 0 && n < enter) c = easeInOut(0, curve, n / enter);
    else if (n < enter + hold) c = curve;
    else if (leave > 0) c = easeInOut(curve, 0, (n - enter - hold) / leave);

    let elev = 0;
    if (enter > 0 && n < enter) elev = easeInOut(startY, startY + y, n / enter);
    else if (n < enter + hold) elev = startY + y;
    else if (leave > 0) elev = easeInOut(startY + y, startY + y, (n - enter - hold) / leave);
    else elev = startY + y;

    game.segments.push(makeSegment(idx, c, elev, _currentLocation));
  }
}

function addStraight(len)         { addRoad(len, len, len, 0, 0); }
function addCurve(len, curve)     { addRoad(len, len, len, curve, 0); }
function addHill(len, height)     { addRoad(len, 0, 0, 0, height); }
function addDownhill(len, height) { addRoad(len, 0, 0, 0, -height); }

function addBumps(count, len, height) {
  for (let i = 0; i < count; i++) {
    addRoad(len, 0, 0, 0, height);
    addRoad(len, 0, 0, 0, -height);
  }
}

// --- Procedural road generation ------------------------------------------

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(randBetween(min, max + 1));
}

/**
 * Generate road segments for a single location based on its config parameters.
 * Tracks actual segment count to respect the target length accurately.
 */
function generateLocationRoad(loc) {
  _currentLocation = loc;
  const targetCount = loc.length;
  const startCount = game.segments.length;

  function produced() { return game.segments.length - startCount; }

  while (produced() < targetCount) {
    const left = targetCount - produced();
    if (left < 6) {
      // Too few remaining for a proper stretch — just fill with straight
      addRoad(left, 0, 0, 0, 0);
      break;
    }

    // Pick a random stretch length (10-40 segments, capped by what's left)
    const stretchLen = Math.min(randInt(10, 40), left);
    const third = Math.max(2, Math.floor(stretchLen / 3));

    // Roll dice to decide what kind of stretch
    const roll = Math.random();
    const hasCurve = roll < loc.curves.frequency;
    const hasHill = (roll >= loc.curves.frequency && roll < loc.curves.frequency + loc.hills.frequency)
                 || (hasCurve && Math.random() < loc.hills.frequency);

    if (hasCurve && hasHill) {
      const curve = randBetween(loc.curves.minIntensity, loc.curves.maxIntensity) * (Math.random() < 0.5 ? 1 : -1);
      const height = randBetween(loc.hills.minHeight, loc.hills.maxHeight);
      const upLen = Math.floor(stretchLen / 2);
      const downLen = stretchLen - upLen;
      const enter = Math.min(third, Math.floor(upLen / 2));
      addRoad(enter, Math.max(0, upLen - enter * 2), enter, curve, height);
      addRoad(downLen, 0, 0, 0, -height);
    } else if (hasCurve) {
      const curve = randBetween(loc.curves.minIntensity, loc.curves.maxIntensity) * (Math.random() < 0.5 ? 1 : -1);
      const enter = Math.min(third, Math.floor(stretchLen / 2));
      addRoad(enter, Math.max(0, stretchLen - enter * 2), enter, curve, 0);
    } else if (hasHill) {
      const height = randBetween(loc.hills.minHeight, loc.hills.maxHeight);
      const upLen = Math.max(2, Math.floor(stretchLen / 2));
      const downLen = Math.max(2, stretchLen - upLen);
      addHill(upLen, height);
      addDownhill(downLen, height);
    } else {
      // Straight — use the full stretch (addStraight triples the len via enter/hold/leave)
      addRoad(stretchLen, 0, 0, 0, 0);
    }
  }
}

// --- Color assignment (per location palette) -----------------------------

function assignColors() {
  for (let i = 0; i < game.segments.length; i++) {
    const seg = game.segments[i];
    // Find which location this segment belongs to
    const range = game.locationRanges.find(r => i >= r.startIdx && i <= r.endIdx);
    const palette = range ? range.palette : LOCATIONS[0].palette;

    seg.color = (Math.floor(i / RUMBLE_LEN) % 2 === 0) ? palette.light : palette.dark;
    seg.palette = palette;
  }
}

export function getPalette(index) {
  return game.segments[index % game.segments.length].palette;
}

// --- Sprite placement (per location config) ------------------------------

const defaultBuildingColors = ['#889099', '#7a7068', '#a09080', '#8090a0', '#706860', '#9a8878'];
const defaultTreeColors = ['#2d8a2d', '#3a9a3a', '#1e7a1e', '#4a8a3a'];
const defaultPalmColors = ['#2a9e2a', '#3aae3a', '#1e8e2e'];

function placeSpritesForRange(range) {
  const loc = LOCATIONS.find(l => l.id === range.id);
  if (!loc || !loc.sprites) return;

  const freq = loc.sprites.frequency || 10;
  const types = loc.sprites.types || ['tree'];
  const colors = loc.sprites.colors
    || (types.includes('building') ? defaultBuildingColors
       : types.includes('palm') ? defaultPalmColors
       : defaultTreeColors);

  for (let i = range.startIdx; i <= range.endIdx; i++) {
    if (i % freq !== 0) continue;

    const seg = game.segments[i];
    const type = types[Math.floor(Math.random() * types.length)];
    const side = (Math.floor(i / freq) % 2 === 0) ? 1 : -1;

    const sprite = { type, color: colors[Math.floor(Math.random() * colors.length)] };

    if (type === 'building') {
      sprite.offset = side * (1.8 + Math.random() * 0.7);
      sprite.height = 1.5 + Math.random() * 2.5;
    } else if (type === 'palm') {
      sprite.offset = side * (1.5 + Math.random() * 0.5);
      sprite.height = 0.8 + Math.random() * 0.3;
    } else {
      // tree
      sprite.offset = side * (1.5 + Math.random() * 0.5);
      sprite.height = 0.7 + Math.random() * 0.5;
    }

    seg.sprites.push(sprite);
  }
}

// --- Main track builder --------------------------------------------------

export function buildTrack() {
  game.segments = [];
  game.locationRanges = [];

  // Generate road for each location
  for (const loc of LOCATIONS) {
    const startIdx = game.segments.length;
    generateLocationRoad(loc);
    const endIdx = game.segments.length - 1;

    // Clone events so we can mark them as fired per-playthrough
    const events = (loc.events || []).map(e => ({ ...e, fired: false }));

    game.locationRanges.push({
      id: loc.id,
      name: loc.name,
      startIdx,
      endIdx,
      events,
      palette: loc.palette,
    });
  }

  // Smooth elevation: each segment's p2.y matches the next segment's p1.y
  for (let i = 0; i < game.segments.length - 1; i++) {
    game.segments[i].p2.world.y = game.segments[i + 1].p1.world.y;
  }
  // Last segment connects to first (for wrapping)
  game.segments[game.segments.length - 1].p2.world.y = game.segments[0].p1.world.y;

  game.trackLength = game.segments.length * SEG_LEN;

  // Assign colors and place sprites
  assignColors();
  for (const range of game.locationRanges) {
    placeSpritesForRange(range);
  }
}
