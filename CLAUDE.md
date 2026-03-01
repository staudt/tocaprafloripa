# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based pseudo-3D driving game inspired by **Outrun** (segment-based road rendering, city-to-beach journey) and **Top Gear SNES** (speech balloons). Built with vanilla JS + Canvas, no build step, no dependencies.

## Running the Game

Open `index.html` in a browser. There is no build step, no package manager, no test suite, and no linter. The entire game is two files: `index.html` (canvas + CSS scaling) and `game.js` (single IIFE, ~560 lines).

## Architecture (game.js)

The game runs as a single IIFE with `requestAnimationFrame`. There is no module system — everything lives in function scope.

### Key Concepts

**Segment-based road**: The track is an array of segments, each with start/end points (`p1`/`p2`), a `curve` value, and world-space Y elevation. The track loops — when the player reaches the end, position wraps to 0.

**Projection math** (Jake Gordon's JavaScript Racer approach): Segments are projected from world space to screen space using `scale = CAMERA_DEPTH / camera.z`. Curves are an illusion — an accumulated x-offset (`dx += seg.curve`) shifts each segment further as distance increases. Hills use per-segment Y elevation with camera following the road surface.

**Rendering order**: Segments draw near-to-far with a `maxY` clipping line that rises as farther segments are rendered (this hides road behind hills). Sprites (traffic cars) are collected during the segment pass and drawn back-to-front afterward.

**Drawing layers per segment**: grass strip (full width) → rumble polygon (wider than road) → road polygon (on top) → lane markings (light segments only).

### Road Generation

`addRoad(enter, hold, leave, curve, y)` is the core builder — uses `easeInOut` for smooth curve/elevation transitions. Helpers (`addStraight`, `addCurve`, `addHill`, `addSCurve`, `addLowRollingHills`) compose on top. After generation, segment endpoints are patched so `p2.y` matches the next segment's `p1.y` for smooth slopes. Colors are assigned by track position: city (0–20%) → highway (20–45%) → countryside (45–75%) → coast (75–100%).

### Player & Traffic

- Player: WASD/Arrow keys, centrifugal force on curves, off-road speed penalty when `|player.x| > 1`, clamped to ±2.5
- Traffic: 12 cars at random positions/speeds (30–80% of max), assigned to segment `.cars[]` arrays, drawn as colored rectangles with basic shading
- No collision detection yet — player passes through traffic

## Current Status

**Phase 1 is complete**: road rendering, curves, hills, rumble strips, lane markings, traffic cars, player controls, 4 color-palette sections, HUD (speed/section/progress), CSS-scaled canvas.

**Phase 2 (not started)**: speech balloons at milestones, environmental sprites (buildings, trees, palms), traffic AI + collision, sound effects, intro/outro screens, possible time limit/checkpoints/score.

## Known Issues

- Track loops at end — no finish line
- Fixed DT = 1/60 with no delta-time correction (speed tied to frame rate)
- `fogFactor()` utility exists but is unused
- Player car is a simple rectangle with no animation
