// ============================================================================
// Input handling
// ============================================================================

export const keys = {};

document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

export function isUp()    { return keys['ArrowUp']    || keys['w'] || keys['W']; }
export function isDown()  { return keys['ArrowDown']  || keys['s'] || keys['S']; }
export function isLeft()  { return keys['ArrowLeft']  || keys['a'] || keys['A']; }
export function isRight() { return keys['ArrowRight'] || keys['d'] || keys['D']; }
