// ============================================================================
// Constants & Configuration
// ============================================================================

export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const FPS = 60;
export const DT = 1 / FPS;

export const FOV = 100;                                         // degrees
export const CAMERA_DEPTH = 1 / Math.tan((FOV / 2) * Math.PI / 180); // ~0.84
export const CAMERA_H = 1000;                                   // height above road (world units)
export const ROAD_W = 2000;                                     // road half-width = 1000
export const SEG_LEN = 200;                                     // world units per segment
export const DRAW_DIST = 250;                                   // segments to render ahead
export const LANES = 3;
export const RUMBLE_LEN = 3;                                    // segments per rumble strip cycle

export const ACCEL = 0.0008;
export const BRAKE = 0.008;
export const DECEL = 0.001;                                     // natural deceleration
export const OFF_ROAD_DECEL = 0.05;
export const UPHILL_DECEL = 0.0012;                             // speed penalty per unit slope
export const STEER_SPEED = 0.035;
export const CENTRIFUGAL = 0.8;
export const MAX_SPEED = 6000;                                  // capped at 160 km/h display
export const JUMP_GRAVITY = 2000;                               // pixels/s^2 pulling car back down
export const JUMP_SPEED_THRESHOLD = 0.5;                        // min speed % to trigger a jump

export const NUM_CARS = 12;

// Collision
export const COLLISION_Z = 300;          // world units — Z proximity threshold
export const COLLISION_X = 0.35;         // road half-widths — lateral overlap threshold
export const COLLISION_INVINCIBLE = 2;   // seconds of post-collision grace
export const COLLISION_SPEED_MULT = 0.6; // multiply speed on hit (lose 40%)
export const COLLISION_FLASH = 0.3;      // seconds of red screen flash

// --- Color palettes per road section -------------------------------------

export const COLORS = {
  city: {
    sky: '#8899aa', skyHorizon: '#aabbcc',
    light: { road: '#555555', grass: '#888888', rumble: '#cccccc', lane: '#ffffff' },
    dark:  { road: '#444444', grass: '#777777', rumble: '#555555', lane: '' },
  },
  highway: {
    sky: '#7799cc', skyHorizon: '#aaccdd',
    light: { road: '#6b6b6b', grass: '#997755', rumble: '#cc4422', lane: '#ffffff' },
    dark:  { road: '#5a5a5a', grass: '#886644', rumble: '#ffffff', lane: '' },
  },
  country: {
    sky: '#4488cc', skyHorizon: '#88bbdd',
    light: { road: '#6b6b6b', grass: '#44aa44', rumble: '#cc4422', lane: '#ffffff' },
    dark:  { road: '#5a5a5a', grass: '#338833', rumble: '#ffffff', lane: '' },
  },
  coast: {
    sky: '#2299dd', skyHorizon: '#66ccee',
    light: { road: '#6b6b6b', grass: '#ccbb77', rumble: '#cc4422', lane: '#ffffff' },
    dark:  { road: '#5a5a5a', grass: '#bbaa66', rumble: '#ffffff', lane: '' },
  },
};
