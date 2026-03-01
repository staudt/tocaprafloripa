# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**"Toca pra Floripa"** — A Brazilian Portuguese comedy road trip game. Drive from Porto Alegre to Florianópolis with your family, passing through real locations (Canoas, Viamão, Osório, Freeway, Tramandaí, Litoral Gaúcho). Each location has unique road characteristics, traffic patterns, and comedy dialogue. Built with vanilla JS + Canvas, ES modules, no build step, no dependencies.

## Running the Game

Requires an HTTP server (ES modules don't work with `file://`):
```
py -m http.server 8080
```
Then open `http://localhost:8080`.

No build step, no package manager, no test suite, no linter.

## Architecture (ES Modules)

```
index.html           — canvas + CSS scaling, loads src/main.js as type="module"
src/
  main.js            — entry point, game loop, state machine (MENU → PLAYING → ARRIVAL)
  config.js          — constants (canvas, physics, rendering, etc.)
  state.js           — shared mutable game state object (game.*)
  utils.js           — clamp, lerp, easeInOut, percentRemaining, fogFactor
  input.js           — keyboard tracking, isUp/isDown/isLeft/isRight
  locations.js       — location configs (road generation templates + events)
  road.js            — procedural road generation from location configs
  traffic.js         — per-location traffic spawning and movement
  player.js          — player physics, location detection, event system
  render.js          — projection, segment/sprite/car rendering
  hud.js             — speed, progress, location name display
  screens.js         — menu, arrival, game over screens (all in Portuguese)
```

### Key Concepts

**Segment-based road**: The track is an array of segments, each with `p1`/`p2` points, a `curve` value, and per-segment properties: `lanes`, `roadWidth`, `twoWay`, `locationId`.

**Data-driven locations** (`locations.js`): Each location is a generation template with parameters for road character (curve frequency/intensity, hill frequency/intensity), traffic (density, speed range), roadside sprites, and scripted events. The road builder procedurally generates segments from these params — each playthrough is different.

**Location config keys**: `length`, `lanes`, `twoWay`, `roadWidth`, `curves: { frequency, minLen, maxLen, minIntensity, maxIntensity }`, `hills: { frequency, minLen, maxLen, minHeight, maxHeight }`, `traffic: { density, speedRange }`, `sprites: { types, frequency, colors }`, `events: [{ at, type, speaker, text }]`, `palette`.

**Event system**: Events fire when the player crosses a progress threshold within a location. Currently supports `'dialogue'` type. Extensible for future types (gas station, police radar, etc.).

**Projection math** (Jake Gordon's JavaScript Racer approach): `scale = CAMERA_DEPTH / camera.z`. Curves via accumulated x-offset. Per-segment `roadWidth` passed to `project()` for variable road widths.

**Rendering order**: Sky gradient → grass base → segments (near-to-far with maxY clipping) → sprites (back-to-front) → player car → speech bubble → HUD.

**Game state machine**: `MENU` → `PLAYING` → `ARRIVAL` (or `GAME_OVER`). Menu shows "Toca pra Floripa" title. All UI in Brazilian Portuguese.

### Road Generation

`generateLocationRoad(location)` divides the target length into random stretches, rolls against curve/hill frequencies, and generates segments with random parameters within the location's configured ranges. `buildTrack()` iterates all locations in order, generating road for each, then patches elevation for smooth transitions.

### Player & Traffic

- Player: WASD/Arrow keys, centrifugal force, off-road penalty, jump physics on hill crests
- Traffic: spawned per-location based on `traffic.density` and `traffic.speedRange`
- No collision detection yet

## Current Route

Porto Alegre → Canoas → Viamão → Osório → Freeway → Tramandaí → Litoral Gaúcho → Florianópolis

## Current Status

**Completed**:
- ES module architecture (11 files under src/)
- Game state machine (MENU, PLAYING, ARRIVAL, GAME_OVER)
- Procedural road generation from location configs
- 8 locations with unique palettes, road params, traffic, and dialogue events
- Per-segment lanes, road width, and twoWay properties
- Location-based traffic spawning
- Event system (dialogue triggers at progress points)
- Speech bubbles with speaker-side positioning
- Arrival detection (reach Florianópolis → victory screen)

**Next steps (not started)**:
- Two-way road rendering + oncoming traffic
- Car selection screen (Chevette, Maverick, Fiat 147, etc.) with stats
- Fuel system + gas stations
- Money/damage economy
- Collision detection
- Parallax scrolling backgrounds
- Comedy dialogue expansion
- Radio/music system (Web Audio API)
- Varied vehicle sprites (trucks, motorcycles)

## Known Issues

- Fixed DT = 1/60 with no delta-time correction (speed tied to frame rate)
- `fogFactor()` utility exists but is unused
- Player car is a simple rectangle with no animation
- Two-way flag is stored on segments but not yet rendered
- `game.js` (old monolithic file) still exists but is unused — can be deleted
