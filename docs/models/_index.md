---
title: Models
subtitle: Imported vehicle sources and runtime adapters
---

Both files were supplied by the user on September 12, 2026 after downloading from Sketchfab. Embedded asset metadata identifies the following sources; original binaries remain unmodified.

| File | Source / author | Terms recorded |
| --- | --- | --- |
| tank_-_tron_1982.glb | [Tank — Tron (1982), arabinowitz](https://sketchfab.com/3d-models/tank-tron-1982-b730d118f54b4a868339a4ddf11e09a7) | Embedded SKETCHFAB Standard; creator description additionally says editorial purposes only. |
| tron_1982_recognizer.glb | [Tron 1982 Recognizer, Shriker1](https://sketchfab.com/3d-models/tron-1982-recognizer-ecb52608275c40a28d7d9dda1aed54f3) | Embedded SKETCHFAB Standard. |

License link from both files: [Sketchfab licenses](https://sketchfab.com/licenses). TRON is Disney's property. This records the supplied files' provenance and creator restrictions, not an independent grant of film rights.

## Runtime modifications

The adapter in src/rendering/models.js bakes the export transforms and uniformly scales both models. The tank is 6.5 meters wide (about 9.37 meters hull length); it faces local -Z. Original polySurface1–13 form the rotating cannon/canopy assembly around the circular base. The barrel remains level; recoil translates the assembly slightly. A muzzle flash is added, with simulation coordinates shared through src/game/tank.js.

Tank armor uses cool-blue specular highlights. Red trim is non-emissive, gold is limited to upward-facing shoulders, and lower side panels remain dark. The white insignia has only minimal emission. Hull and turret cast projected silhouettes onto the floor. The extra rectangular contact-shadow plane has been removed. Recognizer trim retains emission.

Recognizer geometry is shared between five aircraft, with separate materials for independent hit flashes. Uniform normalization gives 15 meters overall height and approximately 18.38 meters width at the existing 0.5 simulation scale. Collision remains a simplified independent volume.

Vite packages both GLBs into local dist/assets URLs. There is no Sketchfab runtime request or account requirement. Startup waits for both models and shows a reload message if either fails.

## Verification

node tests/models.mjs checks muzzle alignment across nine hull/turret combinations, Recognizer scale and independent materials, and writes test-results/imported-models.png for visual inspection. Browser controls and lifecycle checks are recorded in [Validation](../validation/index.html).

Recognizer articulation now splits the Base and Light triangle meshes into a body and two legs at the shoulder seam. Original normals, UVs and materials are retained. Each leg turns 180 degrees around its upright center while sliding inward to form the crush pose. Geometry is shared among aircraft; each has independent pose and hit-flash materials.

## Sark’s carrier

User supplied `TRON CARRIER DAE` on September 13, 2026. The included readme credits JIHS, with original design by Syd Mead, and identifies the model as Sark’s carrier from the 1982 film. Source: [JIHS / TurboSquid](https://www.turbosquid.com/3d-models/3d-tron-1982-carrier-model-1811129). The listing records a Standard license; the supplied folder has a technical readme but no separate license document. Preserve the purchase license with the source archive.

`scripts/prepare-carrier.mjs` converts the untouched Collada file into `tron_1982_carrier.glb` using Three.js ColladaLoader and GLTFExporter in Chrome, repairing relative texture URLs in memory. All seven referenced textures are embedded. Measured export: 77 meshes, 64,519 triangles, 6.86 MB; bounds approximately 1,224.65 × 201.96 × 277.01 meters. Source units and proportions are preserved.

`src/rendering/carrier.js` centers the model and adapts its materials to a dark hull with illuminated trim. It travels along world +X at 24 m/s, center altitude 360 m, starting three times the spawn-to-maze distance ahead of Clu (six maze half-widths), 9,000 m to the left of the initial heading. Motion follows simulation time, so standby freezes it and restart restores the transit. It is scenery with no combat or collision behavior. It continues along its line without wrapping. The camera far plane is 12 km, and the carrier is exempt from ground fog. The standalone `/carrier.html` preview provides orbit, pan and zoom with original materials.

## Localized Recognizer destruction

The nearest posed triangle to the reported projectile impact selects the body, left leg or right leg. Only that section is partitioned into 8–13 randomized surface fragments; both other sections detach as whole pieces with gentler spin and impulses. Folded poses, original trim and inherited velocity are preserved. Every source triangle belongs to one piece. This remains a surface breakup effect, not a solid-volume fracture simulation.

Carrier contrast correction: restored source hull colors and textures, reduced blue emission, and adjusted roughness for directional shading. Applied a small depth offset to the original illuminated trim so coplanar hull surfaces do not hide it. Inspected the revised in-game capture; `npm run test:browser -- --carrier` passed.

Carrier trim balance: softened red paint and emission, increased the original blue trim emission, and added muted blue lines at actual armor boundaries (25-degree edge threshold, excluding coplanar triangle edges). This makes the smaller hull panels readable without raising the hull fill.

Recognizer destruction refinement: the earlier rig grouped the complete upper assembly as one body, so one body hit could fragment crown, crossbar and shoulders together. Breakup now treats crown, crossbar, left shoulder, right shoulder and the two articulated legs as six sections. Only the struck section fragments; the remaining five detach whole. Section boundaries use the source triangle centers, preserving every original triangle.

Clu destruction now uses the same posed-surface breakup system: a stomp hides the intact tank and its projected shadows and scatters randomized tank fragments. Current turret yaw and tank momentum are captured by the destruction event. Shadow geometry and muzzle effects are excluded. Thin blue boundary seams outline tank fragments; red boundary seams outline fractured Recognizer sections. Interior triangle diagonals are excluded. Seams fade and dispose with debris. Restart restores the intact tank.

## Carrier escape shuttle

Retired: the unused shuttle experiments, assets and preview tools were removed on November 7, 2026. No usable shuttle was adopted.

## Grid cloud

[cloud.glb](cloud.glb) contains one complete connected grid cloud extracted from `extra/tron_1982.glb`, with no neighboring cloud fragments. Original cyan emissive material and imported scale are preserved; source transforms are baked to Y-up and the cloud is centered at the origin. It contains 1,046 vertices and 846 triangles and spans approximately 735 × 695 meters in the XZ plane. [Preview](cloud-preview.png).

Source: **Tron 1982** by **jvouillon**, from the source file's embedded metadata: https://sketchfab.com/3d-models/tron-1982-d7b1e9a03bca4bb6aa636b56ae45ec88 — CC BY 4.0. Attribution and modification notes are retained in the exported GLB. Reproduce with `python3 scripts/extract-cloud.py`. The game reuses this asset for its decorative drifting cloud layer.

## Solar Sailer — September 22

Source: `extra/TRON_SUNSHIP DAE/TRON_SUNSHIP.dae`, supplied with seven vehicle textures and the JIHS readme. The original design credits Syd Mead, Jean Giraud (Moebius), and Peter Lloyd. The readme references TurboSquid but does not specify redistribution terms. The source is retained unchanged.

Run `node scripts/prepare-solar-sailer.mjs` with Vite on port 5173 to regenerate `tron_1982_solar_sailer.glb`. The browser conversion repairs the source `file://` texture paths in memory and embeds all seven textures. Source geometry has 136,380 triangles; the 162 m overall bound includes a short yellow beam. The adapter hides that beam, anchors the craft on its axis, preserves proportions at uniform 2.5× scale, and orients the sails to lead the +X transit. A fixed amber beam stops at the rear/front hull bounds and resumes on the other side. Materials retain textures with adjusted sky fill and emissive rigging.

Reference reviewed: `docs/references/videos/carrier and solar sailer.mp4`, 1:34–1:46. Film-derived scale and exact visual fidelity remain approximations; this is scenery, not a new combat unit. Lane placement and cadence are named settings in `src/game/solar-sailer.js`.

The first Solar Sailer pass starts at three simulation minutes and repeats every three minutes. Its beam eases in over the three seconds before each crossing and out over nine seconds afterward; both remain absent during the initial quiet period. Pause and restart use the same simulation clock.

## Extracted light cycle arena — September 23

[Standalone GLB](extra/tron_1982_light_cycle_arena.glb) · [Preview](extra/tron_1982_light_cycle_arena-preview.png)

Extracted from the user-supplied `extra/tron_1982.glb`: seven architecture meshes (arena walls, broken-wall interiors, upper surfaces, lights, signs and graffiti), 9,329 triangles. Vehicles, light trails and surrounding scenery are excluded. Original materials, embedded textures, scale and proportions are preserved; the arena is centered in XZ with its base at Y=0. Bounds are approximately 168.05 × 12.33 × 168.05 in imported units. No new interior floor was fabricated.

Original: **Tron 1982**, **jvouillon**, [Sketchfab source](https://sketchfab.com/3d-models/tron-1982-d7b1e9a03bca4bb6aa636b56ae45ec88), **CC BY 4.0**, as recorded in the source GLB metadata. Attribution is also embedded in the extracted root's extras. Reproduce with `node scripts/extract-light-cycle-arena.mjs` while Vite runs on port 5173. The script reloads the exported bytes and renders the preview. The original file is unchanged; this asset is not integrated into the game.

## Daniel Preti light cycle arena — September 23

[Converted GLB](preti_light_cycle_arena.glb) · [Overview](preti-light-cycle-arena-preview.png) · [Interior](preti-light-cycle-arena-interior.png)

Source: Daniel Preti's **TRON 1982 — Games Grid Lightcycles**, supplied locally in `TRON Game Sector+LightCycles-Obj`. This is a purchased model, not the CC-licensed jvouillon scene above; retain its seller license. The OBJ states meters. The isolated arena spans approximately 931.44 × 60 × 931.43 meters and is centered in XZ. It is an inspection asset, not yet integrated into gameplay.

The conversion retains Group2 arena walls and signage only, excluding Component_55’s modeled floor, exterior Group1 scenery, cycles and trails. The source uses large concave polygons: they are triangulated with Earcut while preserving winding. Original MTL diffuse colors are mapped to nonmetallic glTF materials; double-sided rendering retains SketchUp back faces. The modeled floor is omitted entirely. `src/rendering/arena-floor.js` renders a separate white-on-black grid on one plane, using the game’s 24-meter spacing, 0.10-meter line half-width, derivative antialiasing and distance fade. Other authored colors are retained. The absent `TRON___LIGHTCYCLE.png` texture belongs only to omitted cycles, so the arena has no missing texture dependencies.

Reproduce with `python3 scripts/prepare-preti-arena.py` (Python standard library plus the installed Three.js Earcut helper in Node), then `node scripts/preview-preti-arena.mjs` with Vite running. Chrome successfully reloads the standalone GLB and renders both views. The floor-free export contains 8,349 triangles and is 447,196 bytes, down from roughly 2.24 million triangles and 54 MB. The procedural grid is a runtime shader, intentionally separate from the GLB. Original OBJ/MTL files remain unchanged.

### Arena edge treatment

`src/rendering/arena-style.js` provides a reversible runtime material/edge adapter for the film reference. Walls use near-black fill and thin blue-gray outlines; authored `_23` symbols use deep purple fill and violet outlines. Geometry edges omit coplanar triangle diagonals. Depth-tested lines and a small polygon offset on the solid surfaces keep the outlines readable without showing through other walls. The adapter restores source materials and disposes its GPU resources when removed. Source GLB materials are unchanged.

`node scripts/preview-preti-arena.mjs` passed in Chrome with no page errors; overview and interior previews were inspected. It draws 6,329 edge segments over the 8,349-triangle arena. Reference frames live in `docs/references/images/cycle arena/`. This treatment is currently in the standalone preview, pending arena gameplay integration.

## Standalone Preti light cycles — September 24

The supplied Daniel Preti OBJ contains three complete bikes. Extracted [gold](preti_light_cycle_gold.glb), [blue](preti_light_cycle_blue.glb), and [red](preti_light_cycle_red.glb) GLBs retain their authored proportions and materials, with separate wheel details included and the old trails omitted. They are centered, grounded and face local -Z. Regenerate with `python3 scripts/prepare-preti-arena.py --cycle gold` (or `blue`, `red`). Original meter scale is retained in the files; the game adapter scales each bike uniformly to 3.6 m long.

These inherit the purchased arena asset's usage constraints and Daniel Preti attribution. The source references an absent `TRON___LIGHTCYCLE.png` texture on a small decal; that patch uses its source diffuse color. Gold and blue are loaded for the arena's two teams; red remains available as a separate model.

The cycle rendering adapter removes duplicate/degenerate faces and gently smooths export quantization while pinning material seams and hard edges. The tiny hub caps had centimeter-quantized coordinates and cracked sliver faces; they are reconstructed as smooth ellipsoids at measured source bounds. Source GLBs remain unchanged. Authored smooth normals are retained, blue is adjusted toward the film reference, and cycle-only ambient attenuation and a compact per-bike depth atlas provide directional shading and self-shadowing.

The original 158 MB arena OBJ was deleted at the user’s request on September 24 and is not stored in Git. The extracted GLBs, conversion scripts, material file and reference images are retained. Re-running the extraction requires restoring the purchased OBJ locally first.

## Arena signature archive — September 24

The four Daniel Preti signature/date inscriptions are preserved in `preti_arena_signatures.glb`, at their original arena coordinates. They are no longer in the runtime arena GLB. `python3 scripts/split-arena-signatures.py` reproduces the split from the converter output: 116 inscription meshes / 4,884 triangles archived; three architecture meshes / 3,465 triangles remain. Materials and author metadata are retained in both files.


## Double-turret boss tank

User-supplied `extra/double_turret_clu_light_tank.glb`: **Double turret Clu Light Tank** by **SpringSociety**, [Sketchfab source](https://sketchfab.com/3d-models/double-turret-clu-light-tank-83df27ea6c08441a809bb5376301d430), **CC BY 4.0**, from embedded metadata. Original GLB remains unchanged. Runtime adapter uniformly normalizes hull width to 6.5 m, turns forward to -Z, grounds the hull, replaces materials with dark blue-black armor and non-emissive red contour lines, articulates the twin-gun upper assembly, and adds paired muzzle flashes and projected shadows. Both projectile origins are measured from barrel-tip geometry. Four bosses patrol the central beam courtyard alongside the large-maze patrols; 12 health versus 3, with 3 damage per Clu shot, and 80% normal movement speed.

### Cycle inscription cleanup — October 5

The game and credits adapters omit the separate `DANIEL_PRETI` / `daniel_preti` signature/date meshes (29 per bike) from loaded light cycles. Original source GLBs, metadata and extended-credit attribution remain intact; no chassis or wheel meshes are filtered.
