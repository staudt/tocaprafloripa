// ============================================================================
// Shared game state
// ============================================================================

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

export const game = {
  canvas,
  ctx,

  // Game state: 'MENU' | 'CAR_SELECT' | 'PLAYING' | 'GAS_STATION' | 'GAME_OVER' | 'ARRIVAL'
  state: 'MENU',

  // Road
  segments: [],
  trackLength: 0,

  // Location tracking
  locationRanges: [],   // [{ id, name, startIdx, endIdx, events }]
  currentLocation: null,

  // Traffic
  cars: [],

  // Player
  player: {
    z: 0,
    x: 0,      // -2..2 = on road, beyond = off road
    speed: 0,
    jumpH: 0,        // current jump height in pixels
    jumpV: 0,        // current jump velocity in pixels/s
    climbH: 0,       // accumulated elevation gain during current uphill
  },

  // Speech bubble
  currentSection: '',
  bubbleTimer: 0,
  bubbleText: '',
  bubbleSide: 'left',
};
