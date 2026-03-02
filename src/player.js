// ============================================================================
// Player
// ============================================================================

import {
  ACCEL, BRAKE, DECEL, MAX_SPEED, OFF_ROAD_DECEL, UPHILL_DECEL,
  STEER_SPEED, CENTRIFUGAL, SEG_LEN, JUMP_GRAVITY, JUMP_SPEED_THRESHOLD, DT,
  COLLISION_Z, COLLISION_X, COLLISION_INVINCIBLE, COLLISION_SPEED_MULT, COLLISION_FLASH
} from './config.js';
import { game } from './state.js';
import { isUp, isDown, isLeft, isRight } from './input.js';
import { clamp } from './utils.js';
import { showBubble, isBubbleActive } from './dialogue.js';

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
        showBubble(event.text, 3, event.speaker);
      }
    }
  }
}

// --- Collision -----------------------------------------------------------

const COLLISION_LINES = [
  { speaker: 'driver', text: 'Eita! Dei uma encostadinha...' },
  { speaker: 'driver', text: 'Foi só um toquinho!' },
  { speaker: 'driver', text: 'A culpa é do outro!' },
  { speaker: 'driver', text: 'Calma, tá tudo bem!' },
  { speaker: 'driver', text: 'Ih, raspei o carro...' },
  { speaker: 'driver', text: 'O seguro cobre, relaxa!' },
  { speaker: 'wife',   text: 'EU SABIA! Eu avisei!' },
  { speaker: 'wife',   text: 'Olha pra frente, pelo amor!' },
  { speaker: 'wife',   text: 'Devolve a carteira, pelo amor de Deus!' },
  { speaker: 'wife',   text: 'Era pra ter ido de ônibus!' },
  { speaker: 'wife',   text: 'Meu Deus do céu!!!' },
  { speaker: 'wife',   text: 'Eu dirijo melhor que tu!' },
  { speaker: 'kid',    text: 'AEEE BATEU! De novo, pai!' },
  { speaker: 'kid',    text: 'Parece carrinho de bate-bate!' },
  { speaker: 'kid',    text: 'Faz de novo! Hahahaha!' },
  { speaker: 'kid',    text: 'O pai não sabe dirigir!' },
  { speaker: 'kid',    text: 'Iiih vai dar B.O.!' },
  { speaker: 'kid',    text: 'Mamãe, o pai bateu o carro!' },
];

function triggerCollision(car) {
  const player = game.player;

  // Speed penalty
  player.speed *= COLLISION_SPEED_MULT;

  // Invincibility grace period
  player.invincibleTimer = COLLISION_INVINCIBLE;

  // Screen flash
  player.collisionFlash = COLLISION_FLASH;

  // Lateral nudge away from the car
  const pushDir = player.x > car.offset ? 1 : -1;
  player.x += pushDir * 0.15;
  player.x = clamp(player.x, -2.5, 2.5);

  // Comedy speech bubble
  const line = COLLISION_LINES[Math.floor(Math.random() * COLLISION_LINES.length)];
  showBubble(line.text, 2.5, line.speaker);
}

function checkCollisions() {
  const player = game.player;

  // Tick down collision flash (always, even while invincible)
  if (player.collisionFlash > 0) player.collisionFlash -= DT;

  // Tick down invincibility — skip collision check if still active
  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= DT;
    return;
  }

  // No collisions while airborne (jumping over cars is fun)
  if (player.jumpH > 20) return;

  const playerSegIdx = Math.floor(player.z / SEG_LEN) % game.segments.length;

  // Check current segment and next 2 ahead
  for (let n = 0; n <= 2; n++) {
    const segIdx = (playerSegIdx + n) % game.segments.length;
    const seg = game.segments[segIdx];

    for (const car of seg.cars) {
      // Z proximity
      let dz = car.z - player.z;
      if (dz < 0) dz += game.trackLength;
      if (dz > COLLISION_Z) continue;

      // X overlap
      if (Math.abs(player.x - car.offset) < COLLISION_X) {
        triggerCollision(car);
        return;
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
  if (locationChanged && !isBubbleActive()) {
    showBubble(range.name, 3, 'driver');
  }

  // Collision detection
  checkCollisions();

  // Check if player reached the end (last location, near the end)
  const lastRange = game.locationRanges[game.locationRanges.length - 1];
  if (lastRange && segIdx >= lastRange.endIdx - 5 && player.speed > 0) {
    game.state = 'ARRIVAL';
  }

  // Move forward
  player.z += player.speed * DT;
  if (player.z >= game.trackLength) player.z -= game.trackLength;
}
