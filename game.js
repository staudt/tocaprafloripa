// ============================================================================
// City to Beach — Outrun-style pseudo-3D driving game
// ============================================================================

(function () {
  'use strict';

  // --- Constants -----------------------------------------------------------

  const CANVAS_W = 960;
  const CANVAS_H = 540;
  const FPS = 60;
  const DT = 1 / FPS;

  const FOV = 100;                                         // degrees
  const CAMERA_DEPTH = 1 / Math.tan((FOV / 2) * Math.PI / 180); // ~0.84
  const CAMERA_H = 1000;                                   // height above road (world units)
  const ROAD_W = 2000;                                     // road half-width = 1000
  const SEG_LEN = 200;                                     // world units per segment
  const DRAW_DIST = 250;                                   // segments to render ahead
  const LANES = 3;
  const RUMBLE_LEN = 3;                                    // segments per rumble strip cycle

  const ACCEL = 0.0008;
  const BRAKE = 0.008;
  const DECEL = 0.001;                                     // natural deceleration
  const OFF_ROAD_DECEL = 0.05;
  const UPHILL_DECEL = 0.0012;                             // speed penalty per unit slope
  const STEER_SPEED = 0.035;
  const CENTRIFUGAL = 0.8;
  const MAX_SPEED = 6000;                                  // capped at 160 km/h display
  const JUMP_GRAVITY = 2000;                               // pixels/s^2 pulling car back down
  const JUMP_SPEED_THRESHOLD = 0.5;                        // min speed % to trigger a jump

  const NUM_CARS = 12;

  // --- Color palettes per road section -------------------------------------

  const COLORS = {
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

  // --- Canvas setup --------------------------------------------------------

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  // --- Key tracking --------------------------------------------------------

  const keys = {};
  document.addEventListener('keydown', (e) => { keys[e.key] = true; });
  document.addEventListener('keyup', (e) => { keys[e.key] = false; });

  function isUp()    { return keys['ArrowUp']    || keys['w'] || keys['W']; }
  function isDown()  { return keys['ArrowDown']  || keys['s'] || keys['S']; }
  function isLeft()  { return keys['ArrowLeft']  || keys['a'] || keys['A']; }
  function isRight() { return keys['ArrowRight'] || keys['d'] || keys['D']; }

  // --- Utility -------------------------------------------------------------

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Ease in/out for smooth hill and curve transitions
  function easeInOut(a, b, t) {
    return a + (b - a) * (-Math.cos(t * Math.PI) / 2 + 0.5);
  }

  // Percent of the segment that the player has crossed
  function percentRemaining(n, total) {
    return (n % total) / total;
  }

  // Fog factor: exponential, 0 = no fog, 1 = full fog
  function fogFactor(dist, density) {
    return 1 / (Math.pow(Math.E, (dist / DRAW_DIST) * (dist / DRAW_DIST) * density));
  }

  // =========================================================================
  // Road generation
  // =========================================================================

  let segments = [];
  let trackLength = 0;
  let cars = [];

  function makeSegment(index, curve, y) {
    return {
      index: index,
      curve: curve,
      p1: { world: { x: 0, y: y, z: index * SEG_LEN }, camera: {}, screen: {} },
      p2: { world: { x: 0, y: y, z: (index + 1) * SEG_LEN }, camera: {}, screen: {} },
      color: null, // assigned after full track generation
      cars: [],
      sprites: [],
    };
  }

  // Add a stretch of road
  function addRoad(enter, hold, leave, curve, y) {
    const startY = segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y;
    const total = enter + hold + leave;
    for (let n = 0; n < total; n++) {
      const idx = segments.length;

      // Smooth interpolation for curve entry/hold/exit
      let c = 0;
      if (n < enter) c = easeInOut(0, curve, n / enter);
      else if (n < enter + hold) c = curve;
      else c = easeInOut(curve, 0, (n - enter - hold) / leave);

      // Smooth interpolation for elevation
      let elev = 0;
      if (n < enter) elev = easeInOut(startY, startY + y, n / enter);
      else if (n < enter + hold) elev = startY + y;
      else elev = easeInOut(startY + y, startY + y, (n - enter - hold) / leave);
      // Actually for leaving, bring elevation to the new level (startY + y)
      // We want it to STAY at startY+y after the hill — this is cumulative

      segments.push(makeSegment(idx, c, elev));
    }
  }

  function addStraight(len)       { addRoad(len, len, len, 0, 0); }
  function addCurve(len, curve)   { addRoad(len, len, len, curve, 0); }
  function addHill(len, height)   { addRoad(len, 0, 0, 0, height); }
  function addDownhill(len, height){ addRoad(len, 0, 0, 0, -height); }
  function addSCurve() {
    addRoad(5, 15, 5, 2, 0);
    addRoad(5, 15, 5, -4, 0);
    addRoad(5, 15, 5, 3, 0);
    addRoad(5, 15, 5, -2, 0);
  }
  function addBumps(count, len, height) {
    for (let i = 0; i < count; i++) {
      addRoad(len, 0, 0, 0, height);
      addRoad(len, 0, 0, 0, -height);
    }
  }
  function addLowRollingHills(len, height) {
    addRoad(len, 0, 0, 0, height);
    addRoad(len, 0, 0, 0, -height);
    addRoad(len, 0, 0, 0, height * 0.6);
    addRoad(len, 0, 0, 0, -height * 0.6);
  }

  // Assign colors based on segment index (rumble alternation) and track section
  function assignColors() {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      let palette;
      const pct = i / segments.length;
      if (pct < 0.19)      palette = COLORS.city;
      else if (pct < 0.50) palette = COLORS.highway;
      else if (pct < 0.82) palette = COLORS.country;
      else                  palette = COLORS.coast;

      seg.color = (Math.floor(i / RUMBLE_LEN) % 2 === 0) ? palette.light : palette.dark;
      seg.palette = palette;
    }
  }

  // Get palette for a given segment index
  function getPalette(index) {
    return segments[index % segments.length].palette;
  }

  function buildTrack() {
    segments = [];

    // === City section (short tight curves, flat, urban feel) ===
    addStraight(20);
    addCurve(24, 2);
    addStraight(10);
    addCurve(20, -3);
    addBumps(4, 6, 200);
    addStraight(12);
    addCurve(16, 2);
    addCurve(16, -2);
    addStraight(10);
    addCurve(30, -2);
    addBumps(6, 4, 150);
    addStraight(12);
    addCurve(20, 3);
    addStraight(16);

    // === Highway section (long sweeping curves, few but sustained) ===
    addStraight(30);
    addHill(30, 1200);
    addDownhill(30, 1200);
    addRoad(30, 120, 30, 3, 0);           // long sweeping right
    addStraight(40);
    addRoad(30, 100, 30, -2.5, 0);        // long gentle left
    addHill(20, 800);
    addDownhill(20, 800);
    addStraight(24);
    addRoad(20, 80, 20, -3, 0);           // long sweeping left
    addRoad(20, 80, 20, 2.5, 0);          // long sweeping right (S-shape)
    addStraight(20);
    addHill(40, 1500);
    addDownhill(40, 1500);
    addRoad(30, 140, 30, -2, 0);          // very long gentle left

    // === Countryside (dramatic hills, mix of long and tight curves) ===
    addHill(40, 2500);
    addDownhill(40, 2500);
    addRoad(20, 70, 20, 4, 0);            // long sharp right
    addLowRollingHills(20, 1200);
    addCurve(24, -5);                      // short tight left
    addStraight(12);
    addCurve(20, 4);                       // short tight right
    addHill(24, 1800);
    addDownhill(24, 1800);
    addRoad(20, 60, 20, -3, 0);           // medium left curve over terrain
    addBumps(6, 8, 600);
    addHill(50, 3000);
    addDownhill(50, 3000);
    addSCurve();
    addSCurve();
    addLowRollingHills(16, 800);
    addRoad(20, 50, 20, 3, 0);            // medium right
    addBumps(8, 6, 500);

    // === Coast (long gentle curves, relaxed) ===
    addStraight(16);
    addBumps(6, 8, 300);
    addRoad(24, 90, 24, -2, 0);           // long gentle left
    addLowRollingHills(12, 400);
    addStraight(16);
    addRoad(20, 70, 20, 1.5, 0);          // long gentle right
    addBumps(4, 6, 200);
    addCurve(24, -1.5);
    addStraight(30);

    // Smooth elevation: each segment's p2.y should match the next segment's p1.y
    for (let i = 0; i < segments.length - 1; i++) {
      segments[i].p2.world.y = segments[i + 1].p1.world.y;
    }
    segments[segments.length - 1].p2.world.y = segments[0].p1.world.y;

    trackLength = segments.length * SEG_LEN;
    assignColors();
    placeSprites();
  }

  function placeSprites() {
    const buildingColors = ['#889099', '#7a7068', '#a09080', '#8090a0', '#706860', '#9a8878'];
    const treeGreens = ['#2d8a2d', '#3a9a3a', '#1e7a1e', '#4a8a3a'];
    const palmGreens = ['#2a9e2a', '#3aae3a', '#1e8e2e'];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const palette = seg.palette;
      const isCity = palette === COLORS.city;
      const isHighway = palette === COLORS.highway;
      const isCountry = palette === COLORS.country;
      const isCoast = palette === COLORS.coast;

      if (isCity && i % 8 === 0) {
        const side = (i % 16 < 8) ? 1 : -1;
        seg.sprites.push({
          type: 'building',
          offset: side * (1.8 + Math.random() * 0.7),
          height: 1.5 + Math.random() * 2.5,
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
        });
      } else if (isHighway && i % 15 === 0) {
        const side = (i % 30 < 15) ? 1 : -1;
        seg.sprites.push({
          type: 'tree',
          offset: side * (1.5 + Math.random() * 0.5),
          height: 0.8 + Math.random() * 0.4,
          color: treeGreens[Math.floor(Math.random() * treeGreens.length)],
        });
      } else if (isCountry && i % 12 === 0) {
        const side = (i % 24 < 12) ? 1 : -1;
        seg.sprites.push({
          type: 'tree',
          offset: side * (1.5 + Math.random() * 0.5),
          height: 0.7 + Math.random() * 0.5,
          color: treeGreens[Math.floor(Math.random() * treeGreens.length)],
        });
      } else if (isCoast && i % 15 === 0) {
        const side = (i % 30 < 15) ? 1 : -1;
        seg.sprites.push({
          type: 'palm',
          offset: side * (1.5 + Math.random() * 0.5),
          height: 0.8 + Math.random() * 0.3,
          color: palmGreens[Math.floor(Math.random() * palmGreens.length)],
        });
      }
    }
  }

  // =========================================================================
  // Traffic cars
  // =========================================================================

  function spawnCars() {
    cars = [];
    const carColors = ['#cc2222', '#2266cc', '#22cc44', '#cccc22', '#cc6622', '#8822cc',
                        '#cc2288', '#22cccc', '#ffffff', '#ff6644', '#4488ff', '#44ff88'];
    for (let i = 0; i < NUM_CARS; i++) {
      const lane = Math.floor(Math.random() * LANES);
      const offset = -0.7 + (lane / (LANES - 1)) * 1.4; // distribute across lanes
      const z = Math.random() * trackLength;
      const speed = MAX_SPEED * (0.3 + Math.random() * 0.5); // 30-80% of max
      cars.push({
        offset: offset,
        z: z,
        speed: speed,
        color: carColors[i % carColors.length],
      });
    }
  }

  function updateCars() {
    for (const car of cars) {
      car.z += car.speed * DT;
      if (car.z >= trackLength) car.z -= trackLength;

      const newSegIdx = Math.floor(car.z / SEG_LEN) % segments.length;
      if (newSegIdx !== car._segIdx) {
        // Remove from old segment
        if (car._segIdx !== undefined) {
          const old = segments[car._segIdx];
          const ci = old.cars.indexOf(car);
          if (ci !== -1) old.cars.splice(ci, 1);
        }
        segments[newSegIdx].cars.push(car);
        car._segIdx = newSegIdx;
      }
    }
  }

  // =========================================================================
  // Player
  // =========================================================================

  const player = {
    z: 0,
    x: 0,      // -2..2 = on road, beyond = off road
    speed: 0,
    jumpH: 0,        // current jump height in pixels
    jumpV: 0,        // current jump velocity in pixels/s
    climbH: 0,       // accumulated elevation gain during current uphill
  };

  // Speech bubble state
  let currentSection = 'CITY';
  let bubbleTimer = 3;       // start with CITY bubble showing
  let bubbleText = 'CITY';

  function updatePlayer() {
    const speedPct = player.speed / MAX_SPEED;

    // Acceleration / braking
    if (isUp())        player.speed += ACCEL * MAX_SPEED;
    else if (isDown()) player.speed -= BRAKE * MAX_SPEED;
    else               player.speed -= DECEL * MAX_SPEED;

    // Off-road penalty
    if (Math.abs(player.x) > 2.1 && player.speed > MAX_SPEED * 0.2) {
      player.speed -= OFF_ROAD_DECEL * MAX_SPEED;
    }

    // Uphill speed penalty (slope = elevation change per segment length)
    const segIdx = Math.floor(player.z / SEG_LEN) % segments.length;
    const seg = segments[segIdx];
    const slope = (seg.p2.world.y - seg.p1.world.y) / SEG_LEN;

    if (slope > 0) {
      player.speed -= slope * UPHILL_DECEL * MAX_SPEED;
      player.climbH += slope * player.speed * DT;
    } else {
      // Jump: detect crest (was climbing, now flat/downhill) at high speed
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

    // Steering (reduced at low speed, disabled in air)
    const steerMul = player.jumpH > 0 ? 0.2 : 1;
    if (isLeft())  player.x -= STEER_SPEED * speedPct * steerMul;
    if (isRight()) player.x += STEER_SPEED * speedPct * steerMul;

    // Centrifugal force from curves (reduced in air)
    player.x -= seg.curve * speedPct * speedPct * CENTRIFUGAL * DT * steerMul;

    player.x = clamp(player.x, -2.5, 2.5);

    // Section change detection (speech bubble)
    const secPct = segIdx / segments.length;
    let section = 'CITY';
    if (secPct >= 0.19 && secPct < 0.50) section = 'HIGHWAY';
    else if (secPct >= 0.50 && secPct < 0.82) section = 'COUNTRYSIDE';
    else if (secPct >= 0.82) section = 'COAST';

    if (section !== currentSection) {
      currentSection = section;
      bubbleText = section;
      bubbleTimer = 3;
    }
    if (bubbleTimer > 0) bubbleTimer -= DT;

    // Move forward
    player.z += player.speed * DT;
    if (player.z >= trackLength) player.z -= trackLength;
  }

  // =========================================================================
  // Projection
  // =========================================================================

  function project(p, cameraX, cameraY, cameraZ) {
    p.camera.x = p.world.x - cameraX;
    p.camera.y = p.world.y - cameraY;
    p.camera.z = p.world.z - cameraZ;

    // Handle wrapping: if camera z near end of track
    if (p.camera.z < 0) p.camera.z += trackLength;

    if (p.camera.z <= 0) {
      p.screen.scale = 0;
      p.screen.x = 0;
      p.screen.y = CANVAS_H;
      p.screen.w = 0;
      return;
    }

    const scale = CAMERA_DEPTH / p.camera.z;
    p.screen.scale = scale;
    p.screen.x = Math.round(CANVAS_W / 2 + scale * p.camera.x * CANVAS_W / 2);
    p.screen.y = Math.round(CANVAS_H / 2 - scale * p.camera.y * CANVAS_H / 2);
    p.screen.w = Math.round(scale * ROAD_W * CANVAS_W / 2);
  }

  // =========================================================================
  // Rendering primitives
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

    // Don't draw if fully clipped
    if (p1.y <= p2.y) return;
    if (p2.y >= clipY) return;

    // Clip bottom edge: when p1 projects below clipY, interpolate x and w
    // at the clip boundary so the road width matches the visible edge
    let bottomY = p1.y, bottomX = p1.x, bottomW = p1.w;
    if (p1.y > clipY) {
      const t = (clipY - p2.y) / (p1.y - p2.y);
      bottomX = lerp(p2.x, p1.x, t);
      bottomW = lerp(p2.w, p1.w, t);
      bottomY = clipY;
    }

    const topY = Math.max(p2.y, 0);

    // Grass: full-width band
    if (bottomY > topY) {
      ctx.fillStyle = color.grass;
      ctx.fillRect(0, topY, CANVAS_W, bottomY - topY);
    }

    // Rumble strips (15% wider than road on each side)
    const rumbleW1 = bottomW * 1.15;
    const rumbleW2 = p2.w * 1.15;
    drawPolygon(color.rumble, bottomX, bottomY, rumbleW1, p2.x, topY, rumbleW2);
    // Road on top of rumble
    drawPolygon(color.road, bottomX, bottomY, bottomW, p2.x, topY, p2.w);

    // Lane markings (only on "light" segments = when lane color is set)
    if (color.lane) {
      const laneW1 = bottomW * 0.02;
      const laneW2 = p2.w * 0.02;
      const laneOffset1 = bottomW / LANES;
      const laneOffset2 = p2.w / LANES;
      for (let lane = 1; lane < LANES; lane++) {
        const lx1 = bottomX + (lane * 2 - LANES) * laneOffset1 / 2 * 2;
        const lx2 = p2.x + (lane * 2 - LANES) * laneOffset2 / 2 * 2;
        drawPolygon(color.lane, lx1, bottomY, laneW1, lx2, topY, laneW2);
      }
    }
  }

  function drawCarSprite(car, seg, clipY) {
    const p = seg.p1.screen;
    const scale = p.scale;
    if (scale <= 0) return;

    const w = ROAD_W * 0.18 * scale * CANVAS_W / 2;
    const h = w * 1.4; // taller than wide
    const x = p.x + car.offset * p.w;
    const y = p.y;

    // Skip cars fully below the clip line (behind a hill)
    if (y - h >= clipY) return;

    // Main body
    ctx.fillStyle = car.color;
    ctx.fillRect(x - w / 2, y - h, w, h);

    // Dark left side for simple 3D shading
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - w / 2, y - h, w * 0.3, h);

    // Windshield (darker top portion)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - w * 0.35, y - h * 0.95, w * 0.7, h * 0.3);
  }

  function drawRoadsideSprite(sprite, seg, clipY) {
    const p = seg.p1.screen;
    const scale = p.scale;
    if (scale <= 0) return;

    const x = p.x + sprite.offset * p.w;
    const y = p.y;

    if (sprite.type === 'building') {
      const w = ROAD_W * 0.9 * scale * CANVAS_W / 2;
      const h = w * sprite.height;
      if (y - h >= clipY) return;

      // Building body
      ctx.fillStyle = sprite.color;
      ctx.fillRect(x - w / 2, y - h, w, h);

      // Shading on left side
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x - w / 2, y - h, w * 0.3, h);

      // Windows (grid of small dark rectangles)
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
      const trunkW = ROAD_W * 0.06 * scale * CANVAS_W / 2;
      const trunkH = trunkW * 3 * sprite.height;
      const canopyW = trunkW * 4;
      const canopyH = trunkH * 1.2;
      const totalH = trunkH + canopyH;
      if (y - totalH >= clipY) return;

      // Trunk
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH);

      // Canopy (triangle)
      ctx.fillStyle = sprite.color;
      ctx.beginPath();
      ctx.moveTo(x, y - totalH);
      ctx.lineTo(x - canopyW / 2, y - trunkH);
      ctx.lineTo(x + canopyW / 2, y - trunkH);
      ctx.closePath();
      ctx.fill();

    } else if (sprite.type === 'palm') {
      const trunkW = ROAD_W * 0.05 * scale * CANVAS_W / 2;
      const trunkH = trunkW * 5 * sprite.height;
      if (y - trunkH * 1.3 >= clipY) return;

      // Trunk (slight lean)
      const lean = sprite.offset > 0 ? trunkW * 1.5 : -trunkW * 1.5;
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = Math.max(1, trunkW);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + lean * 0.5, y - trunkH * 0.5, x + lean, y - trunkH);
      ctx.stroke();

      // Fronds (cluster of green circles at top)
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
    const w = 60;
    const h = 80;
    const x = CANVAS_W / 2;
    const y = CANVAS_H - 20 - player.jumpH;

    // Shadow on ground when airborne
    if (player.jumpH > 0) {
      const groundY = CANVAS_H - 20;
      const shadowScale = 1 - player.jumpH / 300;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x - w * shadowScale / 2, groundY - 4, w * shadowScale, 4);
    }

    // Car body
    ctx.fillStyle = '#2255ee';
    ctx.fillRect(x - w / 2, y - h, w, h);

    // Dark left side
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - w / 2, y - h, w * 0.3, h);

    // Windshield
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - w * 0.35, y - h * 0.95, w * 0.7, h * 0.3);

    // Steer visual: slight tilt
    if (isLeft()) {
      ctx.fillStyle = '#2255ee';
      ctx.fillRect(x - w / 2 - 4, y - h + 10, 4, h - 20);
    }
    if (isRight()) {
      ctx.fillStyle = '#2255ee';
      ctx.fillRect(x + w / 2, y - h + 10, 4, h - 20);
    }
  }

  // side: 'left' (driver) or 'right' (passenger)
  function drawSpeechBubble(text, timer, side) {
    if (timer <= 0) return;

    const alpha = timer < 0.5 ? timer / 0.5 : 1;
    const carX = CANVAS_W / 2;
    const carTopY = CANVAS_H - 20 - player.jumpH - 80;

    // Measure text for dynamic bubble sizing
    ctx.font = 'bold 14px monospace';
    const textW = ctx.measureText(text).width;
    const padX = 12;
    const padY = 8;
    const bw = textW + padX * 2;
    const bh = 26;
    const tailH = 10;
    const r = 8;

    // Position: left side = bubble ends at car left edge, right = starts at car right edge
    const bx = side === 'left' ? carX - 30 - bw : carX + 30;
    const by = carTopY - 20 - tailH - bh;

    // Tail x position: near the car-side edge of the bubble
    const tailX = side === 'left' ? bx + bw - 20 : bx + 20;

    ctx.globalAlpha = alpha;

    // Bubble background (rounded rect)
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

    // Tail (triangle pointing down from bottom of bubble toward car)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(tailX - 6, by + bh);
    ctx.lineTo(tailX + 6, by + bh);
    ctx.lineTo(tailX, by + bh + tailH);
    ctx.closePath();
    ctx.fill();
    // Tail border (only the two outer edges, not the top shared with bubble)
    ctx.beginPath();
    ctx.moveTo(tailX - 6, by + bh);
    ctx.lineTo(tailX, by + bh + tailH);
    ctx.lineTo(tailX + 6, by + bh);
    ctx.strokeStyle = '#333333';
    ctx.stroke();

    // Cover the tail-bubble seam with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tailX - 5, by + bh - 2, 10, 4);

    // Text
    ctx.fillStyle = '#222222';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(text, bx + padX, by + bh - padY);

    ctx.globalAlpha = 1;
  }

  function drawBubble() {
    drawSpeechBubble(bubbleText, bubbleTimer, 'left');
  }

  function drawSky(palette) {
    // Sky gradient (top to horizon)
    const grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H / 2);
    grd.addColorStop(0, palette.sky);
    grd.addColorStop(1, palette.skyHorizon);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H / 2);
  }

  function drawHud() {
    const kmh = Math.round(player.speed / MAX_SPEED * 160);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(kmh + ' km/h', 20, 30);

    // Progress
    const pct = Math.round((player.z / trackLength) * 100);
    ctx.fillText(pct + '%', CANVAS_W - 80, 30);

    // Section label
    const segIdx = Math.floor(player.z / SEG_LEN) % segments.length;
    const secPct = segIdx / segments.length;
    let section = 'CITY';
    if (secPct >= 0.19 && secPct < 0.50) section = 'HIGHWAY';
    else if (secPct >= 0.50 && secPct < 0.82) section = 'COUNTRYSIDE';
    else if (secPct >= 0.82) section = 'COAST';
    ctx.font = '14px monospace';
    ctx.fillText(section, CANVAS_W / 2 - 40, 25);
  }

  // =========================================================================
  // Main render
  // =========================================================================

  function render() {
    const startIdx = Math.floor(player.z / SEG_LEN) % segments.length;
    const startSeg = segments[startIdx];
    const startPct = percentRemaining(player.z, SEG_LEN);

    // Camera height follows the road elevation (interpolated)
    const nextIdx = (startIdx + 1) % segments.length;
    const cameraY = lerp(startSeg.p1.world.y, segments[nextIdx].p1.world.y, startPct) + CAMERA_H;
    const cameraX = player.x * ROAD_W / 2;
    const cameraZ = player.z - CAMERA_DEPTH * CAMERA_H;

    // --- Sky ---
    const palette = getPalette(startIdx);
    drawSky(palette);

    // Fill bottom half with grass color as base
    ctx.fillStyle = startSeg.color.grass;
    ctx.fillRect(0, CANVAS_H / 2, CANVAS_W, CANVAS_H / 2);

    // --- Project all visible segments ---
    let maxY = CANVAS_H;
    let x = 0;    // accumulated curve offset
    let dx = 0;   // curve delta per segment

    const spritesToDraw = [];

    for (let n = 0; n < DRAW_DIST; n++) {
      const segIdx = (startIdx + n) % segments.length;
      const seg = segments[segIdx];

      // Project with curve offset
      project(seg.p1, cameraX - x, cameraY, cameraZ);
      project(seg.p2, cameraX - x - dx, cameraY, cameraZ);

      x += dx;
      dx += seg.curve;

      // Collect cars and roadside sprites before clip check so distant ones don't flicker
      if (seg.p1.camera.z > 0) {
        for (const car of seg.cars) {
          spritesToDraw.push({ car, seg, n, clipY: maxY });
        }
        for (const sprite of seg.sprites) {
          spritesToDraw.push({ sprite, seg, n, clipY: maxY });
        }
      }

      // Clip: skip segments behind camera or above the max drawn line
      if (seg.p1.camera.z <= 0 || seg.p2.screen.y >= maxY) continue;

      // Draw this segment
      drawSegment(seg, maxY);

      // Update clipping line (horizon moves up as we render farther segments)
      maxY = Math.min(maxY, seg.p2.screen.y);
    }

    // --- Draw sprites back-to-front (farthest first) ---
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

    // --- Player car ---
    drawPlayerCar();
    drawBubble();

    // --- HUD ---
    drawHud();
  }

  // =========================================================================
  // Game loop
  // =========================================================================

  function frame() {
    updatePlayer();
    updateCars();
    render();
    requestAnimationFrame(frame);
  }

  // --- Init ----------------------------------------------------------------

  buildTrack();
  spawnCars();
  requestAnimationFrame(frame);

})();
