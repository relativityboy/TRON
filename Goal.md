# Goal

Create an open-ended, client-side Three.js simulation of being Clu in the original 1982 TRON maze. Prioritize atmosphere, spatial presence, believable perception and autonomous Recognizers over game balance or a structured chase.

## Current user direction — September 12, 2026

This supersedes the earlier 60–90-second escape-game scope. The user wants a true branching maze and independent Recognizers placed outside it at startup. They wander, look for Clu, pursue actual sightings, share observations, and search from last-known position and heading after losing sight. They must not know Clu's live position through walls.

Subsequent corrections: the maze should be diagonal and shard-like rather than square/blocky, and Recognizers should be smaller, using the user's approximate 30-foot upright leg as the scale reference.

## Experience pillars

1. **A place to inhabit.** Explore branches, loops, dead ends and exterior grid openings without a timer, assigned route, capture meter, waves or win/loss interruption.
2. **The 1982 shapes.** Broad blue slab tops, black channels, oblique edges and clipped ends. The supplied film stills guide the reconstruction; they do not expose a complete maze map, so unseen passages remain an authored approximation.
3. **Independent observers.** Two Recognizers begin in pursuit outside the maze, with one additional patrol in the maze. Three ground tanks patrol its corridors, in addition to two ground and two airborne carrier escorts. Each has its own motion, view direction, sighting memory and search decisions. Radio messages preserve the age and origin of an observation.
4. **Information-limited pursuit.** Wall geometry occludes vision. Once hidden, Clu's unobserved movement must not influence navigation. Prediction follows the last observed velocity for a bounded time and stops at mapped walls; stale memories expire.
5. **Direct vehicle control.** WASD/arrow movement, including turning in place; J/L independent turret rotation. The barrel stays level and shots lead the observed three-dimensional velocity when a target is aligned and unobscured. Cannon fire remains available without a combat objective.
6. **Quiet presentation.** Minimal default interface, optional instruments/map/aerial view, spatial aircraft audio that becomes muffled behind slabs, and the film-inspired typing terminal.

## Current implementation and limits

The maze uses a fixed, reproducible branching topology transformed into oblique convex slab polygons. Rendering, collision, projectile blocking and line-of-sight use the same polygons. The Recognizer geometry is scaled to one half of the prior build: upright legs about 9 m / 30 ft, with corresponding hit-volume, clearance and separation adjustments.

Both vehicles now load user-supplied Sketchfab GLBs: arabinowitz's tank and Shriker1's Recognizer. The adapters retain source proportions, normalize scale/axes, separate the tank cannon assembly for yaw, and restore emissive trim. Exact film fidelity remains subject to visual review.

All logic, rendering and sound remain client-side. No accounts, backend, multiplayer, progression or deployment are required. See `docs/_index.md` for the current plan and historical milestones, and `docs/validation/_index.md` for measured checks and remaining visual/human review.

The blueprint trace loads by default (also available with ?maze=blueprint). Twenty user-image roof outlines define rendering, collision and occlusion. Scale and wall height are provisional because the image has no measurements; cropped edges are preserved. The original authored maze remains available for comparison at /?maze=authored.

Recognizers now attack visually located Clu by turning and closing their legs, then dropping vertically. The attack commits before descent and can miss. A direct crush leaves an immobile wreck; R resets the simulation, with no score or game-over screen.

Recognizer horizontal propulsion follows its facing direction only. It retains momentum through yaw turns, slows through drag/braking, and stays level without helicopter-style pitch or roll. Vertical lift and the crush drop remain independent.

The tank program is titled CLU within ENCOM TERMINAL. TRON remains the film and visual reference.

The opening fades the typed access terminal into the grid, then moves the camera down to Clu while Recognizers continue their simulation. Reduced-motion preference skips the move; Enter/Space can skip it.

Recognizers lose interest after confirming Clu is crushed, either by direct sight or radio. They complete any attack recovery and return to patrol; stale sightings cannot revive pursuit of the wreck.


September 13 updates: the terminal remains black until Return, with a block cursor, uneven typing cadence, character clicks after browser audio unlock, and a synthesized two-tone access beep. Recognizers patrol during the camera descent while Clu starts at maximum speed with forward throttle held until W is released (pause/blur also clears it). The tank starts one maze width outside the entrance; radio reports travel only 1,000 feet (304.8 m), including vertical separation. Gameplay has no top header; standby is small top text, and any key resumes. Held driving/turret keys carry through resume; fire/reset/view keys are consumed. The follow camera orbits with the turret. Ground/maze fog remains identical within 250 m and tapers to retain distant silhouettes. Wall contact retains sliding speed and clears blocked drive pressure for immediate reverse. Tank sound is 30% quieter with subtle turn-dependent pitch/filter modulation.

September 14 follow-up: Recognizers now use model scale 0.65 (30% larger), with physical clearances and projector mounts adjusted. P enables the stabilized first-person sight, J/L yaw, I/K elevate, O zooms, and F levels elevation. Gunner aim has short acceleration/deceleration and zoom-sensitive rates. Clu rounds travel up to 825 m. Clu destruction now fades back to the film terminal message and Return starts a fresh run.

September 15: A Recognizer already searching with its spotlight must aim the beam onto visible Clu within its visual detection range before pursuing or reporting the new sighting. Acquisition brakes its flight; confirmed contact enables pursuit/radio and 1.5 seconds of beam tracking, followed by a 0.8-second fade. Lost targets do not steer the beam through walls.

## Expanded exploration — September 17

Four separated maze sites now provide local data-collection destinations, each with a red vertical beam and its own dynamically deciding patrols. Stopping in a red beam locks the drive, restores health and starts a 16-second transfer. The surround opens after nine seconds, the column changes red–white–blue and stays blue. Completion releases a spherical damaging wave with a final diameter of one maze width; blue beams never repeat the transfer. Preserve the open-ended atmosphere: no score panel or automatic victory screen.

September 20: sustained Recognizer pursuit now brings one additional Recognizer every fifteen seconds, globally rather than per pursuer. The reinforcement materializes near a pursuer using a single rectangular sweep inspired by the supplied Homeworld clip to draw the glowing red wireframe, followed by a quick whole-vehicle solid fade. It becomes active only once fully materialized and receives the summoning observer's recorded sighting, never hidden live Clu coordinates.

September 20 exploration: four glowing red teleport pads outside each maze connect to other maze sites. Full-footprint entry by a tank or aircraft starts dematerialization, transfer and materialization. Preserve altitude and heading, resume at rest, and require complete exit before reuse.

September 21: maze-site positions align to the world grid and whole-maze rotations use only 90-degree increments. Preserve the blueprint geometry and its diagonal wall ends within each site.

September 21 experimental direction: provide switchable tactical enemy control aimed at fewer, more capable and self-preserving units. Geometric movement planning enables oriented wall-side attacks and low flight in suitable corridors; an optional Jev decision layer chooses among feasible maneuvers using each unit's knowledge and nearby reports. Keep Classic available and local tactics usable without a network service.

September 21 hearing: sound is another bounded source of knowledge. Engines are audible only nearby; cannon fire, impacts and explosions carry farther. Walls attenuate sound, and enemies receive noisy bearing/distance estimates. They may investigate an unidentified noise without seeing Clu, but hearing never creates an exact sighting or authorizes an unseen attack.

September 21 portal refinement: vehicle fragments inside an invisible four-wall-height pad volume appear as wireframe. Whole containment causes an instantaneous momentum-preserving transfer; wireframe persists spatially until exit. The earlier timed dematerialization/arrival sequence is superseded for teleport pads only.

September 21 optional autoplay: U enables Jev maneuver selection for Clu, using visible enemies and the static map. Local controls execute routes and aim/fire checks; manual inputs temporarily override their channels without disabling autoplay. Keep this optional and independent of enemy AI selection.


September 22 corrections supersede earlier timing/physics notes: debris from every vehicle uses Earth gravity (9.81 m/s²). Beam panel formation/retraction now take 0.5/~1.167 seconds around the unchanged eleven-second hold. The damage wave remains disabled. Session, route, JEV transport, camera and audio ownership have been separated; see the current refactoring and JEV documents for architecture and validation.


September 23 explicit victory exception: completing all maze beams now wins the round. Fade to the existing terminal style and print `docs/victory.txt` quickly at a uniform cadence. Return from that page shows `docs/credits.txt` with its existing music, without the normal detachment message. This supersedes the earlier prohibition on a win screen for this requested outcome; do not add unrelated timed waves or score systems.
