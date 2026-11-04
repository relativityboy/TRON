---
title: Validation
subtitle: Browser checks, performance, and remaining work
---

## Film finish — November 3

- [x] Replace the existing uniform noise with subtle monochrome grain and soft brightness mottling after tone mapping. Favor blue midtones, preserve quiet blacks/highlights and crisp edges, update grain at 24 frames/second, retain the existing vignette and low-quality bypass. Strengths and pixel scales live in `FILM_FINISH`.
- [x] Chrome GPU check verifies stable grain within a film frame, changing grain across frames, preserved black/white swatches and bounded variation. Exact staged snapshot: 665 unit tests and production build/asset audit pass. Maze captures saved in `test-results/film-finish/`; visual review of the film match remains with the user.

## Facade placement, depth, menu and arena shadow refinements — November 3

`npm test`: 677 pass. Exterior/narrow-canyon tests construct four translated/rotated sites and confirm that outward faces have no decorative boxes, wide opposing canyon faces retain them, and 12/23 m gaps omit relief while 25/36 m gaps keep it. Other sites do not act as blockers for a maze's exterior classification. The presentation cutoff is 24 m, using the minimum opposing-wall distance across three face samples. Base wall/collision/occlusion polygons remain unchanged.

The runtime retains revision 7's widths, spacing and heights but scales both projections by 0.75: 1.125 m ribs / 1.40625 m molding. Existing pattern/impact tests now use these depths, including clipped rib-edge strokes. Chrome's `maze-wall-pattern.mjs` passes with 12,246 vertices / 1,767 relief quads in the one-site blueprint fixture; the rib ray hit moves from 8.875 m to 11.0185 m after damage, then returns to 8.875 m after reset. Close/overview/exterior captures are under `test-results/maze-wall-pattern/`. Geometry tests establish the exterior/narrow distinction; user review of the resulting appearance remains ongoing.

`node tests/browser/menu-tuning.mjs` passes in headless Chrome: LIGHT CYCLES SOLO is first and selected, Down selects multiplayer and Up returns to solo, Enter launches a solo cycle session, Shift+T cannot expose the legacy panel during normal cycle/CLU play, and normal shifted T still boosts CLU. With `?tuning=1`, Shift+T opens the panel once even with held-key repeat; Close and Escape dismiss it, with Escape preserving running mode. The first browser attempt sent the shortcut during the opening curtain; the test now waits for that transition before checking controls. The older home-menu keyboard fixture and tactical tuning opt-in fixture were adjusted for the explicit menu/shortcut changes; the broad tactical fixture was not rerun.

The moving Recognizer depth atlas previously knew about the aircraft and maze slabs but had no arena-wall visibility check when darkening arena architecture. `arena-light-visibility.js` now samples the existing static arena wall atlas with receiver-plane depth correction and a small RGBA depth-quantization tolerance; a light-facing check also excludes closed faces oriented away from the light. Arena architecture receiver wrappers bind this mask, and the material program key includes it. Existing breach/geometry change detection refreshes the wall atlas before moving-shadow reception.

`node tests/browser/arena-aircraft-occlusion.mjs` reproduces both leaks at a 6,000 m world offset and verifies the fix using GPU pixels. Far-side face RGB sum is 120,000,000 with aircraft shadows off, 111,862,337 with the old unmasked projection, and exactly 120,000,000 with protection. A directly lit exterior still darkens from 120,000,000 to 117,169,991. An overhang-shielded face stays at its lit sum 91,200,000; removing the roof exposes a shadow (87,199,052), restoring it returns to 91,200,000. No shader/page errors. Results are in `test-results/arena-aircraft-occlusion/report.json`. The actual game/menu browser check also passes with the arena loaded.

`npm run build` passes production/PWA/asset checks. No deployment.

## Optional WebAssembly, wall contrast and edge lines — November 3

The user's Safari Lockdown Mode screenshot identifies an unhandled `ReferenceError: Can't find variable: WebAssembly` inside Rapier during module startup. `optional-physics.js` now guards even API access, compiles a minimal empty module before loading Rapier, catches import/initialization errors and bounds initialization to 3,000 ms. `debrisPhysicsReady` resolves to the initialized backend or null. `DebrisPhysics` uses the existing Rapier implementation when ready and otherwise selects the JavaScript scenery fallback. No unconditional Rapier import remains. Late initialization failure is handled after a timeout too.

The fallback uses the same fixed step, 9.81 m/s² gravity and horizontal drag, preserves delayed inherited velocity/spin, sweeps a conservative oriented-box AABB against convex wall/roof prisms and settles against the floor. It provides existing debris observation/lifecycle methods. It is intentionally simpler: it does not reproduce rigid-body contact torque or debris-to-vehicle impact damage. Main vehicle control, AI, weapon damage and maze collision remain unchanged.

`npm test`: 674 pass. Seven new tests cover absent/throwing/compilation-blocked APIs without loading Rapier, failed imports/init, successful backend selection, initialization deadline/late rejection, JavaScript gravity/observations, delay/pause/floor settling, swept thin-wall and roof collisions, cleanup and absence of fabricated damage. Existing Rapier gravity, rigid-body contact/damage and inheritance checks pass. One additional wall test verifies faint depth-tested outlines without diagonal wireframe, cavity clipping on a projecting rib edge and reset restoration.

`node tests/browser/wasm-unavailable.mjs`: headless Chrome on macOS arm64 reaches the opening menu and runs the CLU simulation in four separate contexts: missing WebAssembly, API access throwing, Module compilation blocked, and instantiate rejecting. Each also denies IndexedDB and Cache Storage. All contexts use the JavaScript backend, run breakup effects, clear debris and produce no page errors. The first three never request the Rapier module. Actual Safari Lockdown Mode has not been run by automation; other browser-specific restrictions remain possible.

Wall front color now comes from the approved model's sRGB `#111423`, converted once into linear RGB, with darker rib end faces. Restrained strokes use the arena outline rendering approach (depth-tested LineSegments, no depth writes or tone mapping), muted blue `#3b4c6a` at 0.62 opacity and a 0.025 m outward offset. Roof/rib/molding top surfaces stay blue. No edge strokes are generated for triangulation diagonals or internal collinear cell joins. Impact cuts also clip strokes up to the relief projection depth.

`node tests/browser/maze-wall-pattern.mjs` passes again with the dark palette and outlines: close/overview captures, real rib hit, recessed cavity and restoration, no page errors. Inspected updated captures under `test-results/maze-wall-pattern/`. `npm run build` passes production/PWA/asset checks; documentation is regenerated. No deployment.

## Accepted wall pattern integrated — November 3

`maze-wall-revision-7.glb` loads as 19 authored parts / 236 triangles, 108 × 54 × 27.75 m overall. All 19 part bounds match the saved workshop revision 7. Preserve its SHA-256 `21343872666d3c31a69fc79082eb209a59aef9532a101a7e7f1c7be72e5c2d59`, original GLB, project authorship/reference constraints and saved design in `assets/source/models/maze-wall/revision-7.{glb,json}`. The runtime uses named dimensions in `src/rendering/maze-wall-pattern.js`; it does not load or deploy the source GLB. Existing maze palette, wall polygons, solid caster prisms and simulation collision/occlusion remain unchanged; outward rib/molding relief is cosmetic.

`npm test`: 666 pass. Three new pattern tests cover exact 18/36 m rib width/pitch, 1.5 m projection, molding centered at 8.1 m with 2.7 m height / 1.875 m projection, scaled/short faces, real ray-intersectable relief, collision/caster invariants and impact cuts through both ribs and molding. Cut boundaries remain sealed and reset restores original geometry. Existing damage tests also pass. Damage clips affected decorative quads, fills cavity side extensions and removes their original triangles from static shadow overlays. `npm run build` passes the production PWA/asset audit with no source GLB or editable master shipped.

`node tests/browser/maze-wall-pattern.mjs`: headless Chrome on macOS arm64 passes actual reference-view rendering and impact/reset ray checks, no page errors. The 20-wall blueprint view has 23,508 vertices and 3,644 relief quads. A rib's nearest hit changes from 8.500 m to 10.850 m after an impact, then returns to 8.500 m on reset. Captures: `test-results/maze-wall-pattern/close.png` and `overview.png`; report beside them. The final successful capture/check took 1.79 seconds. An earlier attempt was blocked by a shared Vite optimizer cache (HTTP 504), then a browser-test bare-module import; corrected the import and isolated the test cache. Workshop browser fixtures also now use private cache directories to avoid invalidating active previews.

Local Node 22.23.4 measurements: building the full 196-wall/five-site blueprint+labyrinth scene adds 36,579 relief quads, 79,837 total triangles and takes about 129 ms; static maze shadow geometry takes about 212 ms. These are construction timings, not frame-rate measurements. The simple authored one-site world builds in about 50 ms. Inspected the rendered close/overview captures; human in-game appearance review remains pending. Refreshed the idle main preview to clear its old optimizer metadata. No deployment.

## Wall editor unavailable recovery — November 3

The old processes serving ports 5188/5189 returned HTML with HTTP 200 for the editor state endpoint; the newer 5190 process returned valid JSON. Restarted only the two identified old Vite processes. Verified `/api/wall-studio/state` returns JSON on all three ports. `npm run workshop` now starts the dev server at the fixed `http://127.0.0.1:5190/wall-study.html` address.

`node --test tests/unit/wall-studio.test.js`: seven pass. `node tests/browser/wall-workshop.mjs`: headless Chrome passes a new reproduction that initially returns HTML from the state API, renders the fallback model with revision submission disabled, then restores API access and verifies automatic reconnection plus populated revision-zero history. This also checks the fix for treating a fallback model as if its saved revision were already installed. The existing upload, selected-reference/part context, Enter revision, persistent reload, failure/cancel, restore, GLB export and responsive-layout checks pass. State-read retries do not resubmit model-revision requests. No live Codex request or full unit/build rerun was needed for this connection-only fix; no deployment.

## Local wall workshop — November 2

On macOS arm64 / Node 22.23.4, `npm test` passes all 663 tests, including seven new wall-workspace tests. These cover persistent revisions/restoration, invalid output and provider failure preserving the prior model, busy/stale edits, cancellation/timeouts, origin/token enforcement, image validation and bounded nonintersecting geometry. Targeted tests pass again after initialization-error handling was hardened. `npm run build` passes the production PWA/asset audit; the editor page and local Codex endpoint are not production entries.

`node tests/browser/wall-workshop.mjs` uses headless Chrome and an injected controlled revision function in a temporary Vite workspace. It verifies an actual image drop/upload, reference dialog, selected-part and reference context, Enter submission, pending state, updated geometry, unchanged camera, persistent page reload, failed/cancelled revisions preserving the model, restoring an older version, binary GLB download, six camera presets and a 390px layout without horizontal overflow. Desktop/mobile captures are under `test-results/wall-workshop/`. No page errors. A final rerun covers the page lifecycle cleanup changes.

`TRON_STUDIO_LIVE=1 node tests/browser/wall-workshop-live.mjs` exercises one actual local Codex CLI request, using existing ChatGPT sign-in, viewport capture and two film references. The instruction to remove all eight ledges returns a valid revision with eleven slab/panel parts and renders it in the page. The test uses and deletes a temporary workspace, leaving the real workspace's starting design intact. Capture: `test-results/wall-workshop/live-revision.png`. This demonstrates the real feedback loop, not film fidelity or general correctness for future directions.

Local state and attachments persist under ignored `.local/wall-studio/`; they are denied by Vite's static file handler, with image reads routed through the local middleware's reference IDs. Submissions invoke read-only, ephemeral Codex with shell/unified-exec/multi-agent/apps features disabled and structured JSON output. Geometry is validated before saving; timeout/cancel stops the child. Each submitted correction uses the account's normal Codex usage and sends its selected images/current view to Codex. No additional third-party model service, game integration, deployment or human approval of the starting geometry.

## Maze wall video reconstruction — November 2

Local macOS arm64 / Python 3.11.12: ffmpeg reads the supplied `CluMazeWall1.m4v` (3.265 s) and `CluMazeWall2.m4v` (4.530 s), both 3840×1744 HDR PQ. `tools/studies/prepare-maze-wall-video.py` preserves originals, records SHA-256, tone-maps BT.2020/PQ to SDR, extracts six frames/sec at 1600 px width and prepares optional 1920×872 silent service inputs. Gamma 1.65 exposes geometry for tracking; these images are not final material-color references.

PyCOLMAP 4.2.1 / OpenCV 5.0.0.93 are installed only in `/tmp/tron-wall-sfm-env`. `track-maze-wall.py` tests SIFT, exhaustive matching and incremental mapping. A conservative upper-43%-of-frame mask excludes the tank/ground; saturated warm subjects are additionally masked. Clip 1: 4/20 registered views, 89 points, mean reprojection error 0.461 px. Clip 2: 2/27 views, 30 points, 0.230 px. `track-maze-wall-flow.py` tests optical flow with forward/backward checks and geometric verification: clip 1 gives 5/20 views, 70 points, 0.627 px; clip 2 gives no model. COLMAP internally relaxes initialization constraints. These fragments do not establish a reliable reconstruction; no wall mesh or fidelity success is claimed. The mask also removes useful lower-wall detail, so these failures do not establish that all reconstruction methods would fail.

Diagnostic frames/contact sheets, JSON measurements, logs, partial PLY/COLMAP files and processing provenance live under ignored `test-results/maze-wall-video/`; see `report.txt`. No external media upload, paid service request, game change or deployment. The prior procedural wall model is rejected, not an accepted reference. A neural reconstruction trial would require separate upload/account/spend authorization.

## Restricted storage fallback — November 2

On macOS arm64 / Node 22.23.4, `npm test` passes 656 checks. `tests/unit/optional-indexeddb.test.js` covers absent/throwing IndexedDB, synchronous and asynchronous open errors, inaccessible Cache Storage, blocked/stalled opens, late connection closure, and successful open/upgrade. `node tests/browser/storage-unavailable.mjs` passes in headless Chrome against Vite on port 5188: the full app reaches the opening terminal with the loading overlay hidden, no page errors, direct music URL fallback and speech cache misses, both with missing APIs and getters throwing SecurityError.

`TRON_TEST_ENGINE=webkit node tests/browser/storage-unavailable.mjs` cannot launch because Playwright WebKit 2370 is not installed. Actual Safari in macOS Lockdown Mode is untested; IndexedDB fallback alone does not establish compatibility with its other restrictions. WebKit documents disabled IndexedDB in [Safari 17 Lockdown Mode](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/). Existing unsafe getter checks could reject background cleanup/speech operations, but the exact cause of the reported loading stall has not been reproduced. No deployment.


## Evolved AI default release — October 25

User-approved `approach-480000-1-0` promotion: all 642 unit tests pass, including solo/MP default identity. Production build and asset audit pass. `node tests/browser/cycle-ai.mjs` verifies the normal, non-trial entry point in Chrome 155 at 1280×800; frame AI p99 0.60 ms/max 1.00 ms, dense p99 0.40 ms/max 0.70 ms, no page errors. Promoted module weights exactly match the evaluated candidate. `node tests/pwa.mjs` passes installability, scoped icons/manifest, offline tank/cycle startup, ranged audio and non-interrupting updates. Worker dry run and deployment succeed; version `db608817-b999-4aa8-8aba-ad266946b86d`. Static publication proceeds via website revision pin. Full release metadata is in `tools/ai/results/promotion-480000.json`.

## Broader evolved cycle-AI trial — October 25

Completed 288 offline tournament matches with the existing safety/controller rules and a historical training opponent. Candidate wins 27/48 held-out games versus incumbent 12/48, scores 50.9% higher and improves paired fitness in 11/12 groups; full metrics and weights are retained in `tools/ai/results/followup-480000.json`. Rotated seats are correlated, so these are exploratory results. The final serial p99 timing gate passes; earlier generation probes include tick-budget outliers.

`node --test tests/unit/cycle-ai.test.js tests/unit/cycle-ai-fitness.test.js tests/unit/cycle-ai-approach.test.js`: 36 pass. `node --check tools/ai/train.mjs`: pass. `node tests/browser/cycle-ai.mjs --trial`: Chrome 155, macOS, 1280×800; exact candidate weights and tuning values verified, no page errors, frame AI p99 0.50 ms/max 1.10 ms; dense-scene p99 0.40 ms/max 0.80 ms. Inspected `test-results/cycle-ai-trial.png`. Optional local trial updated with the previous artifact preserved; no shared live-policy or deployment changes. Human gameplay review remains outstanding.

## Grid-visible shadows — October 25

Reduced bike/trail/perimeter floor attenuation to 88% and arena-wall aircraft attenuation to 88%. Production build and asset audit pass; Chrome trail checks retain floor shadow coverage, collapse/removal and unchanged trail faces. Inspected the lighter capture. The preceding deployment completed successfully, and a live Chrome check started CLU and cycles, loaded versioned models/audio and played the audio studio without HTTP/page errors. Updated the production smoke check to accept immutable content hashes in the Recognizer flight audio filename; its legacy exact-name assertion had falsely reported an audio failure. Live verification of this attenuation adjustment follows publication.

## Crisp floor shadows — October 25

`npm test`: all 642 tests pass for the release candidate before the final floor-shadow presentation correction. `node tests/browser/cycle-trail-shadows.mjs` passes after replacing the trail atlas with exact projected floor silhouettes at 98% attenuation. Trail faces remain unchanged with shadow strength enabled/disabled; collapsing a trail reduces floor coverage and removing all trails restores the original floor exactly. The updated arena-wall fixture passes exact perimeter floor silhouettes alongside normal/analytic bike atlas reception. `npm run build` and `node tests/pwa.mjs` pass, including offline tank/cycle starts, ranged audio, scoped installability and non-interrupting updates. Inspected the final crisp trail-floor capture. Overlapping wall projections share stencil bit 4; maze floor/wall shadows retain bits 1/2.

## Patrol green and aircraft shadows on arena walls — October 24

A temporary headless Chrome preview renders the patrol's `#003600` face tint under game lighting; assertions confirm the material tint and unchanged luminous trim. Inspected `test-results/arena-patrol-dark-green.png`. This is a visual approximation of the supplied reference; the material's highlights still respond to scene lighting.

`node tests/browser/recognizer-arena-wall-shadows.mjs` passes in headless Chrome on macOS, 800×600. The styled arena-wall material receives a shadow from the existing aircraft atlas after late registration; registering twice installs one patch. 98% wall attenuation is darker than the 78% comparison. Reconstructing the atlas produces pixel-identical output. No page/shader errors. New fracture-lining materials remain unregistered; Safari and a full patrol flyover remain for visual review.

## Floor and cycle palette adjustments — October 24

Chrome trail-floor rendering checks pass after the floor changed to `#03182d`; trail surfaces remain pixel-identical with shadow strength enabled/disabled. A temporary full-game Chrome check renders the brighter floor and 98% bike floor shadows without page/shader errors (`test-results/cycle-blue-floor-dark-shadows.png`). Existing 65% bike-surface shadow attenuation remains unchanged. A temporary analytic materialization check also passes all existing assertions with the deeper crimson palette; inspected its solid red capture `test-results/cycle-dark-red-solid.png`. These colors are visual approximations guided by the supplied references, not a calibrated film color match.

## Cycle trail shadows — October 24

`node tests/browser/cycle-trail-shadows.mjs` passes in headless Chrome on macOS, 1000×700. Two actual instanced trail sheets, translated 6 km, cast onto the grid floor and each other. An isolated straight sheet is pixel-identical with reception enabled/disabled (self identity exclusion). Lowering the casting instance increases floor brightness; removing all instances restores the unshadowed floor exactly. Idle update has zero draw calls. Depth rendering shares the exact displayed taper/cutout vertex code; the fixture uses straight sections. Inspected `test-results/cycle-trail-shadow.png`. A first whole-arena-frustum capture showed coarse bands; fitting coverage and depth to live geometry removes those visible bands in the fixture.

Arena perimeter shadow and analytic materialization browser regressions pass. A temporary full seeded-game smoke check reaches racing with more than ten trail segments without page/shader errors; captured `test-results/cycle-trail-shadow-game.png`. Production build and asset audit pass. Dense-match GPU/CPU cost, long-lived trail coverage, curved connection shadow fidelity and Safari remain for further review. This is a dynamic full-resolution atlas rather than the cached perimeter map.

## Arena perimeter wall shadows — October 24

`node tests/browser/arena-wall-shadows.mjs` passes in headless Chrome on macOS, 800×600. A wall fixture at the authored inner-wall location, translated 6 km, shadows the procedural arena floor, a mesh receiver and an analytic bike. Cutting the actual jagged breach geometry increases summed RGB for all three; restoring the original geometry reproduces each original shadow image exactly. A cached update issues zero shadow-map draw calls. No page/shader errors. Inspected `test-results/arena-wall-shadow-floor.png`; bike capture is `test-results/arena-wall-shadow-ray.png`.

`node tests/browser/cycle-aircraft-shadows.mjs` and `node tests/cycle-ray-materialization.mjs` pass with the shared sampler. A temporary full-game Chrome smoke check also launches the seeded cycle game, switches to analytic rendering and captures the arena without page/shader errors. `npm run build` passes, including the asset audit. The fixture and smoke check do not establish full-arena fidelity/performance. Safari, target-hardware frame timing, and a full-game perimeter/breach play review remain outstanding.

## Ray-cast cycle aircraft shadows — October 24

`node tests/browser/cycle-aircraft-shadows.mjs` passes in headless Chrome on macOS at 800×600. The real aircraft atlas, with an overhead box caster, reduces bike-image summed RGB from 3,508,298 to 2,719,340; hiding the caster restores 3,508,298 exactly. No page/console errors. Inspected `test-results/cycle-aircraft-shadow.png`; comparison is `test-results/cycle-aircraft-unshadowed.png`. This verifies ray-hit shadow reception rather than film fidelity. `node tests/cycle-ray-materialization.mjs` also passes construction, solid fade, human markings and wheel reflection checks.

`node tests/cycle-renderer.mjs` stops at the unrelated JEV warning timeout. A temporary copy omitting that assertion successfully switches to POV and back, preserves the paused race and releases CSG geometry, then fails the existing normal draw-count equality check (929 versus 863). Full renderer lifecycle validation remains unresolved. The fixture's short timing sample does not establish representative GPU overhead; target-hardware gameplay profiling and Safari/flyover review remain outstanding.

## Carrier/maze ground-shadow overlap — September 24

`node tests/carrier-maze-overlap.mjs` passed in headless Chrome on macOS. With both shadow layers present, the corrected render matches the reference without coarse floor masking exactly (zero differing channels); restoring the old atlas cutout differs in 34,080 channels. Inspected the low-angle rendered overlap. `node tests/recognizer-shadow-occlusion.mjs` passed wall/debris occlusion checks; its floorless fixture initially exposed an unconditional floor access, now guarded. Production/documentation build passed. Safari at the reported gameplay location remains for user confirmation.

## Sequential stored-shot recharge — September 24

Changed idle recharge to one stored shot every ten seconds, capped at three. Firing resets progress toward the next shot without discarding existing reserves; full reserves do not bank extra recharge time. Seven focused cannon tests passed. `node tests/cannon-reserve.mjs` passed in headless Chrome on macOS, naturally waiting through the full recharge and checking one, two and three illuminated segments at 10, 20 and 30 simulation seconds, plus pause and firing behavior. Production/documentation build passed.

## Stored shots, extended credits and arena signatures — September 24

Seven cannon reserve simulation tests passed with the 1.14-second cooldown and 30-second idle refill. `node tests/cannon-reserve.mjs` passed in headless Chrome on macOS, checking actual key presses, segment counts, accessible meter values, held fire and pause/refill behavior. Its initial run missed startup readiness; the test now waits for the enabled start button.

`node tests/extended-credits.mjs` passed: normal tribute followed by extended pages, repository credit present, bounded 70-column/10-line pages, final signoff, and both split GLBs loaded through Three.js. All 8,349 original triangles are preserved across the two files: 3,465 in the arena and 4,884 in the archived inscriptions. Runtime arena has no signature nodes. Production/documentation build passed. Extended sequence verification advances a detached terminal fixture; full-duration playback remains for user review.

## Hit-centered Recognizer debris — September 24

`node --test tests/debris-inheritance.test.js tests/debris-physics.test.js`: all 13 tests passed, including radial impulses from multiple world-space hit locations on a rotated craft, inherited velocity, Earth gravity and cleanup. `node tests/breakup.mjs` passed in headless Chromium on macOS: fifteen connected sections, varied explosions, tumbling/falling, pause freeze and geometry release after expiry. The impulse is now fully radial vertically as well as horizontally; the new visual distribution remains for user review in play.

## Cycle explosion sequence — September 24

`node --test tests/light-cycles.test.js`: eight tests passed, including exact 24 fps effect sampling, staggered arc visibility, ray cutoff, debris lifetime, deterministic repeated updates and reset/pool reuse. `node tests/light-cycles.mjs` passed in headless Chromium on macOS with no page/console errors. Captured explosion frames 0, 5, 8, 12 and 20 and inspected the opening, expanding arc/starburst, and debris-only stages against the supplied film stills. Preview captures use direct rendering; the game's existing bloom adds glow in play. Screenshot filenames are capture times, not movie timecodes, so the assumed consecutive-frame timing remains an approximation. Production/documentation build passed.

## Grounded cycle trail connection — September 24

The latest film close-up corrected the trail shape: its leading edge has a tire-shaped recess, while its lower edge reaches the floor. Replaced the axle-height taper with a vertically subdivided, closed profile around the measured rear wheel, with 2.5 cm clearance. The top slopes toward the wheel; the bottom remains at arena floor height. `node tests/light-cycles.mjs` passed in headless Chromium on macOS, and the side-on wheel/trail capture was inspected. Seven focused cycle tests and production/documentation build passed.

## Cycle trails, wheel cleanup and self-shadowing — September 24

`node --test tests/light-cycles.test.js`: seven tests passed, including hold/flash/lower timing, releasing only a destroyed cycle's collision cells, opaque trail geometry lowering, and deterministic rounds. `node tests/light-cycles.mjs` passed in headless Chromium on macOS with the cycle shadow atlas active and no console/page errors. Inspected close-up renders for the smooth replacement hub caps, brighter blue, curved rear-wheel trail connection, visible thickness, fixed vertical bands and edges, and directional/self-shadow contrast. Cycles now use movement lanes independent of the floor grid. The floating scoreboard was removed after the visual check; it no longer allocates a canvas, texture or sign mesh.

Production/documentation build and whitespace validation passed. Original source assets are unchanged. Small details elsewhere on the purchased model still retain the source geometry; this is not a complete model rebuild. Safari and live visual preference remain for user review.

## Arena appearance and spectator safety — September 24

On macOS, headless Chromium checks `node tests/light-cycles.mjs` and `node tests/arena-inspection.mjs` passed. Inspected the close-up cycle render: opaque amber/blue trails with pale rear flares, darker blue bike bodies, thicker grid lines at 4.32 m spacing and a dark navy floor. Browser checks cover pause/resume, six rendered racers, model dimensions, matching enemy/Clu tank materials, and suppression of the death terminal during inspection. Safari appearance remains for user review.

The full simulation suite reported 283 passes and one outdated assertion that required a non-draw race after 180 seconds. With the smaller grid, that deterministic encounter draws; the test now verifies completed rounds, winner selection from surviving teams, score accounting and deterministic restart, including draws. All eight focused cycle/inspection tests then passed. Production build passed. Spectator damage tests cover bullets, debris and stomps, with normal damage restored on exit.

## Central labyrinth follow-up — September 23

`npm test`: 276 passed after fixed courtyard beam placement, eight interior tank spawns and six air patrol spawns. Four layout seeds verify counts, interior regions, beam coordinates and clearance. Central tank spawn connectivity now targets the courtyard with a 40,000-node offline budget; using the old outer-maze exit budget rejected valid deep-interior positions.

`node tests/wall-shadow-stability.mjs` passed in headless Chrome on macOS: zero dropped shadow pixels across 81 combinations of wall orientation, world offset and camera position/jitter, compared with the same clipped geometry without depth testing. `node tests/labyrinth.mjs` passed five-maze browser startup and geometry rendering. Safari at the user's reported viewpoint still needs visual confirmation.

## Central labyrinth — September 23

On the development Mac, `npm test` passed all 276 tests. Added checks compare roof triangle area against outlines minus holes, sample collision/occupancy agreement throughout the blueprint, verify an unobstructed central court, and check five-site separation, patrols, five beams and twenty transport pads across seeds 0, 42, 1982 and 99999. A ground route from the southern exterior to the central court succeeds with tank clearance (164 waypoints using 12 m search cells and a larger offline search budget); this establishes connectivity, not live autoplay performance through every passage.

`node tests/labyrinth.mjs` passed in headless Chromium on macOS at 1448×1086: normal game startup includes five beams/twenty pads, with no page errors. Inspected top-down, oblique and full-layout renders in `test-results/labyrinth-top.png`, `labyrinth-3d.png` and `five-mazes.png`. The contours match the supplied reference, roof holes remain open, and the center labyrinth fits without moving the outer mazes. Production/documentation build and `git diff --check` passed. Browser play feel and sustained large-maze AI performance remain for user review.



## Pursuit frame pacing — September 22

`scripts/benchmark-enemy-pursuit.mjs` reproduces twenty simulated seconds with five Recognizers and three maze tanks tracking recorded contact in blueprint/layoutSeed/runSeed 1982. Node CPU profiles on the development Mac identified synchronous route/replan bursts, repeated frontier sorting and redundant distant-pad footprint construction. In the measured profiled runs, worst simulation tick fell from 100.5 ms to 19.9 ms; the largest later replan spike fell from 33.3 ms to 8.8 ms. Total simulation CPU time fell from about 507 to 409 ms. These are one-machine simulation measurements, not guaranteed browser frame rates; budgeted work deliberately spreads smaller costs across more ticks.

`npm test` passed all 244 tests. New checks cover stable search priority/tie order, bounded and fair incremental route work, identical completed synchronous/incremental routes, cancellation, changed destinations, and independent tactical planning budgets. Existing maze radio pursuit, wall-side attacks, hidden-information invariants, teleport bounds and coordinated stomps also pass.

Chrome 153.0.8010.53 on macOS, 1280×720, local tactics without provider calls: twenty-second rendered checks with eight and then 25 active units returned median frame intervals of 16.7 ms and 95th-percentile intervals of 16.8 ms, with no page errors. Units tracked a recorded blueprint contact; these checks measure that encounter, not every viewpoint or live-provider workload. The rendered capture was inspected. Production/documentation build passed; generated HTML was produced by colvmn from Markdown, not edited manually.

## Maze tank pursuit connectivity — September 22

Reproduced on blueprint/layoutSeed/runSeed 1982: two of three maze-zero tanks had no route from their original spawn pockets to a recorded contact and remained stationary. Spawn exit validation and the expanded pursuit fallback allow all three replacement patrols to move; a 20-second local simulation measured approximately 36, 75 and 100 m displacement.

`node --test tests/ground-tanks.test.js` passed 21 tests. New checks verify swept exit routes for every blueprint patrol, more than 10 m of movement after an actual Recognizer radio report in Classic/local/JEV modes, retained report age and no direct sight of hidden Clu, and collision-safe partial progress from an unreachable pocket. `npm run test:browser -- --refactor` passed in Chrome 153.0.8010.53 on macOS: blueprint startup, snapshot isolation, pause, camera modes and three resets with stable 97 geometries, 28 textures and one audio context. No provider calls were required.

## Recognizer moving turns — September 22

The new navigation regression exercises 90° and 180° turns in Classic, local tactical, JEV-selected and escort controllers. Every fixture maintains more than 7 m/s throughout three seconds, travels more than 25 m and changes yaw by more than 0.7 radians without wall overlap. Tactical tests also retain wall-side stomp clearance and multi-location searching; the two-aircraft encounter completes a coordinated stomp. Straight waypoint lookahead and actual-pose attack clearance prevent the faster curved approaches from regressing arrival behavior.

`node tests/recognizer-momentum.mjs` passed in headless Chrome on macOS, including movement during yaw reversal, bounded angular/lift acceleration, pause, reset and tuning. The fixture explicitly selects Classic to avoid provider calls. The spotlight fixture now places a new contact ahead of the aircraft's changed heading; the older five-pursuer fixture now seeds its run and explicitly limits the roster to the five craft named by the check. Visual flight feel remains subject to play review.

Final `npm test`: 238 passed. Production/documentation build passed. `node tests/tactical-browser.mjs` passed mode switching, actual wall-side descent/crush, mocked unavailable-provider fallback, pause/reset and Classic isolation. The first attempts used an unused port and then mismatched the legacy authored wall fixture with the default blueprint world; the fixture now explicitly selects the authored maze and reproducible seeds on port 5173.

## Aircraft shadows blocked by maze geometry — September 22

Headless Chrome 153.0.8010.53 on macOS: `node tests/recognizer-shadow-occlusion.mjs` reproduced aircraft shadow leakage onto the far wall and covered floor, then verified the maze-depth mask. Exposed-roof shadow pixels remained 8,694; far-wall shadow pixels fell from 15,312 to zero and covered-floor pixels from 1,069 to zero. Detached-part wall leakage was zero. The separate projected ground silhouette fell from 941 leaked pixels to zero. The resulting fixture capture was inspected. These measurements cover the controlled geometry, not every possible viewing angle.

`node tests/recognizer-shadows.mjs` passed roof/wall coverage for intact aircraft and debris plus game shader compilation. Its debris capture now occurs at 0.2 seconds, before the blast can randomly scatter pieces beyond the small receivers. `node tests/materialization.mjs` passed wire/solid phases, two reinforcements, atlas growth, pause and reset. `npm run test:browser -- --refactor` passed combined game shaders and three restarts with stable counts of 97 geometries, 28 textures and one audio context. `npm test` passed all 237 tests. No provider calls were needed for these checks.

## Production gravity, aerial wheel and coordinated attacks — September 22

Final combined validation: `npm test` passed all 237 tests; production/documentation build and Worker dry-run packaging passed. Browser checks below used headless Chrome on macOS.

The previous free-fall test explicitly disabled damping and missed the production difference: at four seconds, vertical speed was 31.15 m/s rather than the undamped 39.24 m/s. Production now applies damping only to horizontal velocity. The revised test uses actual production settings, checks one through four seconds of velocity/displacement, and bounds the rendered interpolation lag. Sleeping-body position comparison allows floating-point epsilon.

`node tests/aerial-transition.mjs` passed in Chrome on macOS: aerial transition/heading, wheel zoom while running, wheel zoom while paused with frozen simulation, and return to the follow camera. Classic mode prevents provider calls. The bug was an obsolete `view.aerial` guard after camera ownership moved to `view.cameraRig`.

Additional simulation checks verify scenario-specific radio boundaries including vertical distance, a stable lead after relative distances cross, forbidden supporter strikes, destruction/blocked/expired-lease handoff, and a two-Recognizer tactical encounter where exactly one aircraft commits and completes a stomp. Existing opening pursuit and close-pursuer anti-spinning checks also pass. `node tests/breakup.mjs` passed rendered 15-block breakup, falling, pause and geometry cleanup in Chrome with Classic mode (no provider calls).

## Carrier escort and debris regression — September 22

On macOS/Node 22.22.0, `npm test` passed all 232 tests. `tests/escort-debris.test.js` exercises a 240-second blueprint crossing in JEV mode: both ground escorts stay clear of walls, take perimeter detours and return within 70 m of their formation slots; both airborne escorts return within 90 m. It also checks fresh versus stale target memory, visibility filtering, detached JEV debris snapshots, physics observation removal, settled/crossing/falling trajectories and turbo-aware stopping.

A real Rapier/session comparison reproduces lethal collisions against settled and falling debris with ordinary forward input. Applying the avoidance guard preserves full health in both fixtures. This establishes those reproducible cases, not invulnerability to tumbling debris or unavoidable close impacts.

`node tests/autoplay.mjs` passed in headless Chrome with mocked JEV responses: accepted decisions, movement, pause, manual overrides, background continuation and failure disengagement; no page errors or paid requests. The new simulation tests verify geometry/behavior rather than rendered escort aesthetics. Longer live encounters and avoidance feel remain subject to play review.

## Ownership cleanup, browser fetch, gravity and panels — September 22

Environment: macOS, Node 22.22.0, headless Chrome 153.0.8010.53 on this workstation. No new physical-device benchmark or Safari listening review was performed.

- `npm test`: all 224 tests passed after integrating the ownership/fetch, Earth-gravity and faster-panel changes. Timing assertions now use the configured transfer duration.
- `npm run test:browser -- --refactor`: passed seeded blueprint startup, detached debug state, pause, follow/aerial/gunner capture and three resets. Counts remained 97 geometries, 28 textures and one AudioContext. These counts do not prove complete leak freedom or visual fidelity.
- `node tests/autoplay.mjs`: passed mocked accepted decisions, movement, temporary manual override, pause/background lifecycle and service-failure disengagement, without paid calls. Native fetch/timer receiver regressions encountered during extraction were corrected and covered by a receiver contract test.
- `node tests/beam-camera.mjs`: passed again after faster panels: half-speed camera rise/orbit/return, pause and unchanged turret. Camera returns before opening.
- `node tests/teleporters.mjs`: passed partial entry, moving transfer, exit lock, pause and aircraft shaders; horizon/portal captures saved in ignored `test-results/`.
- `node tests/recognizer-audio.mjs`: passed offline sample metadata, stereo energy, hit/explosion routing and source cleanup.
- `node tests/maze-music.mjs`: passed exploration/approach/visibility/entry/afterglow/pursuit transitions and quiet fade, after updating the fixture to call the extracted music director.
- `node tests/debris-collision.mjs`: passed at the current 5173 dev server with 69 pieces, minimum visible bottom within floating-point epsilon of zero, 10 sleeping pieces after 4.5 seconds and zero remaining bodies after cleanup. The rendered capture was inspected.
- `npm run build`: passed production and generated documentation build.
- `npm run worker:check`: passed dry-run packaging; no deployment.

The enemy-free replay (`node scripts/replay-autoplay.mjs`, blueprint/layoutSeed/runSeed 1982) captured three beams at approximately 110, 335 and 665 seconds, then held until the 20-second stall cutoff at 706 seconds. This predates the panel speed change. It preserves the known later navigation defect; it is not a full-game success or a live-JEV quality test.

The gravity check measures one-second free-fall velocity and displacement of different-sized bodies at 9.81 m/s² with damping disabled for that measurement. Production keeps its existing mild damping, blast impulse and vehicle momentum. Recognizer parts previously used 14.7 m/s². Panel timing is now 0.5 s build + 11 s hold + 3.5/3 s retract; the faster sweep shares the same collision and display function.

Remaining human checks: Safari audio unlock/listening, driving feel and side-by-side visual comparison. Chrome regression results do not substitute for those checks. No new deployment was performed.

## Beam hold, autoplay objective and pad audio — September 21

Node checks passed: 30 across autoplay, maze sites, local/public Jev contracts; then 27 across teleporter, maze-site and autoplay checks after adding sound events. They verify the eleven-second hold, unchanged sweeps, sixteen-second completion, explicit player objective/progress, and exactly two spatial events per completed transfer with none during partial entry. `node tests/teleport-audio.mjs` passed offline Web Audio rendering in headless Chrome on macOS: departure/arrival/player cues produced finite, non-clipping samples; mute/reset rendered silence; all one-shot sources were released. The generated listening preview is `test-results/teleport-preview.wav`. Artistic sound balance still awaits the user's listening review.

## Autoplay cruise and turret continuity — September 21

`node --test tests/autoplay.test.js tests/jev.test.js` passed all 15 checks. Added regressions keep speed above 19 m/s throughout a clear 20-second cruise after acceleration, preserve speed through collinear route points while still stopping within the data-beam radius, and bring a turret initially pointing 90 degrees sideways back within 0.03 radians of travel direction. `node tests/autoplay.mjs` passed in headless Chrome with mocked Jev selections: samples over several route handoffs stayed above 19 m/s, turret direction recovered, pause and W/Shift+W takeover still worked, and no JavaScript errors occurred. No paid provider calls were made for this correction. These are clear-route checks; complex combat maneuver changes still intentionally slow/turn the tank and remain subject to play review.

## Spatial teleporters and Clu autoplay — September 21

`npm test` passed all 185 tests. On macOS/Node 22.22 with headless Chrome, `node tests/teleporters.mjs` passed driven partial entry, stationary wireframe clipping, pause, instantaneous moving transfer, whole exit/rearming and aircraft shader checks. Captures `teleporter-partial.png`, `teleporter-wire-arrival.png` and `teleporter-solid-exit.png` were inspected. The first arrival capture exposed interpolation across the world jump; preserving post-transfer interpolation history fixed it and the repeat check passed. Full-wireframe arrival no longer casts the solid tank floor shadow. Reinforcement `node tests/materialization.mjs` passed its rendered wire/solid phases, growing render/audio/shadow pools and reset after updating its stale fixture to Classic mode and the current 20-second reinforcement interval. Its initial old-mode run timed out; that timeout was not a successful regression check.

`node tests/autoplay.mjs` passed U/button switching, an accepted mocked player Jev response, actual movement, pause, and W/Shift+W takeover without JavaScript errors or paid browser requests. Node tests cover off-by-default behavior, real movement, line-of-sight information isolation, stale/disabled/pre-teleport rejection and shared serial player/enemy scheduling. One live player snapshot through the local Vite relay returned m0, confidence 0.64, accepted, in 456 ms (1,974-byte snapshot). This establishes the protocol integration, not strong autonomous play. Longer combat/maze exploration quality and wall/aircraft shadow clipping across all approach angles remain human review items. `npm run build` and the Worker dry-run succeeded. No public deployment of these features was performed in this change.

## HUD service warnings — September 21

`node --test tests/jev.test.js` passed all seven checks, including warning persistence through pause/reset and clearing after a successful but low-confidence answer. `node tests/system-warnings.mjs` passed in headless Chrome on macOS against local Vite: mocked outage shown in the HUD, retained while paused, Classic mode labeled JEV OFF, and successful service recovery hidden. No paid requests or JavaScript errors. Capture: `test-results/system-warning.png`.

## Public Cloudflare Jev relay — September 21

On macOS with Node 22.22 and headless Chrome, `npm test` passed 180 tests, including the new SQLite budget and public-client checks. `npm run worker:check` bundled successfully. A local `wrangler dev` instance with a dummy key and zero daily budget returned 429/Retry-After through the actual SQLite Durable Object without contacting Jev. The deployed Worker returned configured=true and a valid live choice. `node tests/public-relay.mjs --local` loaded the production build at the website origin, completed a browser CORS request and received m2 with confidence 0.72, with no asset/JavaScript errors. The initial run also produced a pacing 429; public clients now wait at least 1,200 ms between request starts against the Worker’s 750 ms minimum. The same opt-in smoke test without `--local` checks the live website and makes paid provider calls. Built files were scanned for the actual key with no matches. Quotas bound request/input volume, not exact dollar spend; long public load testing and cost tuning remain outstanding.

## Blueprint alternative — September 12

The optional `?maze=blueprint` layout hand-traces 20 roof islands from Maze Blue Print.png. A top-down reference preset and source/trace SVG overlay make the geometry reviewable. The existing authored maze remains the default.

- `npm test`: 16 checks pass. The three new checks verify triangulated area equals polygon area for all islands, concave notches and above-roof sight behavior, occupancy/ray agreement across thousands of sample points, a clear spawn/entry route, and clear AI search samples.
- `node tests/reference.mjs`: passes the original five comparison views, four documentation cards, the blueprint top-down/overlay render, and an eight-second drive into the traced maze. The tank enters at the cropped lower boundary, reaches a real wall without penetrating it, and all five aircraft remain present. No browser errors after correcting an integer-valued GLSL denominator in the new identity-axis layout.
- Visually inspected blueprint-overlay.png and blueprint-aerial.png against the supplied image. Coordinates follow roof boundaries rather than the image's small side shadows. No unseen wall continuation is implied.
- `npm run build`: succeeds and regenerates the trace overlay and five documentation pages. Blueprint geometry is bundled as local data, with no runtime need for the source image.

Scale (0.8 m/pixel), wall height (54 m), cropped-boundary closure and cosmetic ledge depths remain stated reconstruction choices. These checks do not establish an exact original-film layout.

## Renamed references and wall details — September 12

Updated the reference studio and documentation to the user's descriptive image filenames, including Maze Details.png. Added a fifth fixed camera for the new wall reference. Sparse blue-gray seams, tall panel outlines and shallow beveled ledges now follow exposed wall faces. These details are cosmetic; passage geometry and collision volumes are unchanged.

Validation: `npm run build` passed. `node tests/reference.mjs` passed all five rendered comparisons, verified reference images loaded, and checked the four documentation cards and destination pages. Inspected test-results/reference/details.png for the actual wall detailing. No browser errors.

## Fixed reference iteration and visibility — September 12 evening

Added a local reference studio at /reference.html with fixed front/rear tank, overhead maze and ground-level maze cameras, film images alongside the live renderer, and a reference overlay. Captured and visually inspected successive material, camera, floor and shadow passes.

The disappearing maze was a contrast regression: the walls and floor still rendered but became nearly black at driving height. Restored blue floor/wall separation. A view-height/grazing-angle wash keeps the ground readable during driving while preserving dark channels in overhead views. Maze geometry keeps the longer parallel branches and pointed diagonal ends the user preferred; no further topology changes were made after that feedback.

Tank red outlines are subdued and non-emissive. Blue highlights, dark lower side panels, gold upper shoulders, reduced insignia bloom and projected hull/turret shadows replace the earlier luminous trim and soft contact-only shadow. Imported geometry remains intact; its canopy and hull contours still differ from the film. The overview is an interpretation, not an exact traced map.

- `npm test`: all 13 checks pass. Wall fixtures now target a straight boundary section instead of a newly clipped corner; movement vectors derive from the oblique grid transform.
- `node tests/reference.mjs`: four reference views render without browser errors; all four documentation cards are present and their destinations return HTTP 200. Captures are in test-results/reference.
- `npm run test:browser`: Chrome 152.0.7977.84 passes actual maze entry/branch driving, level turret, shooting, visibility/memory, pause, aerial/survey and ten resets. 1440×900 sample: 44 geometries, 14 textures, 57 calls, median and 95th-percentile frame intervals about 16.7 ms. Inspected the final driving capture for visible walls and flooring.
- `npm run build`: succeeds; colvmn generates five documentation pages.
- Sandboxed Chrome launches aborted on this host and produced macOS crash dialogs. Subsequent launches explicitly used the required approved execution mode. One screenshot attempt timed out; the subsequent capture completed. This is not evidence that every host or browser is verified.

## Imported vehicles — September 12

Replaced both procedural vehicles with user-supplied GLBs: arabinowitz's tank and Shriker1's Recognizer. Inspected the actual rendered models together and the tank in the maze.

- `npm test`: all thirteen simulation checks pass after the muzzle coordinates changed.
- `node tests/models.mjs`: visible muzzle agrees with the simulated origin across nine hull/turret combinations (maximum error 3.7e-15 meters); Recognizer height is 15 meters, width 18.38 meters, and hit materials are independent per aircraft. Screenshot: test-results/imported-models.png.
- `npm run test:browser`: Chrome 152 passes controls, shooting/destruction, five agents, entry/branch driving, pause, map/aerial, ten resets and resize with no page/console errors. Sampled 1440×900 frame intervals: median 16.7 ms, 95th percentile 16.8 ms. Final renderer sample: 43 geometries, 14 textures, 52 draw calls.
- `npm run test:browser -- --lifecycle`: passes blur/input cleanup, mute, reduced motion/quality, context loss, unsupported WebGL, failed GLB loading/reload message, and production preview driving with no development hook.
- Production build includes both local GLBs; no external model host is contacted.
- Earlier 180-second traversal measurements below predate the imported vehicles. Safari remains unverified.

## Current simulation revision — September 12

The latest user direction replaces the timed chase with an open-ended simulation. Earlier route/capture/win evidence above is historical and does not describe current behavior.

The current maze is connected and branching, with loops, dead ends and four openings. Its topology is transformed onto oblique axes, and exposed slab tips are clipped diagonally. Shared convex prisms drive the roof/wall mesh, hull collision, projectile blocking, sight occlusion and camera clearance. This follows the supplied overhead frame's forms; the hidden layout is authored, not verified as the exact film maze.

Five Recognizers begin outside the maze and persist independently. They use a 370 m view range, approximately 148° horizontal field of view and 5 Hz sight sampling. Each stores its own observed position/velocity, time and source. Radio reports are delayed 0.45 seconds, range-limited to 560 m, and retain their original timestamp through relays. Prediction is capped at five seconds and stops at mapped walls; knowledge expires after 38 seconds. Navigation receives no live Clu state. Aircraft clear the roof physically and separate from one another; sound uses five spatial voices with wall muffling.

Recognizers are uniformly half the old scale: upright legs about 9 m (30 ft), total height about 15 m and shoulder width 17.5 m. Hit volumes and flight clearance use the same scale. This implements the user's estimate, not a canonical film measurement.

Checks completed so far:

- `npm test`: thirteen checks pass for connectivity/branches/cycles/dead ends, collision/sliding and pivot turns, roof and wall visibility, field of view, occlusion freezing memory, delayed radio copying/expiry, identical observer behavior under different unseen Clu locations, bounded prediction, level/manual gun azimuth with height assistance, wall-blocked shots, persistent agents and clean resets, fixed-step consistency, physically open diagonal cuts, and physical aircraft clearance during converging pursuit.
- `npm run test:browser`: Chrome 152.0.7977.84 passes five aircraft/audio sources, Q/E rotation and level barrel, actual entry and side-branch driving, pause freezing the aircraft, aerial/survey views, sighting/report memory, real projectile destruction, ten resets and resize. No page/console errors. At 1440×900, final sample: 243 uploaded geometries, 13 textures, 78 draw calls; approximately 16.7 ms median / 16.8 ms 95th-percentile frame intervals.
- Inspected actual browser screenshots of the entry, diagonal slabs and survey. A generated floor-shader constant initially used an integer where GLSL required a float; corrected and the full browser check rerun. The gun fixture now changes the live development settings through the existing module instance, avoiding a duplicate Vite import; projectile outcomes still use normal simulation collision.

The old structured-chase long-run report predates this revision. Current sustained traversal and production/lifecycle results are recorded below when completed. Human judgment of atmosphere, exact film matching and sound remains separate from these technical checks. External model acquisition was subsequently completed; see the imported-vehicles checks above.


The 180-second 1920×1080 traversal passed: 24 waypoints and approximately 1,299 meters through actual branches, no slab penetration, no page/console errors, and 242 uploaded geometries / 13 textures from the 60-second sample onward. Sampled frame intervals after warmup were about 16.7 ms median and 16.7–16.8 ms at the 95th percentile. Agents independently entered pursue/investigate states during the traversal. This run preceded the final aircraft-clearance adjustment; the resulting crowding seen from above was addressed with stronger avoidance and a 24-meter separation envelope. A focused 20-second convergence test passes after that adjustment.

`npm run test:browser -- --lifecycle` passed for blur/input cleanup, mute, lower quality, reduced camera motion, context-loss recovery, unsupported WebGL handling and production driving without development hooks. The production bundle and four colvmn pages build successfully; JavaScript is approximately 161 kB gzipped, with Vite's standard chunk-size advisory. Chrome is the tested browser; Safari/Firefox and subjective sound quality remain unverified for this revision.

The final browser smoke rerun also passed the converging-aircraft clearance scenario, real shooting and all previous control/reset checks, with zero page/console errors and approximately 16.7 ms median/95th-percentile frame intervals at 1440×900.

The final terminal check passed incremental typing, Enter skip/start, reduced-motion immediate reveal and the narrow-window layout. The narrow terminal screenshot was visually inspected.

## Historical validation reports

These entries describe earlier builds and are retained as a development record.


Date: 2026-09-12. This report distinguishes verified technical behavior from pending human playtesting and visual fidelity work.

## Environment

- MacBook Pro, Apple M2 Max, 96 GB RAM; macOS 26.6.2.
- Node 22.22.0; Three.js 0.186.0; Vite 8.3.0; Playwright 1.63.0.
- Chrome 152.0.7977.84, browser automation with actual WebGL rendering. Screenshots were opened and visually inspected.
- Reported GPU: `ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Max, Unspecified Version)`.
- Standard smoke viewport: 1440×900, render scale 1, pixel ratio 1. Long-run viewport: 1920×1080.

## Passed checks

`npm test`: six meaningful simulation tests pass:

- Acceleration, braking/reverse, high-speed wall containment, and glancing wall movement.
- Matching simulation displacement under 30, 60, and 144 Hz render scheduling.
- Capture warning delay, exposure accumulation/decay, loss, and terminal-state priority.
- Real projectile hits and three-hit Recognizer destruction.
- A full authored route using steering/throttle/fire: 74.85 simulated seconds, three Recognizers destroyed, maximum centerline error about 1.29 meters.
- Independent clean state on restart.

`npm run build`: production bundle builds successfully. Vite reports the main JavaScript chunk is larger than its default 500 kB warning threshold; gzip is approximately 158 kB. This is primarily the Three.js renderer and addons, not remotely loaded game data.

`npm run test:browser`: Chrome checks pass with no page/console errors:

- Start and actual keyboard-driven movement.
- Pause/resume and restart.
- Cannon destruction using Space; scenario placement establishes a target, but actual projectiles and collision determine the result.
- Capture/loss and crossing the exit/win, both through real simulation rules.
- Ten restarts with one audio context and clean projectiles/kill count.
- Resize to 960×640.

The initial browser run exposed a GLSL reserved-word error in the capture-zone shader; that was corrected and the complete smoke check rerun successfully. Full-route simulation also exposed late enemy overtaking; approach timing and velocity-leading cannon aim were adjusted, and the route test now defeats all three encounters.

## Long-run / additional-browser checks

A ten-minute 1080p Chrome test drove eight complete winning runs using actual keyboard input, each taking 74.65–74.68 seconds and destroying all three Recognizers. No page/console errors occurred. After the first complete route, uploaded GPU resource counts stayed at 140 geometries and 13 textures through subsequent runs. Frame intervals after warmup were about 16.7 ms median and 16.8 ms at the 95th percentile.

The original harness ended with an assertion failure because its comparison baseline was taken at 30 seconds, before all canyon sections had appeared and uploaded their geometry. This was a test-baseline error: the log showed 131 geometries at 30 seconds, then 140 at 60 seconds and the same 140 for the rest of the run. The harness now compares after a complete route and saves its raw report before assertions. The targeted three-minute rerun passed with the corrected gate and the final pause-audio fix: two more winning runs, three kills each, stable 140 geometries / 13 textures, and no page/console errors. The raw report is saved in `test-results/soak.json`.

`npm run test:browser -- --lifecycle` passed: blur pauses and clears throttle, mute works, reduced-motion and low-quality modes render, graphics-context loss and unsupported WebGL 2 produce useful messages, and the production preview drives without development hooks. Local references in the built HTML and generated documentation also resolve.

Firefox/WebKit are not validated. The initial attempt using older cached builds stalled and was stopped. A bounded check using the current Playwright package's own paths reported that its matching Firefox 1543 and WebKit 2359 executables are not installed. The compatibility script now has a watchdog and accepts explicit browser-path overrides. Safari itself was not automated.

## Visual and sound review

Inspected screenshots show a clear chase view, solid faceted canyon walls, muted blue/purple surfaces, a rounded-pod tank, and a large solid Recognizer with warm edge details. The initial overly glossy tank highlights were reduced and antialiasing added to the postprocessing target. The vehicles remain procedural stand-ins; fuller film matching is still needed.

Audio graphs initialize from the Start gesture, synthesize all sounds locally, and maintain a single context over restarts. Positional sources follow the Recognizer and the listener follows the camera. Subjective loudness, engine weight, and the resemblance of the rotor/drone require human listening feedback; automated interaction does not establish sound quality.

## Remaining work and limits

- Human playtesting: tank feel, corner readability, camera motion, cannon aiming, capture fairness, and sound balance.
- Actual Safari testing. A Playwright WebKit result, if available, is reported separately and does not count as Safari validation.
- Final film-accurate assets. The 13 supplied frames now cover multiple angles; exact video timestamps remain unrecorded.
- No imported GLB asset has been exercised; the adapter exists for a later replacement.
- No mobile controls, backend, multiplayer, progression, or deployment.
- Performance claims apply to the recorded Mac/browser/quality setting; they do not establish low-end hardware performance.

Reproducible screenshots and raw reports are in the ignored `test-results/` directory. See the README for commands.


## September 12 — supplied-frame art and terminal pass

All 13 user-supplied PNGs were inspected. Rebuilt the tank deck, shoulders, canopy and cannon; rebuilt the Recognizer roof, body depth, end pods and leg panels; replaced jagged cliffs with flat-topped maze slabs, subtle wall panels and grid courts. Simplified Recognizer hit volumes were adjusted to the lower crown and deeper body. The route and vehicle dynamics are unchanged.

The home screen now uses local VT323 lettering, the two lines from the terminal still, timed character reveal with a line pause, a blinking cursor while typing, and a faint perspective grid. Enter skips typing and subsequently starts the game; reduced-motion preferences show all text immediately. Start instructions become visible after the sequence.

Verified on Chrome 152.0.7977.84:

- `npm test`: all six simulation tests pass after the hit-volume adjustment; complete route remains 74.85 simulated seconds with three kills.
- `npm run test:browser`: driving, pause/resume, shooting, loss, win, ten restarts and resize pass with no page/console errors. The smoke run recorded 153 uploaded geometries, 13 textures, 95 draw calls at its final sample and approximately 16.7 ms median/95th-percentile frame intervals at 1440×900.
- `npm run test:browser -- --terminal`: progressive partial text, hidden start controls during typing, Enter completion without accidental starting, a second Enter starting, reduced-motion immediate reveal and 640-pixel-wide layout pass.
- `npm run build`: production assets and all four colvmn documentation pages build successfully. Main JavaScript is approximately 161 kB gzipped; Vite's default chunk-size advisory remains.

The rendered terminal, chase and Recognizer screenshots were visually inspected. These establish a second reviewable interpretation, not final film fidelity. Sound is unchanged in this pass.

A fresh `npm run test:browser -- --soak --duration=180` passed at 1920×1080 with the final geometry and revised hit volumes: two completed wins (74.68 and 74.65 seconds), three kills each, no page/console errors, stable 152 uploaded geometries / 13 textures after warmup, and approximately 16.7 ms median and 95th-percentile frame intervals. Chrome required an approved launch outside the filesystem sandbox. The current raw report is `test-results/soak.json`; earlier figures above describe the first build.

## September 12 — manual turret and angular maze correction

Q/E now turns the turret independently of driving, including while stationary. Its angle is an offset relative to the hull and resets on restart. The rendered barrel remains level. Shot azimuth follows the manual turret bearing exactly; height assistance and vertical lead apply only to a horizontally aligned Recognizer. Unlocked shots stay level. Projectile origin follows the offset turret and muzzle.

The route now interpolates linearly between nodes. Wall buffers split at every route corner and use flat vertical faces, so neither the road nor the walls round the bends. Widths still taper linearly, and the layout remains an authored adaptation rather than the film's exact map.

`npm test`: all nine tests pass, including stationary turret rotation/reset, manual shot azimuth with vertical-only assistance, and straight spans/hard corners. Full-route simulation completes in 74.00 seconds with three kills and maximum centerline error 3.09 meters. A new assertion initially distinguished JavaScript negative zero from zero; it was corrected to compare heading magnitude.

`npm run test:browser`: Chrome 152 passes Q/E keyboard rotation without hull movement, level barrel with an elevated target, turret restart, movement, pause/resume, cannon destruction, loss, win, ten restarts and resize, with no page/console errors. Final smoke sample: 164 uploaded geometries, 13 textures, 101 draw calls; 1440×900 frame intervals approximately 16.7 ms median / 16.8 ms 95th percentile. Turret and encounter screenshots were visually inspected. The earlier 1080p soak predates this route/control correction and was not repeated for this update.

The asset inventory now includes four inspected internet model previews and metadata. No external model has been imported; Sketchfab's official source-download endpoint requires authentication.


## Default blueprint game entry

The normal game URL now selects the blueprint maze. `?maze=authored` retains the original; the reference studio keeps its original fixed-camera studies unless explicitly switched. `npm test` passed all 16 tests and `npm run build` succeeded. The Chrome reference check (`node tests/reference.mjs`) verified the plain `/` URL selects the blueprint, driving into its entrance and wall collision, five active Recognizers, and the explicit original-layout URL. Reference captures and documentation cards also passed with no browser errors.

## Recognizer crush attack — September 13

Read all four supplied attack frames. Added articulated leg closure and a sight-triggered, committed vertical strike, followed by recovery. `npm test` passed 19 tests, including autonomous approach/crush, escape after commitment, blocked descent, stale sight rejection, recovery and reset. `node tests/models.mjs` verified the unchanged 15 m model height and material independence and captured open, turning and closed poses. Inspected the rendered closed pose and in-game impact. `node tests/reference.mjs --attack` passed in installed headless Chrome with no browser errors: crush, escape, disabled wreck and R reset. `npm run build` succeeded; its existing bundle-size advisory remains.

Timing is inferred from four untimed stills. The imported wedge-shaped feet are simpler than the film's block soles. Descent clearance and weapon volumes remain conservative approximations rather than triangle-level rigid-body collision.

## Forward-thrust Recognizer flight — September 13

Replaced direct velocity targeting and lateral avoidance forces with bounded forward thrust, isotropic drag/braking, and heading-based avoidance. Momentum survives yaw changes; pitch and roll are zero. Crush preparation requires a slow approach and preserves decaying residual drift. `npm test` passed all 22 checks, including forward acceleration, turn momentum, avoidance direction, and crush approach/drift. Flight constants (meters, seconds, radians) live in src/simulation/flight.js. Physical overlap correction remains a collision constraint, independent of propulsion.

`node tests/reference.mjs --attack` also passed in Chrome: crush, escape, wreck controls and reset, with no browser errors. Production build succeeded.

## Attack approach damping

Increased passive drag from 0.45 to 0.7 per second and added braking drag from 1.15 to 2.4. Increased available forward acceleration to preserve cruising capability. When inside a visible target’s clear strike footprint, the aircraft holds its heading and brakes instead of turning after its overshoot. All 23 simulation tests passed, including a regression for settling into an attack without yaw changes. This tuning pass was checked through simulation tests; visual feel remains for user review.

## Close-range steering and aerial view corrections

Reproduced five aircraft spinning around a stationary target: 1.70–1.94 accumulated turns per craft over 20 simulated seconds. Close-range yielding and alignment reduced this to 0.45–0.77 turns in the same scenario, with a successful crush. Hover stabilization now works even where a roof blocks descent. All 25 simulation tests passed, including the crowded approach and blocked descent regressions. Chrome attack checks passed for the five-craft approach, crush, escape, reset and Space Paranoids page title with no browser errors.

V aerial view previously used the ground-camera grid cutoff (650 m), below much of its viewing distance, and reduced floor brightness to 16%. It now has its own floor visibility, grid fade at 1800–3000 m, and fog multiplier 0.06 (previously 0.35). The floor geometry remains at ground level. Ground cameras and reference-studio lighting retain their existing settings.

Aerial grid follow-up: reduced V-view line blend from 0.95 to 0.22 to soften the overly bright white lattice. Floor visibility and aerial fog remain as corrected; ground-view grid styling is unchanged. Production build passed.

Further aerial-grid adjustment from user review: reduced line blend from 0.22 to 0.045 for a faint lattice. Floor brightness is unchanged.

## Terminal-to-grid opening

Added a 5.5-second opening: terminal fade, grid reveal, camera descent to Clu. Simulation time remains frozen during it, and audio unlock still comes from the start gesture. Escape pauses/resumes the sequence; Enter or Space skips it. Reduced-motion mode begins gameplay immediately. R resets directly into gameplay.

`npm run test:browser -- --terminal` passed typing, Enter start, frozen simulation during camera movement, pause/resume, reduced-motion bypass and narrow viewport checks. Inspected fade and grid-reveal captures. Production build passed.

## Nearby Recognizer camera framing

Added a smooth upward tilt for nearby visible aircraft in the forward camera sector. A pullback of up to 32 m and up to 8 additional degrees of vertical FOV allow an overhead craft and the tank to share the frame. Pitch is capped against the tank top after camera collision adjustment. Aerial, opening and studio cameras retain their own framing. `node tests/reference.mjs --camera` passed projected tank-top and Recognizer-crown visibility at heights 77, 30 and 11 m with no browser errors; inspected captures. Build passed. The first test attempt was interrupted by a development reload during the concurrent build; the sequential rerun passed. Walls can limit the available pullback, so full-aircraft framing is not guaranteed in confined passages.


## Film-derived stereo audio

Four stereo samples extracted from the local video and decoded successfully in Chrome. Original-channel correlations are 0.33 (tank), 0.75 (Recognizer flight), 0.46 (approach), 0.96 (cannon), confirming preserved channel differences. Peak amplitude is 0.72; none clip. The stereo HRTF test measured left-source RMS L/R 0.380/0.280 and right-source RMS 0.279/0.379; moving the emitter farther reduced right RMS to 0.040, while wall filtering/attenuation reduced it to 0.155. Approaching/receding Doppler ratios were 1.045/0.958.

`node tests/reference.mjs --audio` passed left/right direction, distance, wall muffling, Doppler, four sample decodes, audition start/stop, pause, stable loop count (11 sources) across firing/resets, one AudioContext, and an individual missing-sample fallback. An initial test omitted the wall gain multiplier; corrected the fixture to exercise both filtering and attenuation. A development reload interrupted the next attempt; the stable rerun passed. These are signal and lifecycle checks, not a listening judgment. Auditory review of background soundtrack and loop quality remains pending on the audition page.

The final production build and `npm run test:browser -- --lifecycle` passed: mute, blur/pause, quality/reduced-motion settings, error paths and production driving.

Tank dialogue correction: replaced the reported spoken section with a short opening texture, retaining stereo and a smooth loop crossfade. Verified 0.58 s duration, two channels and peak 0.72. Hash checks confirm both Recognizer loops and cannon are untouched. Versioned the tank URL to avoid stale browser audio.

## Tank-loop tone and post-crush patrol

Reduced the tank loop’s end-of-loop 330 Hz component by 15.7 dB after normalization, using a −18 dB/Q=4 notch and a 650 Hz low-pass. Other sample SHA-256 hashes remain unchanged. Tank sample URL is revision 3. Listening review remains with the user.

Confirmed destruction now invalidates target memory, aborts redundant strikes into recovery and propagates through existing delayed/range-limited radio. Old sightings cannot restore pursuit. All 26 simulation tests passed, including return to wander after recovery, stale-message rejection and reset. The close-approach turning regression now stops measurement at the crush; subsequent legitimate patrol turns are no longer counted as attack circling.

Opening text polish: a CSS block cursor follows the typed text, stays visible during typing, then blinks after completion and fades with the opening transition. Removed maze-selection links from the terminal screen.

Home-page simplification: hide all terminal actions, controls, explanatory copy and links; only access text and cursor remain. Return completes typing or starts the opening once typing is complete. Browser scenarios now enter using Return.


## September 13 — opening, controls, distance and sound revision

- `npm test`: 29 passed, including immediate reverse after a blocked wall approach, tangential sliding, and 1,000-foot three-dimensional radio range.
- `npm run build`: passed; existing large-bundle advisory remains.
- Chrome via `npm run test:browser -- --terminal`: passed typing/start, no pre-start grid, live Recognizer motion, full-speed tank startup, camera position relative to the moving tank during descent, W release, paused simulation, reduced motion and narrow layout.
- Chrome lifecycle checks: passed minimal standby, held-W resume, consumed fire/reset/view keys, focus loss, failure states and production driving.
- Chrome camera checks: passed turret orbit at ±90°/180° and keeping tank/overhead Recognizer in frame.
- Chrome audio checks: passed stereo direction, distance attenuation, wall filtering, Doppler, sample decode, restart resource stability and missing-file fallback.
- Inspected `test-results/opening-clu.png`: distant maze silhouette visible from the exterior approach.
- Audio listener now follows camera position (superseding the earlier tank-anchored listener). Tank uses a stereo emitter with an 18 m reference distance. Terminal audio initializes before typing when browser autoplay policy permits; a user gesture is required when policy blocks playback. Cannon/terminal timbre still needs human listening approval.

Opening-pursuit follow-up: terminal browser check passed with exactly three initial pursuers; all three project inside the opening camera frame. Inspected `test-results/opening-fade.png` and confirmed the staggered formation is visible behind moving Clu. Unit tests remain 29/29 and production build passes.


Music/terminal follow-up: production build and Chrome audio regression passed, including music playback, pause/resume and restarting from the beginning. Typing-audio browser check passed: clicking the ready screen resumes audio and replays all 59 non-newline character tones, then Return starts normally. Click gain increased from 0.035 to 0.16 of master volume and duration from 18 to 35 ms. Browser autoplay permission still determines whether the first unprompted typing is audible.


## Formation, lead and destruction checks

- `npm test`: 33 passed. New checks cover a twenty-second advancing formation with preserved lateral spacing, speed coordination, 3D intercept solutions, and an actual simulated projectile hitting a crossing Recognizer.
- `npm run test:browser -- --terminal`: all three more distant pursuers remain inside the opening frame.
- `npm run test:browser -- --breakup`: passed model-fragment variation across two destructions, paused debris, falling pieces and GPU geometry cleanup after expiry. Inspected early and falling screenshots. Timing assertions follow effect age rather than wall-clock capture duration.
- Production build passed, with the existing bundle-size advisory. Fragments use surface partitions, not closed volumetric fracture meshes; wall/floor response is approximate and fragments are visual, not damaging simulation actors.


Latest checks: 34 unit tests passed, including dynamic lead/support reassignment and dissolution, shortest-path turret centering and manual interruption. Chrome opening-controls checks passed keyboard/mouse fire, driving and turret operation during zoom, and held-input continuity. Typing-audio check decoded four film-derived samples and replayed all character clicks. Lifecycle check passed F centering, pause/resume and production controls. Audio check measured nonzero output during the opening with zero shots fired. Keyboard tail revision verified all four PCM clips end at zero with final-10-ms RMS below 15% of their first-30-ms RMS. Human listening review remains necessary for timbre.


Smaller terminal/CRT revision: build and terminal browser checks passed. Inspected the 1440×900 capture: smaller text remains readable under the scanlines. Opening fade, reduced-motion entry and narrow viewport checks also passed.


Turbo and predictive-stomp revision: 37 unit tests pass, including full ten-second boost, one-minute recharge, braking, reset/crush state, predicted fold/drop timing, misses after changing course, and autonomous moving-target interceptions from three initial separations. Chrome terminal checks confirm all five initial pursuers remain in frame; inspected the rear-view capture after restoring roof-clear flight altitude. Chrome turbo/hints checks passed T activation, pause/expiry, recharge lockout and ready indicator, plus centered single-row hints after input inactivity. Production build passes.


Aerial zoom: build and Chrome aerial-zoom checks passed. Wheel scrolling reaches the 150–2,400 m height limits smoothly, works paused, preserves zoom across V toggles and ignores scrolling in driving view. Inspected the far overview capture; maze and floor render without clipping.

## September 13 — carrier and localized breakup

- `node scripts/prepare-carrier.mjs`: converted the DAE, confirmed all seven textures loaded, round-tripped GLB in Chrome and captured `test-results/carrier-preview.png`. Inspected the rendered silhouette and materials.
- `npm run test:browser -- --carrier`: passed in headless installed Chrome, outside the sandbox. Measured constant +X transit at 24 m/s, constant altitude/depth and frozen position during standby. Six direct surface hits (body and each leg, open and folded) selected the expected part, preserved two intact sections, and conserved every source triangle. No page errors. Inspected `test-results/carrier-game.png`.
- `npm run test:browser -- --breakup`: passed randomized breakup, falling, pause and geometry cleanup. Updated the fixture to cruising altitude: the earlier low-altitude fixture inherited climb velocity and invalidated its four-second falling expectation.
- `npm test`: all 37 simulation/blueprint checks passed.
- `npm run build`: passed; existing large JavaScript chunk advisory remains. Carrier adds 6.86 MB to packaged assets. No interactive human performance/fidelity sign-off is implied.

## BEGIN button and carrier visibility

`npm run test:browser -- --typing-audio` passed with Chrome user-activation autoplay policy: no terminal or grid before BEGIN, four decoded typing samples and 59 character clicks after activation, no restart from an incidental click, and Return starts the opening. `--terminal` passed typing, skip/start, opening, pause/resume, reduced motion and narrow viewport. `--carrier` passed transit/pause and section integrity checks. Inspected `test-results/begin-button.png` and `test-results/carrier-game.png`; the complete carrier hull is visible against the dark sky. Build passed with the existing chunk-size advisory.

Carrier contrast correction: restored source hull colors and textures, reduced blue emission, and adjusted roughness for directional shading. Applied a small depth offset to the original illuminated trim so coplanar hull surfaces do not hide it. Inspected the revised in-game capture; `npm run test:browser -- --carrier` passed.

Carrier red/blue trim pass: `npm run test:browser -- --carrier` passed. Inspected `test-results/carrier-game.png`: subdued red outline with visible smaller blue panel boundaries. Production build passed.

## Roaming map patrols

`npm test`: 38 checks passed, including separated/reproducible unalerted patrols, vision cutoff with altitude, wall occlusion and information-limited search. `npm run test:browser -- --patrols`: nine aircraft and sound voices initialized; four extra patrols moved autonomously and froze during pause, without page errors. Production build passed.

Carrier presence / section refinement: `npm run test:browser -- --carrier` passed audio sample decode (no load errors), animated beacon changes, straight transit/pause and triangle conservation with five unhit sections retained whole. `--breakup` passed randomized motion, falling, pause and geometry cleanup. Inspected final-shot contact sheets and updated in-game screenshot showing the more distant/left carrier and brighter maze seams. Build passed. Audio timbre and precise film blink phase are not claimed verified.

Clu breakup: all 38 simulation tests passed. `npm run test:browser -- --tank-breakup` passed actual autonomous stomp, fragment creation, intact tank/shadow hiding, paused debris, expiry and restart restoration. Inspected `test-results/clu-breakup.png`, including the new blue fracture boundaries. Build passed. The browser fixture was corrected to wait for BEGIN audio initialization before pressing Return.

Static terminal: `npm run test:browser -- --typing-audio` passed immediate full text, absence of BEGIN, zero typing clicks and a single Return starting the opening with audio unlocked. Build passed.


### Recognizer searchlights — September 13

`npm run test:browser -- --searchlights` passed in headless Google Chrome on macOS. A controlled search encounter produced a visible beam, inspected in `test-results/recognizer-searchlight.png`. Tests check active/inactive aircraft, frozen pause intensity, disabled attack/pursuit poses, and geometric wall/floor ray clipping; no browser or shader errors were reported. This does not establish film-exact motion. The camera-facing ribbon approximates a volume; surface illumination and matching a future video remain open visual refinements.


### Ground escorts and shared radio — September 14

The existing 38 simulation tests and eight ground-tank tests pass. New coverage includes carrier pace, sight range/facing/occlusion, bidirectional ground/air radio with unchanged sighting age and range, independently aimed rounds destroying Clu, Clu destroying enemies, independence from hidden Clu movement, swept route clearance around a slab, and ground formation leader replacement.

`npm run test:browser -- --ground-tanks` passed in headless Google Chrome on macOS. Checks cover eight units, turret movement with a level barrel, enemy fire, Clu and enemy tank fragmentation, pause and reset, with no browser/renderer errors. Rendered captures inspected: `test-results/ground-escort.png`, `test-results/enemy-tank-firing.png`, and `test-results/enemy-tank-breakup.png`. Build passed. Large-scale traffic through every blueprint passage and enemy sound balance remain human playtest items.


### Startup presentation — September 14

The HTML supplies a black background immediately and loads the stylesheet through a render-blocking link. Content is hidden until styles apply, avoiding an unformatted text flash. Controls appear at game entry and remain until ten simulated seconds after the first gameplay key press; the Return used to start does not count. Later keyboard activity re-enables the idle reminder. Pausing freezes the countdown, and resetting starts it over. `npm run test:browser -- --startup-ui` passed with deliberately delayed CSS, initial controls visibility, timed fade and subsequent idle reminder checks.


### September 14 follow-up checks

Simulation coverage now includes stabilized gunner yaw, manual shot elevation, pitch limits, zoom-sensitive aiming, alert decay/renewal and cross-unit reports, and reverse turbo direction/caps/easing. Browser checks `--gunner`, `--cruise`, and `--searchlights` passed in Chrome. `test-results/gunner-sight.png` was visually compared with the supplied reticle image. Controls/startup checks also cover delayed CSS and initial hint timing.

The final simulation suite passes all 52 tests. Gunner controls use J/L in both views, I/K for elevation, and O for zoom; Q/E rotation is disabled. Zoom sensitivity is tested against the field-of-view ratio.

Gunner inertia follow-up: all 53 simulation tests pass, including acceleration, release/deceleration, direction reversal and clearing motion on mode exit. The gunner Chrome check passed with settled aiming before stabilization/projection assertions.

`npm run test:browser -- --death-terminal` passed: a real fatal projectile triggers breakup, partial opacity during the fade, the exact two-line message with hidden game/HUD/cursor, and Return into a fresh run. The terminal capture is `test-results/death-terminal.png`.

Final sizing/weapon checks: all 55 simulation tests passed, plus the strengthened scale-dependent separation check. `node tests/models.mjs` verified Recognizer height 19.5 m, feet at ground height zero, correct muzzle transforms, and folded poses without errors. The imported-model capture was inspected. F leveling and the five-second Clu projectile lifetime are covered by focused tests; the gunner Chrome check passed after those updates.

Recognizer breakup pacing: `npm run test:browser -- --breakup` passed in headless Chrome on macOS. Verified one fragmented section and five intact detached sections, randomized outcomes, falling debris, pause freezing, and geometry cleanup. Inspected the early and four-second falling captures; debris has reached the floor by the latter capture.

Stronger blast follow-up: the Chrome `--breakup` check passed again; inspected the falling-debris capture for broader scattering. Anatomical fragmentation, pause and resource cleanup checks remain passing.

Fourth gunner zoom: all six focused gunner simulation tests and Chrome `--gunner` passed, covering reduced yaw/pitch sensitivity at all four levels and O cycling through the 8× label back to 1×.

Film effects/audio: `node tests/recognizer-audio.mjs` passed in headless Chrome on macOS: stereo WAV decoding, 1.88-second loop / one-second explosion, audible rendered output, left/right positional energy and one-shot source cleanup. The first attempt was interrupted by a development-server reload; the rerun passed. Direct listening remains for user review. `npm run test:browser -- --breakup` passed after adding optical effects and staged section release, including single-section fragmentation, pause and geometry cleanup. Inspected `recognizer-breakup-early.png` against extracted film frames: double yellow rings and sparks render around the separating sections in gunner view.

Muzzle/audio correction: `node tests/muzzle-flash.mjs` passed in Chrome: chase/gunner rendering, paused timing, actual firing and expiry, without console errors. Inspected both muzzle captures against the supplied still and extracted 1:51 frames. `node tests/recognizer-audio.mjs` passed for the final M4A-derived samples: 0.85-second stereo explosion, audible offline rendering, positional balance and cleanup. Direct auditory confirmation remains with the user. PCM comparison verified the M4A/video alignment exactly after 2112 audio frames.

Gunner flash correction: `node tests/muzzle-flash.mjs` passed in Chrome with hidden gunner flash, visible external flash, pause freezing and expiry. Cleanup candidates were generated with finite, unclipped stereo PCM and matching durations; waveform alignment was verified against the full scene. Audio quality/source isolation needs user listening review.

Sound library: `node tests/sound-library.mjs` passed in headless Chrome on macOS. Checks cover unique catalog IDs, existence of local media/catalogs, downloaded-preview SHA-256 hashes, documentation card navigation, 17 rendered players, all four downloaded previews loading valid durations, and successful playback. Inspected the library screenshot. Listening/film-match judgments remain for audition; commercial catalogs contain metadata only.

Recognizer armor audio: all 56 simulation tests pass, including target/fatality event tagging. The extended `node tests/recognizer-audio.mjs` check passed for audible spatial impact output, source cleanup and suppression on fatal hits. The audio harness disables Vite HMR to prevent dependency-optimization reloads interrupting offline rendering. Subjective sound review remains available through the audition page.

## Production subdirectory deployment — September 14

`npm run build` and `node tests/production-path.mjs` passed against a static production build mounted at `/fun/TRON/`: game starts, all three vehicle models and game audio load, and the sound study plays without HTTP or JavaScript errors. Vite uses a relative base and runtime audio resolves below the game path. The website workflow builds the pinned private submodule with a read-only deploy key and publishes its dist output.

## Tank speed and impact feedback — September 14

All 57 simulation tests passed, including enemy pursuit reaching normal Clu speed without inheriting turbo and escorts keeping pace with the carrier. `node tests/impact-shake.mjs` passed in Chrome: impact changes the rendered view, freezes on pause, leaves turret aim unchanged, and respects reduced motion. Collision feedback preserves a previous stronger hit, ignores low-speed wall pressure, and decays over approximately 0.4 seconds. Production build passed.

## Forward-and-level turret return — September 14

All 59 simulation tests and the gunner browser suite passed. F centers yaw and levels elevation, using the same movement rates and gunner acceleration as manual controls at all four zoom levels. Tests cover exact final alignment, short-path centering, turning hulls and manual override. Production build passed.

## Cannon shot reserve — September 14

All 63 simulation tests and `node tests/cannon-reserve.mjs` passed. Coverage includes one-per-second recharge capped at three, four rapid shots from a full bank, normal cooldown after exhaustion, held-fire behavior, refill after resting, pause, reset and destruction. Real Space presses consumed reserves in Chrome; pausing prevented recharge. Production build passed.

### Cannon reserve timing update

Reserve recharge now requires ten uninterrupted seconds without firing and restores all three extras at once. Simulation tests cover the exact boundary, no partial refill, partially spent reserves, timer restart on firing, and destruction. All 63 simulation tests passed; production build passed.

## Patrol mix and spotlight confirmation — September 15

All 67 simulation tests passed: roster, ground patrol movement/clearance, delayed spotlight confirmation and radio, bounded angular motion, beam range and wall occlusion, failed acquisition, hidden-target behavior, tracking and fade. `node tests/spotlight-acquisition.mjs` passed in Chrome on the default blueprint: three aircraft/audio voices and eleven ground tank models, three moving maze patrols, acquisition before pursuit, visible tracking, paused beam state, fade and continued pursuit. Reviewed `test-results/spotlight-lock.png` showing the beam on Clu. Corrected a blueprint spawn that passed hull clearance but failed swept route clearance. Production build passed.

### Spotlight reach and scanning fix — September 15

All 69 simulation tests passed. Added a 500 m target case verifying elevation above the scanning pitch, actual rendered beam reach and successful confirmation, plus bounded scanning after abrupt goal changes. Chrome acquisition/tracking/fade check passed at 500 m and the rendered capture was reviewed with the beam on Clu. Scanning still uses 260 m; target acquisition uses the sensor range so an observer cannot freeze forever trying to illuminate a visible tank beyond the old beam limit. Production build passed.

## Aerial transition and close patrol encounter — September 16

All 71 simulation tests passed. Chrome checks `tests/aerial-transition.mjs`, `tests/aerial-zoom.mjs`, and `tests/maze-tank-awareness.mjs` passed against an isolated local Vite server: smooth V transitions both directions, turret-aligned aerial view, wheel zoom including pause, and an actual blueprint patrol detecting Clu behind it and landing a shot. Unit tests cover close rear detection and reaction to a nonfatal shot from beyond near-awareness range. Production build passed.

## Patrol routing and radio response — September 16

Reproduced a blueprint patrol stopping permanently near (138, -252) after its steering entered the pathfinding clearance margin. All 73 tests now pass, including a two-minute blueprint patrol run checking movement every 20 seconds and clearance every step. A radio-only test verifies a Recognizer can send an occluded target report to a nearby ground patrol, trigger a route around the wall and move the tank without granting direct sight or fire permission. The close-range blueprint encounter also passed in Chrome after the navigation change. Production build passed.

## Turret stabilization motor limit — September 16

All 77 simulation tests passed. Coverage includes all Clu views and zoom, manual aim plus hull compensation within a single relative-to-hull motor speed budget, recovery after saturation, idle enemy turret world-heading hold, and abrupt externally imposed yaw changes including angle wrap and zero dt. The gunner Chrome suite passed for aiming, stabilization, zoom, F centering, firing, pause and exit. World-space motion caused by the hull itself is distinct from the turret motor: if the hull outruns compensation, aim drifts instead of exceeding motor speed. Production build passed.

### Mouse gunner verification — September 16

`npm test`: 81 passing. Includes target convergence and rate limits at all zoom levels, forward lock/manual release, minimum elevation, nearest visible surface raycast, occlusion, hidden-object exclusion and empty-sky fallback. Chrome headless on isolated port 5174: revised `tests/mouse-aim.mjs` verifies pointer capture, independent view/gun lag and convergence, firing, forward lock, mouse unlock and pause/view lifecycle. `tests/gunner.mjs` covers keyboard controls. Mouse feel remains for human playtesting.

### Visibility, turbo and spotlight checks — September 16

82 simulation tests pass, including sustained distant spotlight tracking, close-range fading and lost-observation behavior. Chrome checks on isolated Vite port 5174 passed: mouse aiming with the complete sight, `tank-visibility.mjs` material isolation plus live turbo pulse/return to normal, and `spotlight-acquisition.mjs` sustained tracking, pause and close-range fade. Reviewed low-angle enemy and turbo-trim renders under representative lighting; in-game brightness remains subject to user review.

### Smooth mouse tracking — September 16

83 simulation tests pass. Added measured angular velocity/acceleration checks at all four zoom levels with sudden target changes and reversals on a stationary hull, including arrival at the target. Chrome `tests/mouse-aim.mjs` passed with interpolated full-sight rendering, target convergence, firing, F lock and pointer lifecycle. Human smoothness assessment remains necessary; numerical limits alone do not establish feel.

Death music fade: Chrome `tests/death-terminal.mjs` verifies decreasing music gain while playback continues, zero gain and paused playback at the terminal, and normal gain restored on restart. Audio gain was measured; no subjective listening claim.

End-screen track: Chrome death-terminal check passed for continued gameplay fade, Only Solutions playback/time advancement on the terminal, and restoration of We've Got Company on restart.

Opening clip update: Chrome death-terminal check verifies restart selects “1 recognized 1.mp3” with looping disabled; terminal playback remains Only Solutions.

Recognition music: 83 simulation tests pass, including no cue before spotlight confirmation and one cue through continued tracking. Chrome `tests/recognition-music.mjs` passed: an actual new sighting selects a different recognition clip and starts playback after the one-shot opener.

### Action music selection and fades — September 16

86 unit/simulation tests pass. Filename-category tests cover additions, case matching, missing categories, repeat avoidance, pursuit state and close-range hysteresis. Browser `recognition-music.mjs` passed opening recognition → pursued → proximity-triggered gotcha, including measured fade-out before the source changes and fade-in afterward. Updated death-terminal regression passed end music and fresh-run restoration. Glob discovery is build-time for the static production site; future local files require publishing a new build to appear there.

Quiet music transition: 86 unit/simulation tests pass. Chrome recognition-music check verifies a 3-second fade after all pursuers are removed, audible gain and continuing playback after 1 second, then zero gain and paused playback with no unwanted restart. Build passed.

Gunner transitions: Chrome `tests/gunner-transition.mjs` passed entry/exit position and FOV interpolation, measured intermediate quaternion rotation, sight fading, mid-transition reversal and reduced-motion bypass. Existing `tests/gunner.mjs` controls regression also passed.

End cursor: Chrome death-terminal check verifies visible cursor and `terminal-blink` animation on the end screen, alongside music and restart behavior.

Gunner exit correction: Chrome transition check samples height and quaternion-derived pitch through exit and verifies no reversals beyond 0.01 total excess travel in the stationary fixture. Entry, exit, rapid reversal and reduced-motion checks pass. Aerial transition regression also passed.

## September 16 — carrier escorts, patrol variation and engine loop

- `npm test`: 88 tests passed, including carrier air escort following/return after stale contact, seed reproduction, varying patrol positions, and two-minute blueprint patrol traversal.
- `TRON_URL=http://127.0.0.1:5174 node tests/spotlight-acquisition.mjs`: Chrome passed; five Recognizers and five enemy tanks render, all three maze ground patrols move, aircraft audio sources exist, and spotlight acquisition/tracking/fade works without page errors.
- Engine-loop inspection found a louder boundary region (40 ms mono RMS approximately 0.21–0.24 versus 0.12–0.18 in the interior). A dedicated rebuild takes the steadier interior, gently levels its shared stereo envelope and crossfades the boundary. New stereo WAV is 0.28 seconds, RMS 0.160, peak 0.613. Subjective listening approval remains with the user; no claim of an auditory check.

### Engine transient correction

User listening found the shorter 0.28-second version repeated the clink faster. That version is superseded. The replacement averages the original engine sample’s frequency spectrum and reconstructs a 5.944-second periodic signal with randomized phases, discarding source impact timing rather than repeating a trimmed waveform. RMS is 0.140, peak 0.657; the wraparound sample step is 0.00435 versus maximum ordinary step 0.02104. This is a spectrum-derived sound, not an isolated film stem; listening approval remains outstanding.

### Tank destruction sound

`node tests/tank-explosion.mjs` passed: three synthesis variants at 44.1/48 kHz remain finite and below 0.841 peak, fade to silence, and contain stereo differences. Chrome OfflineAudioContext renders the actual Sound.effect path for both tank subjects; near RMS approximately 0.115 versus 0.030 at 180 m, and all sources release after playback. `npm run build` passed with the existing chunk-size advisory. Subjective listening/film fidelity remains for user review. `scripts/generate-tank-explosion.mjs` builds the library audition from the gameplay synthesis.

## September 17 — gunner zoom

`node tests/gunner-zoom.mjs` passed in Chrome: intermediate FOVs for all four zoom changes including wrap, exact final FOVs, enlarged top-center label bounds, and immediate reduced-motion changes. Screenshot `test-results/gunner-zoom.png` reviewed. `node tests/gunner-transition.mjs` passed for entry/exit, reversals and reduced motion. Production build passed with the existing chunk-size advisory.

The gunner zoom browser check additionally passed wheel zoom through every level in both directions, including clamping at 1×/8×. Wheel zoom uses the same eased field-of-view transition.

### Mouse gunner stability

A stationary-tank mouse test reproduced camera translation during turret catch-up before the fix. `tests/mouse-aim.mjs` now verifies fixed camera position and stable mouse-view orientation throughout catch-up, along with convergence, firing, F lock and pointer-lock lifecycle; Chrome passed after anchoring the camera at the turret pivot. All 88 simulation tests passed, including mouse motor limits.

### Turret servo audio

`node tests/turret-servo.mjs` passed: yaw/elevation motion drives sound, render-only frames retain the last motor measurement, hull-only rotation does not trigger it, and stop/pause/destruction/reset silence the tone. Chrome offline rendering measured moving RMS 0.0182 and silent conditions at zero. Build passed with the existing chunk advisory. The user confirmed playback; subsequent tuning lowers gain from 0.065 to 0.032 and pitch from 95–195 Hz to 55–110 Hz.

### Hull health and regeneration

All 89 simulation tests passed, including five-minute recharge rate/cap, reset to full, and no regeneration after destruction. `node tests/health-meter.mjs` passed in Chrome: fractional health matches elapsed simulation time, pause freezes it, HUD visibility in gunner view, and a fatal projectile leaves zero health. Production build passed with the existing chunk-size advisory. Health HUD screenshot: `test-results/health-meter.png`.

### Compact status bars

Chrome `tests/health-meter.mjs` passed the readiness checkmark, removal of visible health percentage, normal/orange/red/critical thresholds and critical pulse/reduced-motion override, alongside recharge/pause/death checks. Build passed with the existing chunk advisory.

### Enemy hit-part tracking

`npm test`: all 90 tests passed. Projectile integration tests cover every Recognizer zone at two yaw angles in open/folded poses, all four tank zones at two yaw angles, event identifiers, last-hit coordinates/time, per-part counts and fatal-event classification. No rendered geometry precision is claimed; tank armor subdivisions are approximate within existing collision volumes.

### Critical hits and component damage

All 92 simulation tests passed: one-shot crown kills, half-damage limb hits, repeated-leg stomp disable, aborting a committed drop, track mobility loss, and an immobilized tank retaining firing ability. The wall-only movement fixture now excludes randomized enemies so it tests wall geometry independently. The long-range projectile fixture now expects its crown hit to be fatal. Chrome `tests/part-damage.mjs` passed live crown/leg damage checks with no rendering errors; the browser also measured imported turret bounds used for classification. Build passed with the existing chunk-size advisory.

### Enemy firing cadence and spread

All 94 simulation tests passed. New checks cover varied/reproducible shot spread, horizontal/vertical angular bounds, unchanged projectile speed, 3.4–4.2-second cooldown samples, and actual shot spacing during a 20-second simulated encounter. The ground encounter fixture now supplies an explicit seed. Build passed with the existing chunk-size advisory.

## Edge smoothing and gunner targeting — September 17

- `npm test`: 96 tests passed, including moving-target interception, misses, destroyed targets, airborne critical regions, range and wall blocking.
- `node tests/antialiasing.mjs`: isolated headless Chrome passed pixel-density, 4-sample MSAA, SMAA, resize and render-scale checks without browser errors.
- `node tests/gunner-targeting.mjs`: isolated headless Chrome passed outline visibility, hit/miss cue changes, Recognizer crown critical indication and cleanup on leaving gunner mode. The airborne fixture is paused to prevent autonomous altitude changes from moving its crown away from the test ray.
- Inspected the exterior anti-aliasing capture and gunner tank-outline capture. The tank silhouette is readable with a thin cyan edge; predicted-hit feedback moves with the complete crosshair.

These checks do not measure frame rate across hardware or guarantee hits against accelerating targets. Supersampling and the outline pass add GPU work.

## Compact gunner feedback — September 17

Replaced targeting text and whole-crosshair color changes with a 220 ms transition of the central hash mark to half size and yellow glow. Misses restore its size and green color. Reduced-motion preferences disable the transition. The existing gunner browser check passes for tank and Recognizer hits, restoration on misses and exiting gunner mode; inspected the resulting screenshot to confirm the center stays aligned and the surrounding crosshairs stay green.

## Intact Recognizer explosions — September 17

`node tests/breakup.mjs` passes in isolated headless Chrome: exactly six distinct intact sections, randomized motion between explosions, falling, pause freezing and geometry cleanup after expiry. The resource comparison warms up a complete explosion before measuring the next cycle, avoiding unrelated lazy scene allocations. Inspected the early explosion capture with the camera transition settled: original block silhouettes remain recognizable around the flash/rings.

## Recognizer component correction — September 17

The six positional regions still crossed authored blocks. The loader now tags connected geometry across both source materials before rigging; explosions preserve those tags. `node tests/breakup.mjs` passes with 15 unique, unfragmented blocks, repeated random motion, falling, pause behavior and resource cleanup. The early rendered capture was inspected. `node tests/gunner-targeting.mjs` also passes after adding the synchronized 90-degree center-mark rotation.

## Four maze sites, collection and dynamic patrols — September 17

- `npm test`: 100 tests passed. Added transformed geometry/occlusion, per-site patrol ownership, beam clearance, swept one-shot collection/reset and exploration-memory tests. The blueprint patrol regression simulates all twelve ground patrols for two minutes; it measures distance traveled so intentional loops are not mistaken for stalls.
- `node tests/data-beams.mjs`: isolated headless Chrome passes all four beam sites, collection, independent fades, reset and error checks. Inspected the near beam, distant maze and shutdown-ring captures. A negative-angle shader interpolation error found during testing was fixed.
- `node tests/breakup.mjs`: passes after increasing blast impulse, preserving all 15 connected blocks, randomized motion, falling, pause and resource cleanup.
- The new hit samples are original synthesized sounds. Subjective impact quality and intermittent shadow stability still benefit from normal play on the user's display; automated checks cannot establish those.

`node tests/armor-hit.mjs` passes: bounded finite stereo samples at 44.1/48 kHz, separate tank/Recognizer durations, successful offline playback for all three hit subjects, distance attenuation and source cleanup. The offline audio check runs without the game renderer to avoid contention. `npm run build` passes with the existing large-bundle warning.

## Carrier searchlights — September 17

`npm test`: 103/103 passing, including smooth acquisition before radio, both enemy types receiving reports within half a maze width radius, outside-range exclusion, occlusion, destruction and initial detection footprint. `node tests/carrier-search.mjs`: passed in isolated headless Chrome at 1280×800 against Vite on port 5174; both beams render and acquire CLU, disappear after destruction, and produce no browser errors. Captured and inspected `test-results/carrier-search.png`. Subjective brightness and tracking feel remain available for in-game review.

## Stationary data transfer and carrier drone — September 17

Inspected a nine-frame contact sheet from 52.8–54.6 seconds of the supplied `Sark and MCP.mp4`. Added a sequential vertical light curtain around CLU with build/hold/reverse timing. `npm test`: 103/103 passed, including stationary acquisition, interruption by motion/death, delayed one-time collection and reset. `node tests/data-beams.mjs`: all four sites transferred and faded independently, then reset without browser errors; inspected `test-results/data-transfer.png` and reduced excessive glow.

`node scripts/generate-carrier-drone.mjs`: generated a 16-second stereo loop, peak 0.65, quarter-second RMS max/min ratio 1.007 and loop seam 0.00073. Chrome confirmed `carrier-drone` decoded, old `carrier-rumble` was not loaded, and no sample errors occurred. This verifies loading and numerical continuity, not subjective listening approval. Original rumble file remains untouched. `npm run build` passed.

## Carrier shuttle studio — September 17

Inspected all four supplied stills and contact sheets covering the 2:34–2:57 escape sequence. Rendered reference, side, top, rear and underside views; adjusted the channel width, flared ends, reference camera and lighting after inspecting captures. `node tests/shuttle-preview.mjs` passed in isolated headless Chrome: 552 triangles, 88,756-byte binary GLB, successful Three.js reimport, bounds approximately 14.22 × 9.17 × 20.19 m including trim, no browser errors. Geometry is an approximate reconstruction; scale and hidden structure remain inferred. The closing terminal now appends `END OF LINE` on its own line.

Shuttle revision after user comparison: replaced the solid pontoons with thin trays, standing end blades and a single side wall. Added an enlarged detachment crop to the studio and a corresponding camera preset. Model proportions are now provisionally 20 m wide × 14 m long × 9 m tall; final fidelity still requires reference review.

Final revised export check: `node tests/shuttle-preview.mjs` passed with six rendered views, 436 triangles, 65,884-byte GLB, reimported bounds 20 × 9 × 14 m, and no browser errors. Inspected the detachment capture with the film crop alongside it.

## Maze music, shadows and closing tribute — September 17

`npm test`: 106/106 passed. Replaced a flaky patrol test's final net-displacement check with accumulated travel over ten samples: returning near a starting point does not mean the unit failed to move. `tests/exploration-music.mjs` verified exploration plays once and resets with a new run. `tests/maze-music.mjs` verified all four cues using actual browser media playback, preservation of the entry cue after collection, combat interruption and quiet fade. No music errors occurred.

`tests/shadow-stability.mjs` renders the actual projected tank shadow at 24 moving positions near world coordinates (7000, -6000), at camera heights 3/12/150 m. Dark footprint pixel ranges were 4454–4457, 12953–12960 and 758–759 respectively; no large missing patches appeared. This is a targeted regression check, not a guarantee that every intermittent visual artifact is resolved. `tests/death-terminal.mjs` passed with END OF LINE, the bottom tribute visible only on the closing screen, music fade, cursor and unchanged Return-to-restart behavior. Inspected the closing-screen capture. C rear-camera code and both visible/hidden control hints were removed.

Closing tribute follow-up: `tests/death-terminal.mjs` passed with incremental typing, final credit/END OF LINE ordering, cursor at the tribute and clean restart. Inspected the completed screen capture.

### Transfer and human typing revision — September 17

- Full simulation suite: 107 tests passed; the subsequently added carrier-wave boundary test also passed with all six maze-site tests. Checks cover drive lock with working turret, gradual healing, one-time collection, cancellation on death, spherical ground/air contact timing, single carrier damage and out-of-range survival.
- `node tests/data-beams.mjs`: isolated headless Chrome passed all four transfers, persistent blue columns and clean reset, with no browser errors. Inspected surround and completion captures.
- `TRON_URL=http://127.0.0.1:5174 node tests/death-terminal.mjs`: isolated headless Chrome passed incremental human-paced tribute typing, final cursor, music and restart.
- `npm run build` and `git diff --check` passed. Actual timing/music feel remains subject to play review. Carrier receives damage and a visual response; no carrier destruction animation yet.

Transfer surround follow-up: shafts extend into the sky and appear individually at full height. Film-derived ring audio extracted from Sark and MCP at 52.75–54.25 seconds; mild noise filtering, pitch-preserving stretch, soft fades, reversed variant for opening at second nine. Six maze-site simulation checks passed. Clean isolation and sound fidelity require listening review.

September 18: `node tests/models.mjs` passed in isolated headless Chrome. Inspected normal and fully folded Recognizer ground-shadow captures; verified three rig-following shadow meshes are excluded from debris. Imported dimensions and muzzle alignment remain unchanged.

### Wall/debris shadows, shuttle orientation and outro return — September 18

- `node tests/recognizer-shadows.mjs`: isolated Chrome detected 5,758 roof and 13,308 wall pixels darkened by the Recognizer, plus 4,912 roof and 10,743 wall pixels darkened by a debris piece. Full game started with the maze, seam and floor shader hooks and no browser/shader errors.
- `node tests/shuttle-preview.mjs`: six camera presets rendered without errors; corrected underside-facing GLB exported and reimported at 20 × 9 × 14 m. Detachment capture inspected; geometry fidelity remains provisional.
- `TRON_URL=http://127.0.0.1:5174 node tests/death-terminal.mjs`: final-five-second red sign-off, non-looping music, gradual black fade, return to opening and subsequent restart passed.
- Production build and whitespace checks passed. Shadow maps use 256-pixel tiles; fine-detail aliasing and performance with many simultaneous explosions still need play review.

September 18 follow-up checks: full simulation suite passed 109 tests before the new ring-contact test; all seven maze-site tests then passed including that test. Gunner browser test passed the 2× minimum, keyboard cycling, disabled mouse firing/aiming/wheel input and five-pursuer roster. Recognizer shadow test passed at 1.5× pixel ratio using actual explosion blocks. Captured and inspected actual in-game debris shadows at 1.25× and the maze entrance's crisp ground silhouette. Production build passed. Static shadows received by walls/roofs still have finite map resolution.

September 18 shadow follow-up: isolated Chrome at 1.5 device pixel ratio verifies the actual carrier casts onto raised surfaces and the ground (`node tests/carrier-shadows.mjs`). `node tests/maze-shadow-receivers.mjs` still detects 40,393 shadowed tank pixels after slope bias. A running-game maze entrance capture shows continuous wall bevel shading and crisp floor shadows, with no shader errors. These captures cover the tested angles, not every wall/camera combination.

Closing tribute now presents replacement sentence cards, with the final MADE TOGETHER line retained under the detached-program message until the outro finishes. The browser lifecycle check exercises sentence replacement, persistence past the previous fade deadline, MCP dialog playback at the first sign-off character, red text/cursor, and reset after the final fade. Screenshot checks cover PNG content/dimensions, picker save, cancellation, HUD restoration, paused-state preservation, and normal-download fallback.

Grid clouds: `node tests/cloud-layer.mjs` loads the exported model, renders the instanced layer, verifies 1,080-meter altitude, 6 m/s drift, deterministic pause/reset transforms, changed lanes after a full crossing, and disabled shadow flags. It then boots the full game and checks for JavaScript/shader errors. The standalone sky capture was visually inspected. The layer is single-pass and instance GPU buffers are disposed with the view.

`node tests/terminal-raster.mjs` passes in isolated Chrome: the custom font loads, no terminal scanline pseudo-overlay remains, and rendered captures contain both bright and dim blue/red glyph layers at 28, 56, and 80 pixels. The capture was visually inspected. Font generation also verifies its COLRv0 table and both palettes; Safari rendering has not been separately tested.

Beam/carrier follow-up: all nine maze-site tests pass, including off-center CLU entry with beam-centered ring damage. `tests/beam-base.mjs` measures identical red-pool coverage over 24 small world-coordinate translations at each of three camera heights (3, 12, 150 m); a covering solid box completely occludes the pool. `tests/carrier-shadows.mjs` detects both floor/wall shadows and visible grid pixels inside the carrier shadow.

`node tests/horizon.mjs` passes: the forward horizon is brighter than the upper sky and rearward horizon, translating the camera 6 km leaves the gradient unchanged, and full-game startup produces no JavaScript/shader errors. The in-game capture was visually reviewed for the blue/violet directional horizon and foreground occlusion.

## Debris collision volumes — September 18

- `npm test`: 120 checks pass, including five new checks for tilted block floor clearance/sleep, fast thin-wall impact, roof landing, above-wall clearance and diagonal deflection.
- `node tests/debris-collision.mjs`: isolated headless Chrome, four Recognizer explosions plus a tank explosion (68 pieces in this randomized run). Lowest transformed mesh vertex stayed above the floor; 18 pieces were sleeping by 4.5 seconds. Physics-only update averaged 0.14 ms, p95 0.20 ms over 270 frames. This excludes rendering and is not a mobile performance claim. Rendered debris capture inspected; cleanup leaves zero bursts.
- `node tests/breakup.mjs`: actual game retains 15 intact Recognizer blocks per explosion, randomized motion, pause freeze and geometry disposal after expiry.
- Collision shapes are coarse oriented boxes, not triangle-mesh rigid bodies; no debris/debris or debris/vehicle contacts. Concave maze walls use their shared convex triangle prisms. Settled blocks retain their final orientation rather than computing a full torque/friction rigid-body solution.
- `TRON_URL=http://127.0.0.1:5174 node tests/death-terminal.mjs`: revised two-paragraph credits pass the end-screen lifecycle check, including keeping the collaboration paragraph visible, red signoff/audio and return to opening.

## Rapier debris migration — September 18

Supersedes the custom collision solver described above. Seven physics checks cover airborne angular momentum, off-center collision torque, tipping/settling, thin-wall CCD, roof support, above-wall clearance, collision filtering and rigid-body removal. The actual-game breakup browser check passes (15 intact blocks, pause and cleanup).

`node tests/debris-collision.mjs`: isolated headless Chrome, five simultaneous explosions / 73 pieces in the measured randomized run. Physics updates averaged 0.53 ms, p95 0.80 ms over 270 frames; six pieces sleeping at 4.5 seconds. Both burst count and Rapier body count return to zero on clear. Rendered capture inspected. Measurements exclude rendering, and do not establish mobile performance. Rapier contact compliance and interpolated rotations can briefly place a corner below the ground; a render-only floor correction prevents visible clipping without modifying physical velocity or spin.

## Debris damage / wall readability — September 18

- `npm test`: 125 checks pass. Additional damage coverage verifies the energy threshold, proportional damage, CLU/enemy/carrier health, fatal hit events, no duplicate kills and removal of destroyed vehicles from collision targets. Rapier checks cover actual vehicle contacts, low-energy bumps, equal-velocity impacts, faster impacts and fragment mass scaling; one collision produces one damage report.
- `node tests/breakup.mjs`: passes the actual game lifecycle after moving debris updates into the fixed gameplay loop.
- `node tests/maze-shadow-receivers.mjs`: passes; 29,928 tank pixels receive maze shadows and 23,877 pixels show the vehicle silhouette over the maze shadow in the fixture. Explicit draw-order check passes.
- `node tests/wall-shadow-acne.mjs`: passes after brightening wall faces and reducing shadow darkness (6,218 changed wall/bevel pixels under the 10,000 threshold). Brighter wall capture inspected.
- Vehicle collision shapes and fragment density are approximations for damage tuning, not measured film mass/geometry. Carrier contacts use its existing coarse hull bounds. Damage uses normal closing speed, not tangential scrape speed. Debris does not push the independently controlled vehicle bodies or collide with other debris.

## Inherited debris velocity — September 18

`node --test tests/debris-inheritance.test.js tests/debris-physics.test.js`: ten checks pass. Matched explosions verify that every piece receives the exact vehicle velocity difference, including vertical motion and world-Z conversion, and that Rapier receives that velocity. Delayed pieces move with the destroyed vehicle before activation rather than hanging motionless.

## Receiver-plane shadow correction — September 18

- `node tests/shadow-receiver-plane.mjs`: 30 triangulated wall poses at varied oblique angles and 0/7,000-meter offsets; zero self-shadowed pixels compared with shadows disabled.
- `node tests/debris-shadow-fade.mjs`: duplicate overlapping projected shadows produce exactly the same pixels as a single shadow; the interior has one uniform color during fading, without stochastic speckles.
- `node tests/recognizer-shadows.mjs`: hard shadows remain visible on roof/wall receivers from both intact aircraft and debris (5,660 / 13,063 intact pixels; 9,354 / 9,081 debris pixels in this randomized fixture).
- Isolated headless Chrome coverage; the user's Safari screenshot angle is not reproduced exactly, so these checks do not establish artifact-free shadows at every viewpoint.
- Final close-up check after limiting maze casters to solid wall faces/roofs and adding a conservative texel-footprint bias: 384 changed wall/bevel pixels; tightened regression threshold from 10,000 to 1,000. The ledge close-up no longer shows the alternating triangle patches on inspection.

## Screenshot shortcut compatibility — September 18

`node tests/screenshot.mjs` passes with B for capture/download and F9 for cancellation, checking the save-picker path, fallback download, pause preservation, nonblank PNG (1250 × 875), HUD restoration and status feedback. macOS may intercept F9 for a system action; B avoids that conflict. Tested in isolated Chrome; Safari itself was not automated. The final Recognizer shadow fixture and full-game startup check also pass; an earlier run interrupted during development reloads was rerun after edits stopped.

## Roof-edge slab identities — September 18

Launch retry: desktop Chrome 153.0.8010.48 aborts in macOS `_RegisterApplication`. Playwright headless shell 153.0.8010.12 also fails before page creation, explicitly reporting `bootstrap_check_in … Permission denied (1100)`. No rendering assertions ran. Vite starts successfully on 5173. The test now uses that port by default, with a `TRON_URL` override for other servers.

Production build passes. Node geometry checks validate all 1,208 authored-layout slab identities, matching caster position/identity counts, constant identity across each triangle, and generation of the packed depth/identity shader. Added a 30-pose closed-box roof-edge browser regression with slab ID 1208. Browser validation is **not completed**: Chrome launch aborted under current execution permissions. Earlier flat-plane checks do not cover this new roof-edge correction. The local Vite server was restarted on port 5173 and returned HTTP 200.


## Grid-preserving maze shadows — September 19

On the development Mac (Mac14,6, macOS 26.6.2), isolated headless Google Chrome now launches with approved execution outside the workspace sandbox.

- `node tests/maze-grid-shadows.mjs`: passes; 100,481 floor pixels darken and 11,337 grid pixels remain visible inside shadow. Captures of the regression fixture and actual blueprint wall/floor materials were inspected. No JavaScript or shader errors. Actual maze capture shows finite-resolution stepping on close floor-shadow edges; this replaces the old exact but opaque silhouette.
- `node tests/maze-shadow-receivers.mjs`: passes; 30,015 tank pixels receive maze shadows, 23,877 pixels retain the tank's own ground silhouette, and floor-before-vehicle ordering passes.
- `npm run build`: passes, with the existing large-bundle warning.
- Previous resumed run: `node tests/roof-edge-shadows.mjs` passed all 30 poses with zero self-shadowed pixels after browser-launch approval. The earlier permission blocker is resolved.

The production floor intentionally suppresses the grid within maze-site bounds independently of shadows; this change preserves grid lines wherever the original floor material draws them. Actual Safari verification remains unrun.


## Throttle-controlled turbo and exact floor-shadow edges — September 19

- `npm test`: all 128 checks pass. Turbo regression covers stopped activation, no impulse while moving, 2.5× forward/reverse acceleration, coasting to rest without restarting, unchanged braking, timer/cooldown, and expiry easing.
- `npm run test:browser -- --turbo-hints`: headless Chrome passes actual T/W input, stopped activation, accelerated driving, pause, expiry, cooldown, and existing hint behavior.
- `node tests/maze-grid-shadows.mjs`: 100,805 floor pixels darken and 11,357 grid pixels remain visible; duplicating the entire projected shadow produces zero changed pixels. Inspected blueprint-material and full-game captures: the coarse stair-step boundary is gone. Full game/composer starts and renders without JavaScript or shader errors.
- `node tests/maze-shadow-receivers.mjs`: 30,015 shadowed tank pixels and 23,877 tank ground-shadow pixels; ordering check passes.

Exact projected geometry now replaces the floor shadow map described above. Stencil attachments preserve uniform attenuation over overlapping triangles and slabs; normal frame clearing resets coverage. These checks use Chrome on the development Mac; Safari remains untested.


## Recognizer momentum and filtered wall edges — September 19

- `npm test`: 132 checks pass, including bounded yaw/lift acceleration, delayed reversals, settled heading/altitude, momentum through acquisition/folding/aborted drops, and 60/120 Hz agreement. Existing pursuit, crush/recovery, hidden-player independence and separation checks pass.
- `node tests/recognizer-momentum.mjs`: Chrome confirms rotational carry-through followed by reversal, bounded yaw/lift velocity changes, pause freeze and reset. Controlled scene captures provide a reproducible motion comparison. The development turning-acceleration control and reset are also exercised.
- `node tests/wall-shadow-edges.mjs`: matched close-up diagonal shadows compare the old 1024 nearest map with the 2048 filtered map. The original has zero intermediate edge pixels; the filtered result has 15,673 while retaining substantial fully lit and shadowed regions. Both captures inspected; the large binary teeth become a softer, finer transition. Finite-resolution edge variation remains possible, especially at grazing angles.
- `node tests/roof-edge-shadows.mjs`: filtered sampling retains zero self-shadowed pixels in all 30 closed-box poses, including distant coordinates and slab ID 1208.
- `node tests/maze-grid-shadows.mjs`: floor grid visibility and duplicate-shadow uniformity pass, including full-game startup with the larger cached atlas.

Browser evidence uses isolated headless Chrome on the development Mac. This does not substitute for the user's Safari view or final human approval of motion feel. Static shadow-map color/depth storage increases approximately fourfold; maps still render only once per scene.

## Exact wall shadows and manual refresh — September 19

### Two-pass materialization and recurring reinforcements — September 20

- `npm test`: all 137 simulation checks pass. Added coverage for a shared ten-second timer with three pursuers, repeated single spawns, loss-of-pursuit reset, Clu destruction, fresh-run reset, copied observations, hidden-player independence, inert/intangible materialization and ordered wire/solid phases. Updated the persistence test to track the original aircraft while allowing the newly requested reinforcements.
- `node tests/materialization.mjs`: native headless Chrome on the development Mac passes. Rendered captures show a transparent red edge model after pass one, partial solid fill during pass two, and the original solid model afterward. Wire-only capture has zero blue solid pixels; completed capture has 40,469. Inspected standalone phase captures and the full-game glowing rectangle capture in `test-results/materialization-*.png`.
- The browser check also triggers two consecutive reinforcements through the live simulation, verifies audio pool growth, freezes simulation/rez time on pause, renders fifteen aircraft with bounded wall-shadow atlas slots, and resets to the initial simulation roster without browser/shader errors. Visual/audio pools are reused after reset rather than appended again.
- `node tests/recognizer-shadows.mjs`: 5,660 roof / 13,063 wall shadow pixels, with debris receiving coverage retained. The test now uses port 5173 by default and accepts `TRON_URL`; the first attempt used its old hardcoded port 5174 and failed to import the current modules.
- `node tests/recognizer-audio.mjs`: sample playback, explosion/impact lifecycle and stereo energy checks pass. `npm run build` passes.

Follow-up: each pass now opens from a horizontal line over 0.6 seconds, with 6 m of world-space clearance at both ends of its sweep. The materialization animation now lasts 5.45 simulation seconds. All 137 simulation tests and `node tests/materialization.mjs` pass again, including the new opening-phase assertions. Inspected the initial line and half-expanded rectangle captures; both contain no solid vehicle pixels. Reinforcements are unbounded while pursuit continues, so long-session crowd/performance tuning and Safari-specific visual review remain separate from these checks. Distant aircraft beyond the nearest twelve still cast projected ground shadows but omit dynamic wall-shadow atlas tiles.

### Moving-target interception — September 20

`npm test` passes all 132 checks after adding rear-approach cases to the autonomous cruise interception regression. On the clear grid with seed 1982 and Clu driving at 22 m/s, aircraft starting 60, 160 and 300 m behind successfully crush Clu after approximately 11.1, 19.4 and 30.8 seconds. Existing committed-miss, stationary-target, momentum and hidden-player independence checks pass. Previously, rear approaches settled into speed matching about 40 m ahead without attacking.

`node tests/recognizer-intercept.mjs` passes in native headless Chrome on the development Mac: a Recognizer beginning 60 m behind overtakes, folds about 39.4 m ahead, and its braking drift carries the committed strike onto steadily moving Clu. Inspected rendered fold/impact captures in `test-results/recognizer-intercept-*.png`; no browser or shader errors. This establishes the controlled straight-line encounter, not guaranteed hits against turning or turbo movement.

The exact geometric wall overlay supersedes the filtered atlas above; moving vehicles retain a 1024-pixel maze atlas. `node tests/wall-shadow-edges.mjs` compares rendered pixels with independent ray/box intersections: native Chrome reports zero mismatches for geometric shadows versus 5,959 for the old nearest atlas. Docker Chromium/SwiftShader reports 17 versus 5,957 (raster-edge precision differences). The actual maze capture `test-results/wall-edge-maze.png` was inspected and shows straight, crisp inter-wall boundaries. The user also confirms the wall shadows look great. Native `tests/maze-shadow-receivers.mjs` preserves tank receiving and ground-shadow layering.

Vite now disables HMR by default. An isolated Chromium check changed an imported source module while keeping a page-state marker: the page and old module value remained intact, then manual refresh loaded the new value. `TRON_HMR=1` remains the opt-in native development setting. The Recognizer reset regression now reads velocities in the same browser task as reset, avoiding accidental measurement after subsequent simulation frames.

`scripts/codex-container test` passed on Docker Desktop on the development Mac: Linux ARM64, Node 22.23.2, Codex 0.155.1, Chromium 153.0.8010.12 and ANGLE/SwiftShader Vulkan. It verified unprivileged UID 1000, absent host home and Docker socket, denied root-filesystem writes, permitted project writes, WebGL 2 pixel output, all 132 simulation tests, 30 roof-edge poses, grid retention/overlap uniformity/full-game startup, Recognizer momentum/pause/reset/tuning and the production build. `test-results/container-check.json` records the run. Container software rendering is substantially slower than native GPU rendering; native driving feel and Safari-specific behavior are separate checks. Device login remains an interactive user step.


### Single-sweep materialization revision — September 20

The user replaced the two-pass sequence with one wireframe sweep and a 0.35-second whole-body solid fade. Opening and clearance are retained; activation now occurs at 2.75 seconds. `node tests/materialization.mjs` passes in native headless Chrome, including zero solid pixels at the end of the wireframe sweep, whole-body visibility during the fade, and increased blue-channel energy at full opacity. Inspected the mid-fade capture. Repeated reinforcements, the fifteen-aircraft render, pause and reset also pass without browser/shader errors. Temporary transparency/depth-writing settings return to their original values when the fade completes, and dynamic shadow attenuation follows solid opacity.

### Phantom shadow tiles after reinforcement spawning — September 20

Reproduced square shadow-map footprints after replacing an aircraft atlas with one using the same shader key. Receiver material program caches retained stale atlas/matrix uniforms; evicting those bindings before recompilation fixes the ghost patches. The materialization rectangle itself was already excluded from shadow casting.

`node tests/materialization-shadows.mjs` passes in native headless Chrome with fifteen aircraft and twelve active atlas slots: ordinary and fully materialized aircraft produce identical roof/ground pixels after an atlas rebuild (zero differences), the wire-only phase produces zero ghost-shadow pixels, and 10,122 real silhouette pixels remain. Inspected the oblique roof/ground capture. The initial ground-only reproduction differed at 128,488 pixels before the fix and showed square shadow-tile footprints. `node tests/materialization.mjs` also passes repeated live spawning, fifteen-aircraft rendering, phase captures, pause and reset without browser/shader errors.

### Exterior teleport pads — September 20

`npm test` passes all 143 simulation checks, including six new teleporter checks: exterior pad clearance and cross-maze links, whole-footprint entry with rotated turret, complete departure/arrival and exit-before-reentry, ground/aircraft altitude and heading preservation, occupied destinations and reset. `npm run build` completes; the existing large-chunk advisory remains.

Native macOS headless Google Chrome via `node tests/teleporters.mjs` passes actual W-key entry, all 16 pads, reverse and forward materialization, pause, arrival lock, an existing Recognizer and ground tank transferring, and reset with no console/page errors. Inspected `test-results/teleporter-dematerialize.png` and `teleporter-arrived.png`: glowing square, receding tank wireframe/rectangle, and solid Clu at the destination are visible. Other captures cover the approach, incoming sweep and aircraft. The first native browser attempt was blocked by the workspace sandbox; the approved external launch succeeded. Safari and human driving review remain unrun for this feature.

Recognizer flyover follow-up: `node --test tests/teleporters.test.js` passes all seven checks. The added fixed-step flight regression crosses pads at 34.155 m/s from multiple headings, including a high-altitude diagonal approach. Centered and 4 m offset approaches trigger; a 6 m offset approach correctly does not. An axis-aligned Recognizer footprint is 23.4 m wide on a 32 m pad, leaving only 4.3 m of center offset on either side for full containment. Occupied/reserved destinations can also defer departure. The reported play-session flyover has not been reproduced as a trigger failure; no activation rule changed.

Pad-size follow-up: doubled each side from 32 m to 64 m and removed the surface fill, retaining the glowing border at its previous world-space thickness. All seven targeted teleporter simulation checks pass; moving Recognizers now enter successfully at 20 m lateral offset, while 22 m remains outside full containment. No further browser reproduction was run, at the user's request.

Grid-alignment follow-up: pads now span exactly 2×2 floor-grid cells (48×48 m), with all four edges on multiples of the shared 24 m grid spacing. Outward snapping preserves wall clearance. All seven targeted teleporter tests pass, including edge alignment and moving-aircraft containment at the revised size. The border also has a small polygon depth bias and derivative-based smoothing to address reported flicker; JavaScript syntax checks pass, but no browser reproduction/visual confirmation was run for these follow-ups.

Pad-flicker follow-up: removed the separate pad planes and paint red borders directly into the existing floor shader. There is no independent pad depth surface; the border uses the same 0.10 m half-width and 1.2× derivative antialiasing as the grid. Syntax checks and shader-injection checks pass for all 16 borders and preview visibility. This supersedes the polygon-offset attempt. Browser/human confirmation of the reported flicker remains unrun for this revision.

September 21 invisible-pad correction: the floor border was changing `diffuseColor` after Three had already computed `outgoingLight`. Mix the border into outgoing light before the opaque output instead. `node tests/teleporters.mjs` passes in native headless Chrome with no browser errors; inspected the newly generated arrival capture and confirmed visible thin perimeter lines, unfilled interior, grid alignment and vehicle occlusion. Transfer, pause, ground/aircraft and reset checks also pass. This confirms restored visibility; it does not establish Safari motion/flicker behavior.

September 21 maze grid alignment: `npm test` passes all 144 checks after snapping site origins to 24 m and restricting seeded rotations to quarter turns. Site tests assert aligned coordinates and allowed angles while retaining collision, clear-space and transform round-trip checks; teleporter clearance and links also pass. No browser visual check was run for this placement-only revision.

September 21 materialization awareness: the full simulation suite passed 146 checks; after adding a destination-arrival integration case, all 15 targeted reinforcement/teleporter checks pass. Coverage confirms fresh pursuit memory suppresses the arrival search beam, ground/air knowledge sharing, copied rather than aliased reports, three-dimensional range limits, confirmed neutralization and destination-side knowledge on enemy teleport completion. No browser/audio visual check was run for this simulation-only correction.

### Optional tactical enemies and live Jev — September 21

`npm test` passes all **159** checks. New checks cover oriented versus circular wall clearance, swept rotation/translation, bounded low-corridor routing, inertial low-altitude trajectory following, a real maze wall-side stomp, wounded-unit withdrawal selection, hidden-Clu counterfactuals, mode/roster isolation, stale/invalid/uncertain decisions, server limits/timeouts/key isolation, and client pause/reset cancellation. `npm run build` passes with the existing chunk-size advisory. A scan confirms that the private credential is absent from built JavaScript, HTML, JSON and text outputs; Git ignores the credentials directory.

Native macOS headless Chrome: `node tests/tactical-browser.mjs --live` passes UI switching, the 2-aircraft/1-tank roster, the actual wall-side descent/crush, missing-provider fallback, pause, reset and return to Classic without further requests. Inspected `test-results/tactical-controls.png`, `tactical-wall-descent.png` and `tactical-live-jev.png`. The aerial capture shows the aircraft descending beside the slab; the final panel shows a real accepted Jev decision. The credential-file URL returns HTTP 403. Each `--live` invocation allows at most one real model call; normal browser runs mock the unavailable-provider branch.

Three bounded live calls were made in total: a server smoke at **317 ms** with confidence **0.59**; a browser call at **292 ms** with confidence **0.36**, correctly rejected under the initial 0.55 threshold; and a final browser call at **467 ms** with confidence **0.46**, accepted with the now-adjustable default threshold **0.25**. Calls used roughly 4,000 input tokens each. These are individual smoke measurements, not a latency distribution or evidence of better gameplay. A native browser fetch binding issue found by the first browser test was corrected before the passing checks.

Direct browser preflights to TypeSafe returned HTTP 400 without `Access-Control-Allow-Origin` for `http://127.0.0.1:5175` and `http://localhost:5173`. The game therefore uses the same-machine relay; disabling browser security is not part of setup. The main server was restarted on port 5173 with the credential connected. The local planner remains usable without the service; Classic is still the default. Human driving/encounter review, Safari behavior and long-session Jev quality/performance remain open.


### September 21 — Jev startup and reinforcement interval

Browser startup now selects Jev with the small encounter, replacing earlier experimental saved preferences once; future explicit mode choices persist. Headless simulation fixtures retain their Classic baseline. Classic reinforcements now materialize once per 20 continuous pursuit seconds; tactical modes still suppress them. `node --test tests/reinforcements.test.js tests/tactical.test.js tests/jev.test.js` passed all 19 checks, including threshold and repeat timing. `node --check src/main.js` and `npm run build` passed (existing bundle-size advisory). Browser startup was not rerun for this default/timing change.


### September 21 — full roster and nearby Jev decisions

Restored the full enemy population by disabling the optional small encounter at startup. Version-2 preferences retain their AI mode but migrate to the full roster; subsequent explicit small-encounter choices persist. Verified Jev and Classic produce identical initial vehicle populations. Jev requests now require a recorded target position within one maze length horizontally and a memory at most 38 seconds old. Unaware and distant units use local tactics, without inspecting live hidden Clu coordinates; replies are rejected if the unit has since left that range or lost valid knowledge. `npm test` passed all 160 tests, including nearby/distant/stale/unknown contact and hidden-position checks. `npm run build` passed with the existing bundle-size advisory; `git diff --check` passed. Browser play and live API calls were not rerun for these changes.


### September 21 — opening pursuit executor correction

Reproduced four opening Recognizers braking and returning toward initial route poses without any Jev requests. Above-roof travel now bypasses those stationary preparation poses; healthy units have pursuit/support candidates, and distant allies no longer trigger premature regroup/hold scoring. After 12 seconds chasing a moving Clu in the seeded simulation, all five aircraft close at least 40 m and maintain speed above Clu's normal maximum. `npm test`: 161 passed. `npm run build`: passed (existing size advisory). Native headless Chrome, `TRON_URL=http://127.0.0.1:5173 node tests/tactical-browser.mjs`: first attempt lost `__tron` after a wall-side descent; rerun passed mode switching, wall-side drop/crush, fallback, pause and Classic isolation. No live Jev call was made. Human review of pursuit feel remains pending.


### September 21 — enemy hearing

Added simulation-owned acoustic observations for ground/air units, independent of player audio mute. Engine samples use short ranges; cannon fire, impacts and destruction/data-wave events use larger ranges. Walls reduce pressure to 0.25; deterministic estimation noise and nominal engine loudness keep reports approximate. Reports expire after 10 seconds and remain separate from visual memory, radio target fixes and attack permissions. Local investigation and Jev now accept hearing-only context.

`npm test`: all 167 tests passed. After the final nominal-engine-range refinement and tuning controls, `node --test tests/hearing.test.js tests/jev.test.js tests/tactical.test.js` passed all 20 targeted checks. `npm run build` passed with the existing bundle-size advisory; `git diff --check` passed. Native headless Chrome via `node tests/hearing-browser.mjs` passed: an actual cannon shot outside an aircraft's view produced a sound report, local investigation and a mocked accepted Jev choice with `target: null`; pause froze simulation and no page errors occurred. No paid API calls were made. Human review of stealth balance and range tuning remains pending.


### September 21 — carrier shadow edge filtering

The carrier's 1024-pixel map covered 1500 m, producing roughly 1.46 m steps. Its map is now 4096 pixels with four-tap bilinear comparison filtering and a smaller carrier-specific depth bias. Receiver-plane slope correction applies independently to every sample; packed depth stays nearest-sampled. Other shadow maps retain their sizes/default sampling.

Native headless Chrome checks: `node tests/carrier-shadows.mjs` passed actual hull shadows on walls (15,954 changed pixels), floor shadows (17,884) and visible grid under the shadow (1,934). Independent ray/box edge tests, both stationary and translated, require the new incorrect-pixel count below 45% of the old count and nonzero filtered edge coverage; both passed. Inspected `test-results/carrier-edge-old.png` and `carrier-edge-filtered.png`: large sawtooth steps are substantially reduced. Finite-resolution edge texture remains under close magnification.

`node tests/maze-shadow-receivers.mjs` passed (30,015 changed tank pixels). `node tests/recognizer-shadows.mjs` passed roof, wall and debris shadows after making that fixture explicitly use Classic mode; its initial run passed rendering assertions but failed on an unrelated Jev HTTP 429 console error. `npm run build` passed with the existing bundle-size advisory. Safari and GPU memory/frame-time impact have not been profiled; the single carrier map now has sixteen times the texel count.


### September 21 — active lost-contact search and event replanning

Added observation-driven tactical interruptions for sight loss/reacquisition, contact acquisition/expiry, velocity-vector changes of at least 8 m/s and recorded position shifts of at least 45 m. A 0.65-second event cooldown limits oscillation while bypassing the older four-second commitment gate. Obsolete Jev answers are rejected even during the cooldown. Momentum is retained, ground routes refresh, and committed aircraft attacks retain their state machine. Healthy units prioritize bounded last-known-track investigation and nearby branch inspection over passive ambush; wounded withdrawal is preserved. Prediction stops at mapped walls and never reads hidden Clu state.

`npm test`: 171 tests passed. New checks cover sight interruption/debounce, stale reply rejection, observed turns/stops/displacement, radio contact, continued lost-contact movement without inventing sightings or attacks, nearby branch selection and wounded retreat. Existing opening pursuit, wall-side crush, collision, hearing and hidden-information checks also passed. `TRON_URL=http://127.0.0.1:5173 node tests/tactical-browser.mjs` passed native headless Chrome mode switching, wall-side drop/crush, mocked-provider fallback, pause/reset and Classic isolation. `npm run build` passed with the existing bundle-size advisory. No live Jev requests were used in this verification. Human assessment of aggression and long-run search quality remains pending.


### September 21 — connected search after reaching last contact

Corrected repeated return-to-contact behavior: search origin completion and visited checkpoints now persist across maneuver choices for both aircraft and tanks. Search candidates derive from a bounded, swept tank-corridor graph rather than spatially nearby open cells. The graph can turn corners while excluding disconnected pockets. Jev receives the checked locations and candidate corridor hypotheses; no new target fix is fabricated. High aircraft inspect from above without repeatedly descending at each checkpoint, preserving low routes for settled low craft.

`npm test`: all 174 tests passed. New regressions cover an L-shaped corridor and disconnected pocket, a 35-second aircraft search that checks multiple destinations without returning to `search-track`, and ground-unit arrival advancing the search. The inspected seeded aircraft run checked eight locations in 35 seconds. `TRON_URL=http://127.0.0.1:5173 node tests/tactical-browser.mjs` passed native headless Chrome attack/lifecycle/fallback checks. `npm run build` passed with the existing bundle-size advisory; `git diff --check` passed. No live Jev calls were made. Human review of corner-search behavior remains pending; the search graph is bounded and does not cover the entire maze.


### September 21 — remaining carrier shadow roughness

Refined only the carrier to a 6×6 Gaussian-weighted coverage filter, retaining the 4096-pixel map and receiver-plane comparison per tap. Texture allocation is unchanged; this trades additional texture samples and a slightly softer boundary for less edge variation. Native headless Chrome `node tests/carrier-shadows.mjs` passed the real carrier wall/floor/grid checks. On a straight edge, fitted contour roughness fell from about 1.37 pixels with the previous four-tap filter to 0.80 pixels, both before and after translating the caster (about 42% lower). The softened contour differs more from a binary ray mask inside the transition, so the new acceptance check bounds that difference to a 1.8 m boundary band; no mismatches remained outside it. Before/after captures were inspected. `npm run build` passed with the existing size advisory. Safari and frame-time impact remain unmeasured.

### Beam camera and persistent autoplay — September 21

- `node --test tests/beam-camera.test.js tests/autoplay-input.test.js tests/autoplay.test.js`: 14 passed. Half-speed timing, pause stability, interruption/reduced motion, channel overrides and existing planner invariants.
- `node tests/beam-camera.mjs`: passed in headless Chrome on macOS, local Vite. Aerial orbit exceeds 590 m, turret unchanged, camera freezes on pause and returns below 15 m by ring opening. Captures: `test-results/beam-camera-orbit.png`, `test-results/beam-camera-return.png`; return capture inspected.
- `node tests/autoplay.mjs`: passed with mocked Jev, no paid requests. Manual Space and braking preserve autoplay, release restores acceleration, U/button toggle still works; no page errors. Camera feel still needs human play review.

### Autoplay service loss — September 21

- `node --test tests/autoplay.test.js tests/jev.test.js`: 18 passed, including network errors, timeout, HTTP failures, provider cooldown, explicit re-enable and pause cancellation. Service failures clear the pilot plan and cruise throttle without changing manual held inputs.
- `node tests/autoplay.mjs`: headless Chrome on macOS passed with mocked 503 outage; autopilot disengages, its button switches off, warning remains visible, and it stays off. No paid requests or JavaScript errors.

### Local relay pacing — September 21

- `node --test tests/autoplay.test.js tests/jev.test.js`: 19 passed. Verify wall-clock pacing between player/enemy requests, separate hourly/spacing messages, retry delays and expiry reset on status reads. Production build passed. Provider credit balance was not queried.

### Local dollar budget — September 21

- `node --test tests/jev-spend.test.js tests/jev.test.js tests/autoplay.test.js`: 21 passed. Covers reported cost, free output, unknown outcomes, pre-dispatch rejection, rolling expiry, restart persistence and existing disengagement behavior. No paid requests used.

### Autoplay beam navigation — September 21

- `node --test tests/autoplay.test.js tests/ground-tanks.test.js`: 32 passed. Includes persistent distant destination, all-beam color/distance/bearing input, capture handoff, transfer hold and two captures across authored mazes in 600 simulated seconds without enemies. Build passed. These are local-controller checks, not a claim that live JEV completes the full game under attack. Human play review pending.

### Background autoplay — September 21

- `node tests/autoplay.mjs`: headless Chrome/macOS passed with mocked JEV and synthetic blur/hidden visibility transitions. Simulation time and position advance while hidden; explicit pause freezes time; disabling autoplay while hidden pauses; returning visible restores the ordinary loop. Existing controls and outage checks pass, no paid requests or page errors. This verifies application lifecycle behavior, not long-duration Safari/OS throttling.
- `npm run build`: passed.

### Autoplay corners, nearby objectives and turbo — September 21

- `node --test tests/autoplay.test.js`: 18 passed, including preserving waypoint progress on JEV confirmation, replacing distant objectives with nearby red beams, safe turbo acceleration/short-leg rejection, a room-to-beam route with repeated mocked confirmations, and two captures in separate authored mazes. Five additional room starts were probed without enemies; each captured the local beam within 90 simulated seconds.
- `node --test tests/autoplay-input.test.js tests/ground-tanks.test.js tests/simulation.test.js`: 64 passed.
- `node tests/autoplay.mjs`: headless Chrome/macOS passed existing driving, temporary overrides, background lifecycle, pause and mocked service-failure checks. No paid requests. `npm run build` passed. Live combat behavior and the user’s exact room scenario still need play review.

### Post-combat mission handoff — September 22

- `node --test tests/autoplay.test.js`: 21 passed. New regression creates five pursuers, accepts an escape choice, destroys all five, rejects the late escape reply, and verifies immediate beam routing plus subsequent approach. Additional checks cover a distant observed enemy moving away and route-failure hold/retry without unrestricted exploration.
- `npm run build` and `git diff --check`: passed. No paid requests. These are deterministic controller regressions; the user’s exact live session was not captured or reproduced.

### Actual blueprint opening navigation — September 22

- Reproduced the bug before the fix: with blueprint layout selected, no enemies and the actual opening coordinates, autoplay returned hold. The historic authored-layout fixture did not reproduce it.
- `node --test tests/autoplay-blueprint.test.js tests/autoplay.test.js tests/ground-tanks.test.js`: 40 passed. The blueprint test checks every swept route segment and actually captures the local beam within 300 simulated seconds.
- `node tests/autoplay.mjs`: headless Chrome/macOS passed. Starts on the browser-default blueprint, removes enemies, enables autopilot and verifies a collect-data plan plus movement exceeding 40 m before continuing the existing controls/background/outage checks. Mocked JEV; no paid requests or page errors.
- `npm run build` and `git diff --check`: passed. The user’s particular saved encounter remains unavailable, but the same hold symptom was reproduced on the actual layout.

### Intermediate corner stall — September 22

- Reproduced on blueprint at t≈146.8 s: x≈−283.17, s≈−262.70, an intermediate waypoint about 0.5 m away, next leg occluded, speed/throttle/steer zero. Manual rotation was unnecessary after distinguishing intermediate corner steering/creep from final stopping.
- `node --test tests/autoplay-blueprint.test.js tests/autoplay.test.js`: 22 passed. Blueprint coverage now leaves the first maze and captures a second beam, rejecting three seconds of motionless/no-steering behavior outside transfers. `npm run build` and `git diff --check` passed. No live API calls.
- Longer 800-second probe passed the original location but encountered a distinct hold/route failure near the third maze at about 689 seconds; remains unresolved.

### Damage bubble disabled — September 22

- `node --test tests/maze-sites.test.js`: 10 passed. Default-disabled wave leaves nearby enemies/carrier intact and radius/hit list empty; optional enabled-wave regressions and transfer timing still pass. Renderer sphere/ring visibility uses the same flag. Build and diff checks passed; no browser visual check performed for this flag change.

### Pad horizon and carrier lights — September 22

- `node --test tests/carrier-search.test.js`: 4 passed, including disabled lights clearing tracking/illumination and producing no new radio reports.
- `node tests/teleporters.mjs`: Chrome/macOS passed transfers and clipping, captures inspected at horizon and beside a pad. No continuous red horizon stripe; nearby borders remain visible. Carrier beam visuals hidden.

### Beam panels, retries and stats — September 22

- `node --test tests/jev-stats.test.js tests/jev-spend.test.js tests/maze-sites.test.js tests/autoplay.test.js tests/jev.test.js`: 43 passed. Covers timeout retries/recovery/exhaustion, counts across client resets/new rounds, trailing rates, reported/estimated costs, panel contacts and disabled blast.
- `node tests/data-beams.mjs`: Chrome/macOS completed all four beam transfers, blue states and reset without errors. Panel shell capture inspected from aerial view; close-view review run uses `--preview` and reduced motion.
- `node tests/autoplay.mjs`: Chrome/macOS passed HUD count/rate/cost assertions plus existing controls, background and outage coverage, with mocked JEV and no paid requests.
- `npm run build` and `git diff --check`: passed.

### Moving-shadow roof rims — September 22

- Chrome 153/macOS: isolated blueprint maze 1982 with a broad overhead moving caster reproduced the reported sawtooth wall-rim shadows. Rendered comparison inspected after the fix: wall faces and trim remain continuous.
- `node tests/recognizer-shadow-occlusion.mjs`: passed, including full-height wall receiver reaching the roof edge with a slab ID. Exposed roof retained all 8,694 shadow pixels; shielded wall went from 16,474 leaked pixels to zero. Ground, debris and projected-shadow occlusion passed.
- `npm run test:browser -- --refactor`: passed snapshot isolation, pause, camera views and repeated resets; resources stable at 97 geometries, 28 textures and one context.

### Safari local-file documentation styling — September 22

- User screenshot confirmed entirely missing CSS in Safari when opening the JEV file URL; automated WebKit with default permissions did not reproduce that load denial.
- Project generation now embeds the upstream colvmn stylesheet in all nine authored pages, without modifying the colvmn submodule or hand-editing HTML.
- WebKit 26.6/macOS verified both file and HTTP JEV pages with external CSS and layout JavaScript blocked: 202 embedded CSS rules, 960px page width, expected background/font and no horizontal page overflow at 1280px. Regeneration retains a single embedded stylesheet.

### Solar Sailer and opening carrier materialization — September 22

- `node --test tests/solar-sailer.test.js`: passed fixed-lane direction/altitude, three-minute repetition, hidden interval and disabled setting.
- `node tests/solar-sailer.mjs`: Chrome 153/macOS rendered source and adapted sailer, seven model textures loaded. Repeated crossings retain 109 geometries/eight textures; disposal leaves zero scene geometries and only the renderer-owned DFG lookup texture. Checked hidden preview/reset and captured the corrected forward orientation and split amber beam.
- `node tests/carrier-materialization.mjs`: Chrome checked opening, wire sweep, solid fade, completion and repeat/reset. The sweep spans the 1,225 m long axis. Captures inspected.
- `node tests/materialization.mjs`: existing Recognizer phases, two reinforcements, rendering/audio/shadow rebuilds, pause and reset passed after shared reveal changes.
- `npm run test:browser -- --refactor`: Solar Sailer integration passed pause/view/reset and retained stable resources across three restarts. No paid JEV requests used.

### Active-layout pad visibility — September 22

- `node tests/teleporter-visibility.mjs`: Chrome 153/macOS pixel checks passed for all 52 pads across blueprint seeds 1982/99, authored seed 7, and authored single-site 1982. Each active pad location contains 1,824–2,744 red border pixels in the overhead fixture; disabling borders leaves zero. A shared renderer exercises shader reuse across different pad layouts.
- Root cause: physics used scenario-generated pad positions while presentation compiled legacy default authored positions. Rendering now derives positions from the same scenario inputs.

Solar Sailer timing follow-up: first transit now starts at 180 seconds. Two unit tests cover pre-arrival fade, post-departure fade, dark intervals and repeat cycles. Chrome fixture verified beam opacities 0/0.5/1/0.5/0, unchanged hull gap and stable resources; production build passed.

Carrier arrival follow-up: the rectangle now stays at one world position while the carrier advances through it, bow first. `node tests/carrier-materialization.mjs` checks constant world coordinates across opening/sweep/fade, bow-before-stern clipping, full completion and restart. The previous eight-second timer is superseded by distance divided by carrier speed.

Carrier lighting follow-up: Chrome fog fixture retained 14,111 bright red pixels during the wireframe phase. All 34 live light materials share the reveal cut; beacon emissive intensity still cycles from 0.1 to 3.1. Front-first stationary-plane/reset assertions and existing Recognizer materialization browser checks passed.

Carrier panel reference follow-up: reviewed six frames spanning 2:37–2:38 of `Carrier derezed.mp4`. Chrome captures confirm the translucent cool field and faint green rim; checks passed for the 7 Hz pulse (opacity multiplier 0.78–1), world-fixed reveal, lights and reset. Extracted stereo WAVs are 3.00/2.88 seconds at 44.1 kHz with peak 0.7; auditory suitability remains unverified and gameplay does not load them.

Solar Sailer speed doubled to 280 m/s; 12 km crossing now takes about 42.9 seconds. First appearance and repetition stay at 180 seconds, with a three-second beam fade-in and extended nine-second fade-out.

Carrier audio trim follow-up: retained only the second half, 2:38.5–2:40. Regenerated the 1.50-second clip and 1.38-second loop, including source metadata and catalog descriptions.

September 23 carrier panel refinement: Chrome materialization checks passed after adding the yellow rim and gray-fill fade to zero at its inner edge. Rendered midpoint capture inspected; center base opacity remains 0.5 and the existing pulse remains active. Production build passed.

### Wall-shadow flicker — September 23

- Chrome 153/macOS `node tests/wall-shadow-stability.mjs --measure` reproduced depth dropout before the fix: up to 31,795 mismatching pixels versus a depth-uncontested reference; camera shifts of 1–2 cm changed the missing patches at 10 km world coordinates.
- After adjusting the wall overlay’s depth bias, `node tests/wall-shadow-stability.mjs` passed all 81 poses with zero mismatching pixels and explicit visible-shadow coverage in every pose.
- `node tests/wall-shadow-edges.mjs` retained zero mismatches against independent ray/box shadow intersections. The nearest-map comparison had 5,959 mismatches, confirming fixture sensitivity. This addresses the reproduced coplanar shadow flicker; other moving-object cases remain subject to play review.


## Spotlight surface reach — September 23

`node --test tests/alertness.test.js`: 11 passed, including every ribbon endpoint at 400 m altitude reaching the ground or a raised clipping surface. `node tests/searchlights.mjs`: Chrome headless on macOS passed rendering, wall/floor clipping, state visibility and pause checks without browser errors. Detection limits are unchanged.

## Confined stomp positioning — September 23

On macOS, `npm test` passed all 249 tests. New cases cover three oblique wall orientations, close-wall offsets, tight corridors, and a complete collision-free stomp in a 10.8 m corridor rotated 0.37 radians. Existing wall-side, moving-turn, information isolation and attack tests remain passing. `node tests/tactical-browser.mjs` passed in headless Chrome: wall-side drop, AI mode changes, no-key fallback, pause/reset and Classic isolation. Inspected `test-results/tactical-wall-descent.png`; this is a small aerial fixture, not a general approval of all driving/attack feel. `node scripts/benchmark-enemy-pursuit.mjs` measured simulation-step p95 0.59 ms, worst 17.83 ms on this run (not a browser frame-rate claim). Landing search remains under the shared planning admission budget. Physically impassable gaps remain unsupported.

## Surface impacts, support roles and victory — September 23

On macOS, `npm test` passed all 256 tests before the final additional projectile-event test; `node --test tests/surface-impact.test.js` then passed all five impact tests, including both player and enemy wall shots. Formation coverage includes six recognizers, separated goals, retained satellite assignment beyond 140 m, support without personal sight, stale-memory release and existing leader handoff. The pursuit benchmark measured p95 0.35 ms/worst 15.67 ms simulation steps on this run, not a browser FPS measurement.

Headless Chrome checks passed: `node tests/surface-impacts.mjs` (surface orientation, camera independence, shader compilation and cleanup), `node tests/victory.mjs` (all-blue victory, exact text, frozen simulation, Return to credits/music without detachment, restart), `node tests/death-terminal.mjs` (existing fatal-hit terminal/music/signoff flow), and `node tests/tactical-browser.mjs` (wall-side stomp, modes, fallback, pause/reset). Inspected `surface-impact-wall.png`, `victory-terminal.png`, and `victory-credits.png` under `test-results`. Browser music state/playback was checked; no claim of an auditory review. Rings use existing projectile collision coverage, with rendered mesh normals for registered vehicle hits; this does not introduce projectile collision for scenery that was previously noncollidable.

## Victory printer pacing — September 23

Use a monotonic clock, stable per-line DOM nodes and at most one new character per rendered frame. The rate is now 45 characters/second; a stalled frame cannot dump a word-sized backlog. Skip the hidden 3D scene while the victory page is open. `node --test tests/victory.test.js` passed, including a two-second synthetic stall, one-character updates, unchanged completed lines and restart. `node tests/victory.mjs` passed in both headless Chrome and workspace-installed WebKit: early/late rates were 45.00/44.99 and 45.06/44.98 characters/second respectively. Exact text, credits/music transition, Shift+8 preview and restart checks passed; build passed. A browser rendering below the target character rate can print more slowly rather than batch characters.


## Two-recognizer approach regression — September 23

A deterministic local encounter with two healthy aircraft 120 m to either side of stationary Clu failed to complete a stomp after 120 simulated seconds before the fix. Progress-based lease renewal completed it in 24.27 seconds. `node --test tests/escort-debris.test.js tests/tactical.test.js` passed all 32 tests, including a 45-second completion bound, stable lead, single active strike, blocked-lead handoff and stalled-lead expiry. `node tests/tactical-browser.mjs` passed in headless Chrome (wall-side attack, AI modes, fallback, pause/reset). The reported live JEV session itself was not captured; the reproduced local-controller failure is fixed.

Safari follow-up: victory text now appends one immutable `.printer-character` element per glyph, grouped into stable lines. Printing never reads bounding boxes, offset/client/scroll dimensions, or computed styles; normal browser layout is still necessary. Targeted tests passed, including glyph-node structure and one-character updates. Headless WebKit measured 45.19 characters/second early and 44.98 late, with victory/credits/restart checks passing. Build passed. This automation has not reproduced the slowdown reported in the user's Safari window, so the visible Safari result still needs confirmation.

## Pursuit stomp and JEV toggle — September 23

- `node --test tests/tactical.test.js tests/escort-debris.test.js`: 34 passed. Simulated accepted provider pursuit choices complete collision-free stomps in an oblique 10.8 m corridor and a two-aircraft full-session encounter with one active attacker.
- `npm test`: 260 passed.
- `node tests/jev-toggle.mjs`: headless Chrome on macOS passed N on/off while paused without advancing/restarting the round, repeat suppression, autoplay disengagement on disable, and U re-enabling JEV. Provider requests stubbed; no live JEV quality claim.
- Actual interactive flight and live-provider choice quality remain for play review.

## Four-second stomp acceptance — September 23

- `npm test`: 269 passed, including 32 close-stomp cases (eight headings × local/pursue/strike/low-approach), the real five-unit starting formation, tight oblique corridors, no stomp self-damage from debris, bounded repeatable cannon spread, and zero vertical enemy scatter for level aim.
- Close-range deadline assumes a healthy aircraft starting at rest at 80 m altitude, stationary observed Clu 48 m away in open space, and a ready attack. Simulated provider responses exercise accepted plans, not live JEV policy quality.
- `node tests/stomp-browser.mjs`: headless Chrome/macOS, actual opening formation, simulated accepted JEV low-approach/pursue replies, starting throttle released. Rendered drop and stomp completed at 11.0 seconds from encounter start (initial separation exceeds 300 m); attacker health remained 3. Capture: `test-results/opening-stomp.png`. No page errors.
- `npm run build` passed; existing bundle-size advisory remains. `git diff --check` passed.

## Three-second full-speed turning limit — September 23

- Removed the close-attack yaw override. Normal flight now caps yaw at 2π/3 rad/s with 4π/3 rad/s² acceleration, smooth braking, and speed reduction for tight approach turns.
- `npm test`: 269 passed. Eight initial headings across local and simulated JEV choices complete stomps while respecting rate/acceleration bounds; only initially aligned attacks retain the four-second deadline assertion. This supersedes the earlier all-heading four-second acceptance.
- `npm run build` and `git diff --check` passed. Rendered turning feel has not been rechecked in this change; user play review remains.

## Original motion, helicopter translation and ENCOM mark — September 23

- `npm test`: 271 passed. Directional thrust verifies pure lateral/reverse movement without yaw, shared diagonal acceleration budget, and unchanged velocity limits. Corridor search verifies lateral travel with a fixed wall-aligned hull. Eight-heading attacks respect original yaw and acceleration limits.
- `node tests/victory.mjs`: headless Chrome/macOS passed opening/victory/credits ENCOM visibility, victory printer pacing (~45 characters/s), terminal lifecycle and restart. Inspected `test-results/terminal-encom.png`: lower-right lavender outline and glow match the reference treatment. Logo is a local project-authored SVG approximation.
- Before adding independent translation, `node tests/stomp-browser.mjs` verified the restored original flight limits completed the rendered opening stomp at 13.23 simulated seconds; attacker retained health 3. Provider responses were simulated.
- After independent translation: `node tests/stomp-browser.mjs` passed the rendered opening at 13.27 simulated seconds, attacker health 3, accepted simulated JEV plans, and no page errors.

## Approaching-target stomp interception — September 23

- `npm test`: 274 passed. Local and simulated JEV pursuit choices intercept Clu travelling at 22 m/s from 140 m away, with lateral offsets 0/20/40 m. Tests require fold commitment while Clu remains more than 40 m away, successful impact within eight seconds of the encounter, and no attacker health loss. Local measured impacts: 5.02/5.60/6.18 seconds; no movement tuning changes.
- Regression verifies holding a crossing during expected target motion and replanning immediately for a newly observed turn. Existing sight-loss, wall-clearance and post-commit miss tests remain covered.
- `node tests/stomp-browser.mjs --approaching`: headless Chrome/macOS passed with accepted simulated JEV responses, CLU driving toward an offset aircraft, fold beginning more than 35 m ahead, and successful impact at 5.92 simulated seconds; attacker health remained 3. Capture: `test-results/approaching-stomp.png`. No page errors.

## September 24 — light-cycle arena competition

- `npm test`: 281 passed on the macOS development host. New cases cover deterministic six-bike rounds, shared trail/wall collision, simultaneous head-on crashes, perimeter patrol completion and contact-driven pursuit.
- `node tests/light-cycles.mjs`: passed in headless Google Chrome on macOS. Verified six-cycle simulation, camera-only spectator run/pause, arena patrol presence, loaded model dimensions and matching player/enemy tank material colors. Inspected `test-results/light-cycle-models.png` and the closer `test-results/light-cycle-match.png` capture.
- `npm run build`: passed; regenerated documentation from Markdown sources. Existing large-bundle warning remains.
- The supplied cycle decal texture is absent; source diffuse color is used on that small surface. Safari race rendering, sound and human judgment of racing tactics remain unverified. Main-world vehicles do not collide with the separate race's trails or arena enclosure.

## Central-maze cycle stage and deferred models — September 24

`node tests/labyrinth.mjs` passed browser checks for one default maze/beam/four pads and the restored five-maze/five-beam/twenty-pad layout. Tests cover preserved central/arena placement, starting clearance, translated opening units, and collision/patrol membership with outer sites absent.

`node tests/cycle-player.mjs` passed in headless Chrome on macOS: no arena/cycle/solar-sailer requests before opening readiness, actual beam completion, safe wait for deliberately delayed arena assets, player turns, pause, retry, and gold-team victory. Inspected the chase-camera capture. Unit tests cover three attempts, a crashed player's team winning, draws, loss, reset, and delayed-asset handoff.

Measured local startup marks: app start 254 ms, asset loading begins 2,935 ms, required assets ready 3,062 ms, rendered world built 4,008 ms, first frame 4,191 ms after navigation. This warm local measurement is not a cold-network or Safari benchmark; synchronous maze/enemy construction dominates the remaining startup. Solar sailer request begins only after 30 seconds of play.

Final verification: `npm test` passed all 295 tests; production/documentation build passed. The browser check also confirmed the solar sailer asset request after advancing play past its deferred-load threshold. Fixed an existing nondeterministic radio test fixture by using a fixed seed and excluding unrelated tank radio senders; the test continues to assert delayed delivery and stale timestamps. Spawn-offset comparisons use floating-point tolerance.


## Cycle turbo/audio and test start — September 24

Chrome headless on this Mac: `node tests/cycle-audio.mjs` decoded all six stereo WAVs and verified one startup/launch/turn/crash/trail-collapse cue, one engine per live cycle, no voices during pause or after reset, engine-only resume, and cleared/paused music after arrival. `node tests/cycle-player.mjs` verified the normal beam handoff, I-key boost/release and meter, pause, retry and victory. Source clip selection used timestamped video contact sheets; no claim of auditory fidelity is made. Listening/tuning the mixed-film samples remains outstanding.

Simulation tests cover partial-charge activation, charge exhaustion, release/recharge/reuse, faster player motion without accelerating allies, collision with an intervening occupied cell, exclusive I-key control, and safe deferred test entry without advancing the tank encounter. Final verification: `npm test` passed 300/300; `npm run build` passed (existing large-chunk advisory). The expanded `node tests/cycle-player.mjs` also passed the default arena start, confirming three chances, full turbo and no beam collection. The paused cycle capture in `test-results/cycle-player.png` was visually inspected; Chrome reported no page errors.


## Arena patrol and revised cycle sound checks — September 24

`node --test tests/cycle-player.test.js tests/light-cycles.test.js`: 21/21 passed, including all four guard waypoints over 260 simulated seconds, frozen non-arena enemies, no revival of a destroyed guard, and approaching/receding/transverse Doppler with stable player pitch. `node tests/cycle-player.mjs` (Chrome headless, macOS) passed guard movement during the test start and exact position/state freeze when paused, alongside its existing handoff/turbo/retry coverage. `npm run build` passed with the existing chunk-size advisory.

Revised audio checks decode seven stereo clips, verify the 0.9-second exterior and 1.9-second cabin loops, one-second turn and two-second explosion, player cabin selection, paired stereo emitters, event deduplication, pause/resume/reset cleanup and paused music with an empty transition queue. AudioParam instantaneous gain reads are not used as a playback assertion: rendering-quantum timing can leave the previous value visible even after music is paused and automation cancelled. Human listening remains the fidelity check.

## Cycle follow camera — September 24

- `node --test tests/cycle-camera.test.js tests/inspection.test.js`: 7/7 pass on macOS / Node 22. Projected cycle screen height stays constant across irregular render cadence, repeated simulation poses and normal/turbo movement; turns retain orbit easing, reset clears the old anchor. Spectator keyboard direction, easing and slower movement also pass.
- The supplied real Safari 26.6.2 report measures initial simulation/enemy placement at 19,442 ms and opening readiness at 20,849 ms. This is still an unresolved startup bottleneck, not a model-download delay.
- `node tests/cycle-spectator.mjs`: Chrome headless passed automatic launch, live spectator movement, pause/resume, automatic retry/follow-camera restoration and spectator victory. Follow-camera perceptual review in actual Chrome/Safari remains for the user; no claim of an automated Safari visual check.
- `npm run build` and documentation generation passed; existing bundle-size advisory remains. `git diff --check` passed.

## Startup acceleration / cycle glances — September 24

- Node 22 fixed layout/run seed 1982: initial `createRun` about 2,792 ms before changes, 675 ms afterward. Same labyrinth and enemy population; connected placement checks remain enabled.
- `node tests/loading-timings.mjs` passed in local Playwright WebKit (1280×800, DPR 1): first placement 529 ms, opening 2,246 ms; reload placement 506 ms, opening 2,146 ms. Previous sequential WebKit first run was 1,820 / 3,202 ms. User Safari at DPR 2 remains to be remeasured.
- Added 10,000 deterministic collision comparisons against exhaustive clipping with zero/padded rays, stationary points, holes, acute triangles and height changes. Nearest-hit values and early obstruction booleans match. Added cycle glance direction/easing/release tests and adjusted turbo charge expectations for five-second capacity.
- `npm test`: 308/308 passed after startup optimization and five-second turbo adjustment.
- After the cycle-only 120 Hz step and interpolated presentation changes, `node --test tests/cycle-camera.test.js tests/cycle-player.test.js tests/refactoring.test.js`: 27/27 passed. Covers unchanged horizon during glances, right-angle interpolation/trail progress, timestep switching and existing cycle gameplay/lifecycle invariants.
- User-supplied actual Safari 26.6.2 confirmation (DPR 2): placement 2,995 ms, opening 4,463 ms, arena ready 5,048 ms; previous values 19,442 / 20,849 / 21,398 ms. This supersedes the earlier pending-Safari note.
- `node tests/cycle-spectator.mjs`: Chrome headless passed J/L glance and release-to-forward checks, automatic launch, spectator movement/pause, next-round camera restoration and victory. `npm run build` passed (existing bundle-size advisory); `git diff --check` passed. Perceived motion comfort/smoothness still needs user review in Chrome/Safari.

## Cycle pedals, materialization and unlimited restarts — September 24

- `npm test`: 313/313 passed. Includes eased turbo/slow response, S priority, charge preservation, swept cell collision and repeated manual match restart without endings.
- Chrome `tests/cycle-spectator.mjs` passed glances, spectator controls, Return restart, launch after materialization and disabled victory. `tests/cycle-audio.mjs` passed eight stereo sample decodes, one materialization cue, launch/turn/crash/wall sounds, pause/resume/reset and music suppression. The materialization cue is 0.7 seconds from 26.7–27.4 in the supplied film mix; auditory fidelity not yet confirmed.

## Arena breaches — September 24

- `npm test`: 315/315 passed before the final outside flood-fill key adjustment; targeted cycle tests rerun afterward. New invariants: initial impact destroys its cycle, following cycle can escape in an adjacent lane while the dead trail remains, adjoining enclosure stays solid, restart restores boundary; mesh clipping removes the opening while retaining adjacent triangles.
- `node tests/arena-breaches.mjs`: Chrome headless, 1200×800, loaded actual GLB. Center ray hits changed from 2 to 0, adjacent ray still hit twice, and restoration recovered center hits. One breach update took 33.5 ms. Rendered capture `test-results/arena-breach.png` inspected: jagged inner opening and exposed full-depth passage visible. No claim of film-perfect fracture animation; the opening is instantaneous with the existing cycle crash effect.

## Escaped-cycle road dynamics — September 25

- Added tests for exit-speed preservation, throttle/coast/brake response, gradual turning and lean, swept collision rejection, trail cutoff and continued riding after arena results.
- Chrome `tests/cycle-spectator.mjs` now also forces an escaped player outside the enclosure, holds W+D to confirm acceleration/continuous yaw/lean, checks the trail stays unchanged, then brakes with S. Passed alongside existing glance, spectator and Return-restart checks. Rendered `test-results/cycle-road.png` inspected: bike banks while horizon stays level; free-ride controls and km/h meter visible. Feel and audio require user review.

## Passage floor and cycle pedal aliases — September 25

- `node --test tests/cycle-player.test.js`: 15/15 passed, including I/K aliases and slow priority.
- `node tests/arena-breaches.mjs`: Chrome headless on macOS passed opening/adjacent-wall/reset checks; inspected `test-results/arena-breach.png` for dark teal passage floor without grid and outlined dark fracture surfaces. Geometry update approximately 42 ms in this run.

## Branching arena fracture — September 25

- `node --test tests/arena-breaches.test.js`: opening, follower escape, adjacent solid wall, upper/side branches and reset checks passed.
- `node tests/arena-breaches.mjs`: Chrome headless on macOS passed mesh raycast/reset checks; inspected the rendered crack. Update measured about 33 ms in the first successful branching-profile run.

### Fracture outline cleanup

- `node --test tests/arena-breaches.test.js`: 3/3 passed, including a coplanar T-junction regression and preservation of box crease edges.
- `node tests/arena-breaches.mjs`: Chrome headless on macOS passed; inspected `test-results/arena-breach.png` confirming removal of wall/symbol triangulation lines while retaining the branching crack outline. Breach update measured 54 ms.

## Cycle floor shadows, progressive steering and road turbo — September 25

- `npm test`: 321/321 passed, including duration/speed-dependent lean, release recovery and road turbo charge/recharge/brake priority.
- `node tests/cycle-spectator.mjs`: Chrome headless on macOS passed hidden-opponent, glances, road controls/turbo, spectator and Return restart checks with no shader/page errors. The first run missed a short glance timing assertion during startup; a repeat passed, then the test was updated to allow shader warmup and passed again.
- Inspected `test-results/cycle-floor-shadows.png` and `test-results/cycle-road.png`: floor shadows visible inside and outside the arena, horizon level while bike banks. Driving feel awaits user review; Safari was not tested in this change.

## Road collision response — September 25

- `node --test tests/cycle-road.test.js tests/arena-breaches.test.js`: 9/9 passed, covering harmless bumps, moderate damage/bounce, shallow high-speed deflection, severe impact death, accumulated damage death and retained safe position.
- `node tests/cycle-spectator.mjs`: Chrome headless/macOS control, rendering, spectator and restart checks passed. Collision feel still needs user review.

## Low-speed steering research and tuning — September 25

- `node --test tests/cycle-road.test.js`: 7/7 passed. Low-speed test at 3 m/s checks radius under 3 m, lean under 20 degrees, faster heading response than at 40 m/s, no stationary pivot, and continuous blend boundaries.
- `node tests/cycle-spectator.mjs`: Chrome headless/macOS passed, including a 3 m/s half-second turn and existing road turbo/controls/lifecycle checks. Inspected `test-results/cycle-slow-turn.png`; actual feel remains subject to user review.

## Escape simulation handoff — September 25

- `node --test tests/cycle-player.test.js tests/cycle-road.test.js`: 23/23 passed, including frozen competitor positions/match timer, continued player travel, resumed non-patrol enemy movement, and reversal on restart.
- `node tests/cycle-spectator.mjs`: Chrome headless/macOS passed outside controls, turbo, low-speed turn, spectator and Return restart flow.

## Reverse, orbit glances and perimeter collision — September 25

- `npm test`: 327/327 passed, including reverse limits/stop/forward recovery, visible cycle throughout glances, slower outside camera response, wall clearance, swept crossings and withdrawal from contact.
- `node tests/cycle-spectator.mjs`: Chrome headless/macOS passed, including slow reverse, stationary release, orbit glance capture and restart. Inspected `test-results/cycle-road-glance.png`; the bike remains visible at rest. Exact user screenshot location was not reproduced; the inflated-triangle clearance path was replaced.

## Turn-anticipating road camera — September 25

- `node --test tests/cycle-camera.test.js`: 7/7 passed, including left/right anticipation, cycle visibility, level horizon, release/rest/reset behavior.
- `node tests/cycle-spectator.mjs`: Chrome headless/macOS passed driving, glances, reverse/rest and restart checks. Inspected `test-results/cycle-road.png` for the turn camera. `npm run build` passed. User review remains the measure of camera comfort.

## Road cruise control and Clu-style aerial camera — September 25

- `npm test`: full suite passed, including target-speed holding, X brake-versus-reverse gating, W/S reverse exit, and shared aerial dimensions/zoom.
- `node tests/cycle-spectator.mjs`: Chrome headless/macOS passed I turbo, X braking/reverse, S reverse exit, stop, orbit glance, V aerial transition/wheel zoom, spectator and restart checks. Handling remains a game approximation and awaits user driving feedback.
## Road tire traces and dynamics window — September 26

`npm test`: 337/337 passed, including per-session tuning isolation, observable acceleration changes, invalid-setting rejection, restart retention, and tire-trace lifetime/reset/disposal. `npm run build` passed with the existing large-chunk advisory.

`node tests/cycle-tuning.mjs` passed in headless Chrome on local macOS at 1440×1000. Checked visible road traces, Tab dialog, frozen simulation during editing, keyboard isolation, live parameter application, preservation of an existing pause, browser-local persistence after reload, and Reset defaults. No page errors. Inspected `test-results/cycle-tuning.png` and `test-results/cycle-tire-traces.png`; the latter shows the faint trace under the rear tire from the normal driving camera. Trace visibility and tuning preferences still need user play review.

## Road-bike CPU investigation and half-range radio — September 26

`npm test`: 339/339 passed after the outside-world cadence, wall-query optimizations and radio-range reduction. Updated radio fixtures explicitly check half of the active world's maze width and place transmitters within the reduced radius. A cadence regression checks tank/road/spectator 60 Hz versus arena 120 Hz.

`node tests/cycle-performance.mjs`: Chrome, local macOS, 1280×800, seed 1982, engine sound/renderer and the existing tire traces enabled. Five-second live-bike CPU totals decreased from 1,572 to 177.5 ms; post-death totals from 639 to 216 ms. Samples include a moving live bike and the same session after death, with JEV requests intercepted for repeatability. Both before and after were approximately 60 fps on this machine. These are combined-change CPU measurements, not proof that the user's browser slowdown is eliminated. Final capture ran after the unit tests completed; artifacts are in `test-results/cycle-performance.json` and `test-results/cycle-{alive,dead}.cpuprofile`.
