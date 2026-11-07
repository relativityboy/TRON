OUTSIDE ARENA — FLOOR STUDY

Open /outside-arena-study.html in the local Vite server.
Orbit/pan/zoom, select camera presets, enable wireframe, or download the GLB.
The exported file is outside-arena-floor.glb. Rebuild with:
  node tools/studies/export-outside-arena.mjs

Scope: the floor only, following the user's November 5 direction. Square
recesses have four real side walls and a bottom; orange lines lie along tile
boundaries. There are no wall, vehicle or gameplay changes.

Source: user-supplied OutsideArena.m4v. source.json records source SHA256,
reference-frame timecodes and use constraints. Dimensions, repeat spacing,
depth and apron extent are estimates requiring user visual review.
Three.js ES modules; Y-up; meters; 3,560 triangles including grid strips.

APPROVED RESOURCE AND NEW WALL STUDY

The floor is approved, including 0.65 m grid lines. Its reusable GLB is:
  assets/source/models/outside-arena/floor.glb
Its manifest floor.json records the approval, provenance, hash, dimensions
and rebuild command. The shared procedural builder is floor.js.

Open /outside-arena-scene.html to review the next stage: the approved floor
plus a separate wall group built by scene.js. The wall's height, depth,
piers and doorway remain approximate and unapproved. Export separately:
  node tools/studies/export-outside-arena-scene.mjs
The floor-only page and its download remain available without the wall.
