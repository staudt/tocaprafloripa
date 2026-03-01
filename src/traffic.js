// ============================================================================
// Traffic cars
// ============================================================================

import { MAX_SPEED, DT, SEG_LEN } from './config.js';
import { game } from './state.js';
import { LOCATIONS } from './locations.js';

const carColors = ['#cc2222', '#2266cc', '#22cc44', '#cccc22', '#cc6622', '#8822cc',
                    '#cc2288', '#22cccc', '#ffffff', '#ff6644', '#4488ff', '#44ff88'];

export function spawnCars() {
  game.cars = [];
  let colorIdx = 0;

  // Spawn traffic per-location based on each location's density and speed range
  for (const range of game.locationRanges) {
    const loc = LOCATIONS.find(l => l.id === range.id);
    if (!loc) continue;

    const density = loc.traffic.density || 8;
    const [minSpd, maxSpd] = loc.traffic.speedRange || [0.3, 0.6];
    const lanes = loc.lanes || 3;
    const startZ = range.startIdx * SEG_LEN;
    const endZ = (range.endIdx + 1) * SEG_LEN;

    for (let i = 0; i < density; i++) {
      const lane = Math.floor(Math.random() * lanes);
      const offset = lanes > 1 ? -0.7 + (lane / (lanes - 1)) * 1.4 : 0;
      const z = startZ + Math.random() * (endZ - startZ);
      const speed = MAX_SPEED * (minSpd + Math.random() * (maxSpd - minSpd));

      game.cars.push({
        offset,
        z,
        speed,
        color: carColors[colorIdx % carColors.length],
      });
      colorIdx++;
    }
  }
}

export function updateCars() {
  for (const car of game.cars) {
    car.z += car.speed * DT;
    if (car.z >= game.trackLength) car.z -= game.trackLength;

    const newSegIdx = Math.floor(car.z / SEG_LEN) % game.segments.length;
    if (newSegIdx !== car._segIdx) {
      if (car._segIdx !== undefined) {
        const old = game.segments[car._segIdx];
        const ci = old.cars.indexOf(car);
        if (ci !== -1) old.cars.splice(ci, 1);
      }
      game.segments[newSegIdx].cars.push(car);
      car._segIdx = newSegIdx;
    }
  }
}
