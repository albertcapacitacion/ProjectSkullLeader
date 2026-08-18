# Project Skull Leader

Project Skull Leader is a minimal Three.js mech-combat prototype. The test is focused on one question:

> Is it fun to chase and fight another high-speed mech through a dense city while switching between precise Combat mode and momentum-based Glide mode?

## Run

Double-click `ProjectSkullLeader.bat`, then open [http://localhost:8178](http://localhost:8178) in a browser.

The launcher starts a small local server. Three.js is bundled locally in `vendor/three.module.js`, so the prototype does not need to load its main dependency from a CDN.

## Controls

| Input | Action |
| --- | --- |
| W / A / S / D | Move the mech |
| Left / Right Arrow | Rotate the camera |
| Up / Down Arrow | Pitch the camera |
| U | Hold to fire the machine gun |
| I | Launch a missile volley |
| Space | Toggle Combat and Glide modes |

Combat mode is slower and precise. Glide mode accelerates to a higher speed and preserves momentum when returning to Combat mode.

## Prototype features

- Blue Player 1 mech and red AI opponent
- Compact neutral city arena with building collisions
- Machine gun and distance-sensitive homing missiles
- Health, destruction response, and respawning
- Debug HUD with health, mode, speed, distance, cooldowns, and FPS
- Live tuning panel with reset and copy-to-JSON controls

This is a gameplay prototype, not a production game. Networking, mobile controls, advanced physics, audio, detailed models, and other non-essential systems are intentionally out of scope.
