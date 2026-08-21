# Project Experiences

## 2026-08-21 — Environment upgrade baseline

- The current city is assembled directly in `src/main.js` from one road slab, a grid helper, and 14 box obstacles.
- Gameplay systems use the shared `obstacles` list for mech collision and the corresponding mesh list for projectile collision and line of sight.
- The safest visual-upgrade seam is to preserve those collision records while rebuilding the visible city around them with explicit roads, sidewalks, districts, modular facades, parks, vegetation, landmarks, and human-scale props.

## 2026-08-21 — First visual validation

- The initial redesign exposed that the legacy spawn locations placed the player beside a building, so spawns were moved onto the central avenue and its major intersections.
- Facade grids are mirrored across building fronts and backs so the architecture reads from more camera angles.
- Browser validation confirmed the HUD loads, the scene renders, Combat/Glide switching works, firing interactions produce no console errors, and the city remains readable at mech level.

## 2026-08-21 — Decorative mesh performance fix

- Decorative boxes now share one unit-box geometry and do not cast shadows; collision buildings retain their own geometry and shadow casting.
