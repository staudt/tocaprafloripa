// ============================================================================
// Toca pra Floripa — Main entry point
// ============================================================================

import { game } from './state.js';
import { keys } from './input.js';
import { buildTrack } from './road.js';
import { spawnCars, updateCars } from './traffic.js';
import { updatePlayer } from './player.js';
import { render } from './render.js';
import { drawMenuScreen, drawArrivalScreen, drawGameOverScreen } from './screens.js';

// --- Init ----------------------------------------------------------------

function initGame() {
  game.player.z = 0;
  game.player.x = 0;
  game.player.speed = 0;
  game.player.jumpH = 0;
  game.player.jumpV = 0;
  game.player.climbH = 0;
  game.currentSection = '';
  game.currentLocation = null;
  game.bubbleTimer = 0;
  game.bubbleText = '';
  game.bubbleSide = 'left';

  buildTrack();
  spawnCars();
}

// --- Game loop -----------------------------------------------------------

// Debounce Enter key so a single press doesn't skip through states
let enterWasDown = false;

function frame() {
  const enterPressed = keys['Enter'] && !enterWasDown;
  enterWasDown = !!keys['Enter'];

  switch (game.state) {
    case 'MENU':
      drawMenuScreen();
      if (enterPressed) {
        initGame();
        game.state = 'PLAYING';
      }
      break;

    case 'PLAYING':
      updatePlayer();
      updateCars();
      render();
      break;

    case 'ARRIVAL':
      drawArrivalScreen();
      if (enterPressed) {
        game.state = 'MENU';
      }
      break;

    case 'GAME_OVER':
      drawGameOverScreen();
      if (enterPressed) {
        game.state = 'MENU';
      }
      break;
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
