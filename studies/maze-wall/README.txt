MAZE WALL — STANDALONE REVIEW STUDY

Open /wall-study.html on the Vite development server (normally port 5173).
The page is now an iterative modeling workshop: type a correction and press
Enter; drop reference images; select a part to clarify the target; restore old
revisions or export the current GLB. Submissions use the local Codex sign-in.
Local state is saved under .local/wall-studio/, outside the game.
See the root README for setup and verification.
The GLB can also be imported directly into Blender or another glTF viewer.
Rebuild: node tools/studies/export-maze-wall.mjs

Source: user-supplied original 1982 TRON film frames:
references/film/images/mazes/Maze Details.png
references/film/images/mazes/Maze Top 2.png
Film imagery remains its respective rights holders' work and is used as local
study reference only; it is not embedded in the GLB. No film texture was copied.
Model geometry was authored procedurally for this project from these references.

Units: meters. Y-up. Origin: center of the slab at ground height.
Provisional dimensions: 108 m long, 24 m deep, 54 m high.
The current starting design uses 19 simple parts / 268 triangles.
No textures, external dependencies or lights embedded in the GLB.
Standard PBR materials: matte dark blue sides, muted blue roof and ledge bevels.
Lighting and floor belong to the preview only. Canyon repeats the same slab.

This is an inferred wall study, not a reconstruction of the entire shot or maze.
Film dimensions, hidden structure and precise panel depths are unknown.
No gameplay imports, collision changes, deployment or integration.

Browser validation: headless Chrome, macOS arm64; GLB loaded and detail/whole/
canyon views rendered without page errors. Captures: detail.png, whole.png,
canyon.png. The original geometry was rejected; it remains only a starting point for
user-directed corrections. The workshop itself has passed browser and live
Codex feedback-loop checks; see docs/validation/_index.md.
