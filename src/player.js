// ============================================================================
// Player
// ============================================================================

import {
  ACCEL, BRAKE, DECEL, MAX_SPEED, OFF_ROAD_DECEL, UPHILL_DECEL,
  STEER_SPEED, CENTRIFUGAL, SEG_LEN, JUMP_GRAVITY, JUMP_SPEED_THRESHOLD, DT
} from './config.js';
import { game } from './state.js';
import { isUp, isDown, isLeft, isRight } from './input.js';
import { clamp } from './utils.js';

// --- Location & event helpers --------------------------------------------

function getCurrentLocationRange(segIdx) {
  for (const range of game.locationRanges) {
    if (segIdx >= range.startIdx && segIdx <= range.endIdx) {
      return range;
    }
  }
  return game.locationRanges[0];
}

function checkEvents(range, segIdx) {
  if (!range || !range.events) return;
  const total = range.endIdx - range.startIdx + 1;
  const progress = (segIdx - range.startIdx) / total;

  for (const event of range.events) {
    if (event.fired) continue;
    if (progress >= event.at) {
      event.fired = true;
      if (event.type === 'dialogue') {
        game.bubbleText = event.text;
        game.bubbleTimer = 3;
        game.bubbleSide = event.speaker === 'driver' ? 'left' : 'right';
      }
    }
  }
}

// --- Main update ---------------------------------------------------------

export function updatePlayer() {
  const player = game.player;
  const speedPct = player.speed / MAX_SPEED;

  // Acceleration / braking
  if (isUp())        player.speed += ACCEL * MAX_SPEED;
  else if (isDown()) player.speed -= BRAKE * MAX_SPEED;
  else               player.speed -= DECEL * MAX_SPEED;

  // Off-road penalty
  if (Math.abs(player.x) > 2.1 && player.speed > MAX_SPEED * 0.2) {
    player.speed -= OFF_ROAD_DECEL * MAX_SPEED;
  }

  // Uphill speed penalty
  const segIdx = Math.floor(player.z / SEG_LEN) % game.segments.length;
  const seg = game.segments[segIdx];
  const slope = (seg.p2.world.y - seg.p1.world.y) / SEG_LEN;

  if (slope > 0) {
    player.speed -= slope * UPHILL_DECEL * MAX_SPEED;
    player.climbH += slope * player.speed * DT;
  } else {
    if (player.jumpH === 0 && player.climbH > 100 && speedPct > JUMP_SPEED_THRESHOLD) {
      player.jumpV = clamp(player.climbH / 800, 0.5, 3.0) * speedPct * 400;
    }
    player.climbH = 0;
  }

  player.speed = clamp(player.speed, 0, MAX_SPEED);

  // Jump physics
  if (player.jumpV > 0 || player.jumpH > 0) {
    player.jumpH += player.jumpV * DT;
    player.jumpV -= JUMP_GRAVITY * DT;
    if (player.jumpH <= 0) {
      player.jumpH = 0;
      player.jumpV = 0;
    }
  }

  // Steering
  const steerMul = player.jumpH > 0 ? 0.2 : 1;
  if (isLeft())  player.x -= STEER_SPEED * speedPct * steerMul;
  if (isRight()) player.x += STEER_SPEED * speedPct * steerMul;

  // Centrifugal force
  player.x -= seg.curve * speedPct * speedPct * CENTRIFUGAL * DT * steerMul;

  player.x = clamp(player.x, -2.5, 2.5);

  // Location-based section detection
  const range = getCurrentLocationRange(segIdx);
  const locationChanged = range && range.id !== (game.currentLocation && game.currentLocation.id);
  if (locationChanged) {
    game.currentLocation = range;
    game.currentSection = range.name;
  }

  // Check scripted events (events take priority over location-name bubble)
  checkEvents(range, segIdx);

  // If location just changed and no event dialogue is showing, show location name
  if (locationChanged && game.bubbleTimer <= 0) {
    game.bubbleText = range.name;
    game.bubbleTimer = 3;
    game.bubbleSide = 'left';
  }

  if (game.bubbleTimer > 0) game.bubbleTimer -= DT;

  // Check if player reached the end (last location, near the end)
  const lastRange = game.locationRanges[game.locationRanges.length - 1];
  if (lastRange && segIdx >= lastRange.endIdx - 5 && player.speed > 0) {
    game.state = 'ARRIVAL';
  }

  // Move forward
  player.z += player.speed * DT;
  if (player.z >= game.trackLength) player.z -= game.trackLength;
}
