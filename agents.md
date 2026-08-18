# Project Instructions — Skull Leader v0

## Core game goal

Build an ultra-minimal browser prototype in Three.js to test one gameplay question:

> Is it fun to chase and fight another high-speed mech through a dense city while rapidly switching between precise Combat mode and fast, momentum-based Glide mode?

The prototype is not a production game, vertical slice, or architecture exercise. Reach a playable build quickly so movement, pursuit, combat, and mode switching can be tuned interactively.

Success is judged by gameplay feel:

- Combat mode feels agile, precise, and responsive.
- Glide mode is immediately faster and momentum-driven.
- Switching modes is instant and returning to Combat preserves a visible skid.
- The city creates readable streets, corners, line-of-sight breaks, and pursuit routes.
- Closing distance improves weapon effectiveness.
- Missiles create pressure without becoming guaranteed hits.
- Gameplay naturally produces chase → engage → pass → turn → chase sequences.

## v0 scope

Implement only the systems required for a playable test:

- One compact neutral-colored block-city arena with streets, intersections, varied building heights, and invisible boundaries.
- One blue low-poly Player 1 mech and one red low-poly AI opponent.
- Ground-based Combat and Glide locomotion modes.
- Third-person camera controlled by arrow keys.
- WASD movement, U machine gun, I missiles, and Space mode switching.
- Simple building/boundary collision for mechs and projectiles.
- Health, death, approximately one-second respawn, and no scoring or rounds.
- Basic bot movement, mode changes, firing, missiles, collision avoidance, and respawn.
- Minimal reticle, health bars, and debug HUD showing mode, speed, distance, cooldowns where useful, and FPS.
- Live tuning UI with numeric values, Reset Defaults, and Copy Tuning JSON.

Do not add features merely because they would normally belong in a game of this type.

## Hard engineering constraints

- Keep the codebase simple, explicit, human-readable, agent-readable, maintainable, and easy to extend.
- Prefer straightforward code, plain objects, explicit logic, and a small amount of duplication over clever abstractions.
- Support only the next one or two known iterations: real 1v1 multiplayer and mobile/touch controls. Do not architect for hypothetical systems beyond those.
- Use HTML, CSS, JavaScript or TypeScript, Three.js, and simple browser APIs with the minimum dependency count.
- Do not introduce a game engine, ECS, Redux/state-management framework, generic event bus, generalized ability/weapon/entity/plugin framework, dependency injection, or speculative architecture.
- Keep gameplay responsibilities easy to locate. Avoid dozens of tiny modules and deep directory hierarchies.
- Use a small normalized input state: keyboard input produces gameplay intentions; mech logic consumes those intentions.
- Keep one clear central update loop with explicit delta-time updates and understandable ordering.
- Put all meaningful gameplay values in one obvious central tuning object. Avoid scattered magic numbers.
- Avoid unnecessary per-frame allocations, keep geometry modest, and clean up destroyed projectiles.
- Do not prematurely optimize or polish systems before they have been validated through play.

## Explicit non-goals

No networking, mobile controls, melee, jumping, flying, vertical thrust, boost meter, stamina, ammo, reloads, pickups, destructible buildings, advanced physics, advanced animation, detailed models, textures, sound, music, advanced particles, scoring, rounds, match timers, win/loss screens, matchmaking, multiple arenas, sophisticated AI, advanced target selection, inventory, presets, save games, or unnecessary menus.

## Design defaults

- Use primitive low-poly geometry and flat colors only.
- Player 1 is entirely blue; Player 2 is entirely red; buildings use neutral grays, beiges, and concrete tones.
- Combat movement is responsive, camera-relative, ground-based, and substantially slower than Glide.
- Glide accelerates, steers, brakes, retains meaningful velocity, and uses simple tunable friction/velocity logic.
- Machine gun fires continuously while held; missiles launch a small volley with limited, distance-sensitive homing.
- Use subtle distance/angle/line-of-sight assistance, not hard lock-on or target-selection systems.
- Buildings block mechs and destroy missiles/projectiles on collision.
- Health starts at 100 HP by default, but health and weapon values must be tunable.

## Working rules

- Never change data, files, or code without explicit user authorization.
- Protect existing work and warn before any action that could risk data.
- Do not make assumptions about design, flow, features, technology, look, or feel. Ask when uncertainty would materially affect the result.
- Always choose the simplest safe implementation that is easy for humans to review and unlikely to harm stability or security.
- When proposing an implementation plan, perform a second pass for security and app-breaking risks before presenting it.
- When fixing review issues, use the safest compact solution and avoid unnecessary review/fix loops.
- Use the Anaconda base environment if Python is needed. Playwright is available for web-app testing.
- When working in this project, suggest an `experiences.md` file for notable bugs, solutions, performance improvements, or other useful postmortem events; ask when unsure whether an event belongs there.
- If relevant progress stops for 30 minutes, pause and report the blocker, work completed, and alternatives.
- Communicate clearly and concisely, and never use Spanish unless requested.
- For GitHub work, the main branch must be named `main`, never `master`.
