---
title: Assets
subtitle: Model, sound, and dependency inventory
---

## Light cycle engine replacement — October 29

`public/assets/audio/cycle-drive.wav` and `cycle-drive-cabin.wav` now use the user's `/Users/steve/Desktop/light cycle sfx.mp4` 34–35-second selection (SHA-256 `b67a903e3246ce76a465d1497f100ebf29a1ed9a22d0c77e32b2f2251f0b3bd2`). A steadier inner grain at 34.425–34.775 seconds avoids the more obvious end-of-clip pitch movement. A 50 ms overlap and circular stereo-linked RMS leveling produce a 300 ms waveform loop repeated three times: 0.9 seconds, stereo 44.1 kHz PCM16. Both perspectives share this drone; their spatial routing remains independent. No spectral resynthesis. `tools/assets/prepare-cycle-drone.py` reproduces the edit; `public/assets/audio/cycle-source.json` retains per-clip provenance so unrelated event samples keep their original sources. Film-derived mixed soundtrack; rights remain with the source owners, no redistribution license supplied. No source video is shipped, no deployment.

## Big labyrinth blueprint — September 23

`docs/references/images/mazes/Big labyrinth.png` is a user-supplied reference; original author and license have not been provided. Its blue wall silhouettes were traced locally into polygon contours, simplified at one image pixel, scaled to 2.4 m/pixel and extruded to 54 m. The runtime uses generated geometry, not the raster texture. Source, tracing script and an SVG comparison are retained in the repository.



The tank and Recognizers are user-supplied Sketchfab GLBs; Sark’s carrier is a user-supplied JIHS Collada model converted locally to GLB. All are served locally with the application. Maze geometry is generated locally; vehicle/cannon audio uses short edits from the user-supplied film clip, with synthesized fallback and impact effects. No purchase was made. See [Models](../models/index.html) for source credits and adapter details.

| Asset | Source / author | Format and size | Use / attribution | Status |
| --- | --- | --- | --- | --- |
| Tank | arabinowitz / Sketchfab | GLB, 1.82 MB | Embedded Standard license; creator listing additionally says editorial purposes only | Imported and active |
| Recognizer | Shriker1 / Sketchfab | GLB, 128 KB | Embedded Sketchfab Standard license | Imported and active |
| Sark’s carrier | JIHS / TurboSquid; supplied by user | GLB, 6.86 MB, seven embedded textures | Listing Standard license; source readme retained | Background straight-line transit |
| Solar Sailer | JIHS; user-supplied TurboSquid DAE/readme | Local GLB, approximately 14 MB, seven embedded textures | Readme credits Syd Mead, Jean Giraud (Moebius), and Peter Lloyd for original design; redistribution terms are not stated in the supplied readme | Periodic background transit; no deployment performed |
| Maze slabs and surrounding grid | Fixed branching topology, oblique convex prism geometry | JavaScript / generated buffers | Original project implementation | Active |
| Tank movement and Recognizer flight/approach | User-supplied TRON scene | Three stereo PCM WAV loops, about 0.76 MB combined | Film-derived excerpts; source/timecodes below | Active, awaiting auditory review |
| Cannon | User-supplied TRON scene | Stereo PCM WAV, 102 KB | Film-derived excerpt | Active |
| Impact, destruction, missing-file fallback | Project Web Audio synthesis | Short oscillator/noise envelopes | Original synthesized effects | Active |
| UI and favicon | Project HTML/CSS; inline favicon path | Local Interface Raster terminal font derived from VT323; system fonts elsewhere | Original project implementation | Active |
| Terminal font | Peter Hull / [VT323 in Google Fonts](https://github.com/google/fonts/tree/main/ofl/vt323) | Local `public/fonts/VT323-Regular.ttf` | SIL Open Font License 1.1; retained in `public/fonts/OFL-VT323.txt` | Active |
| Film reference stills | User-supplied screenshots from the linked 1982 sequence | 15 PNGs in `docs/references/images/` | Study references; not used as runtime art | Inspected |
| Three.js | [Three.js](https://github.com/mrdoob/three), installed 0.186.0 | npm dependency, lockfile pinned | MIT; upstream license remains in package | Active |
| colvmn | [Steve Dekorte / colvmn](https://github.com/stevedekorte/colvmn) | Local documentation engine checkout | MIT; upstream license retained | Active for docs only |

## Evaluated external candidates

| Candidate | Creator | Published details | Decision |
| --- | --- | --- | --- |
| [Tank — Tron (1982)](https://sketchfab.com/3d-models/tank-tron-1982-b730d118f54b4a868339a4ddf11e09a7) | arabinowitz | Listing describes Blender/FBX files, about 58k triangles, free download, and editorial use. The listing's generic “Free Standard” label should not be substituted for reviewing the actual terms. | User supplied the GLB; imported and browser-tested. |
| [TRON Immersive](https://www.behance.net/gallery/236722545/TRON-Immersive) | Steve Talkowski | Creator presents tank and Recognizer work with embedded viewers. | Reference/candidate only; no download permission or usable distributable asset established. |

No paid candidate was selected and no purchase was made. Both GLBs load with GLTFLoader and uniform normalization; the original files remain unmodified.

The TRON names and film designs identify the user's reference. This inventory does not claim ownership of the underlying film property or permission to redistribute film assets.


## Historical replacement model shortlist — September 12

The user judged the second procedural pass closer but still inaccurate and requested internet models. Inspected the four public preview images below and queried Sketchfab's official metadata API. All four are marked downloadable. At the time of this initial search, no source mesh had been acquired or imported: an unauthenticated request to the official tank download endpoint returned `Authentication credentials were not provided.` The user subsequently supplied the two active GLBs above. Preserve the source archive and included license when downloading.

**Recommended first: Shriker1's pair.** The tank preview has a much better broad hull, offset canopy, triangular cannon supports, collar and recessed muzzle. The Recognizer preview has the articulated-looking shoulder construction, substantial body depth and inward feet. Both are described by the creator as custom-made and game-ready. That description and the polygon counts make them promising for the browser; materials, movable parts and final fidelity still need inspection in the source files.

| Model | Creator | Triangles | Published terms / formats |
| --- | --- | --- | --- |
| [Tron 1982 Tank](https://sketchfab.com/3d-models/tron-1982-tank-99f4ae8ce97445e8909c02d7481d12d9) | Shriker1 | 9,648 | Free Standard per official metadata; source formats not verified |
| [Tron 1982 Recognizer](https://sketchfab.com/3d-models/tron-1982-recognizer-ecb52608275c40a28d7d9dda1aed54f3) | Shriker1 | 1,854 | Free Standard per official metadata; source formats not verified |
| [Tank — Tron (1982)](https://sketchfab.com/3d-models/tank-tron-1982-b730d118f54b4a868339a4ddf11e09a7) | arabinowitz | 57,976 | Blender/FBX; listing says editorial use only |
| [Recognizer — Tron (1982)](https://sketchfab.com/3d-models/recognizer-tron-1982-897ad9061ab34a9885b8e874fe8a17e0) | arabinowitz | 8,080 | Blender/FBX; listing says editorial use only |

Sketchfab labels all four Free Standard; the arabinowitz descriptions additionally restrict use to editorial purposes. The current license page could not be fetched, so these are recorded listing terms, not completed license clearance. Metadata snapshots and public promotional previews are retained in `candidates/` for comparison; they are not runtime assets.

### Shriker1 tank preview

![Shriker1 tank promotional preview](candidates/99f4ae8ce97445e8909c02d7481d12d9.jpeg)

### Shriker1 Recognizer preview

![Shriker1 Recognizer promotional preview](candidates/ecb52608275c40a28d7d9dda1aed54f3.jpeg)

### arabinowitz alternatives

![arabinowitz tank promotional preview](candidates/b730d118f54b4a868339a4ddf11e09a7.jpeg)

![arabinowitz Recognizer promotional preview](candidates/897ad9061ab34a9885b8e874fe8a17e0.jpeg)

Also found [JIHS's TRON 1982 Tank on TurboSquid](https://www.turbosquid.com/3d-models/3d-tron-1982-tank-1811154), listed at $25, 49,152 polygons, with FBX/OBJ/glTF among the offered formats and an editorial-use restriction. It is a paid fallback; no purchase was made.


The simulation revision still uses the procedural vehicle models. Recognizers are uniformly scaled by 0.5 in the adapter; collision uses the same scale. Five instances and five independent spatial sound voices replace the single scripted craft. Maze roof/side geometry is generated from the same clipped convex polygons used by collision and visibility.

## Requested film audio pass

Source: https://www.youtube.com/watch?v=kKBuOtedf3E — “Tron (1982) - Clu infiltrates the Encom system,” uploaded by vson8, 199 seconds. Metadata was retrieved on September 13; both audio-only Opus and standard MP4 media downloads returned HTTP 403. No film audio was extracted or added. Existing synthesized effects remain active. Await a local copy before isolating tank movement, cannon shots and Recognizer motion.


## Local video sound extraction — September 13

The user supplied `docs/references/videos/1982 tron clu scene.mp4` (187.48 s, 44.1 kHz stereo AAC). This resolved the earlier YouTube download block. Selected cuts using exterior action frames and signal/spectrum inspection. Source audio is a mixed film soundtrack; these edits are not isolated production stems. No direct auditory assessment was available in this run, so speech/score contamination and subjective fidelity remain for user audition.

| Runtime sample | Local video in/out | Processing |
| --- | --- | --- |
| tank-drive.wav | Spectrum derived from 10.75–11.45 s | 5.94-second periodic engine bed reconstructed from the filtered film sample’s averaged spectrum. Randomized phases remove recurring source transients; original time-domain stereo is replaced by a compact emitter panned in-game. Rebuild with `scripts/smooth-tank-loop.py`. |
| recognizer-flight.wav | 124–126 s | 45 Hz high-pass, 6.5 kHz low-pass, 120 ms loop crossfade |
| recognizer-approach.wav | 126.20–128.40 s | Same filters/crossfade; mixed into pursuit and attack |
| cannon.wav | 121.38–121.76 s | 65 Hz high-pass, 12 kHz low-pass, 3 ms attack/70 ms release fades |

All retain two channels, receive DC removal and peak normalization to 0.72, and are stored in `public/audio/`. Rebuild with `python3 scripts/extract-sfx.py` (ffmpeg required). `public/audio/sources.json` records the input SHA-256, cuts and processing. Credits: TRON (1982) film soundtrack, supplied by the user for this local study; no redistribution license has been established. The full reference video is excluded from the static build.

[Sound audition](http://127.0.0.1:5173/audio.html) provides individual loops and a moving stereo Recognizer using the game's HRTF emitter. Each craft has two world-space emitters 4.8 m apart, independent loop offsets, distance attenuation, wall low-pass/attenuation and bounded Doppler playback-rate shifts. The listener follows Clu with camera orientation, rather than moving hundreds of meters away with the aerial camera.

Tank revision: the user identified dialogue in the original 70.80–73.20 s cut. Replaced it with a short opening texture from 10.75–11.45 s (0.58 s after crossfade), chosen using the opening frames and spectrum. Listening confirmation remains with the user. Recognizer and cannon WAV hashes are unchanged.


Cannon revision: shortened the film cut to 0.38 s around the first firing onset to reduce neighboring rapid-fire content, widened the passband, and removed random playback pitch. Inspected frames at 120.8–123.2 s and measured waveform onset at 121.38 s. This is still mixed film audio; listening approval is pending. Terminal clicks and access beep are synthesized approximations, not extracted movie sounds.


Camera-listener revision: all spatial listening now uses the camera, including its height and movement. The tank has an 18 m reference-distance stereo emitter, so zooming away attenuates its sound. This supersedes the earlier Clu-anchored listener description. The opening tracks Clu's live position while it starts at full speed; releasing W ends the initial throttle.


## Opening music

User-supplied `music/Tron/03 We've Got Company.mp3` plays once from the beginning when a run starts, including the opening zoom. It pauses with standby, resumes from its current position, follows the sound mute/master volume, and restarts on R. A single streaming media element feeds the audio mix at 55% gain. Vite packages this selected track; the documentation copy excludes the rest of the supplied album. Source: user's local TRON film soundtrack collection; no new redistribution license established.


Terminal keys now use four stereo excerpts from the first two seconds of the supplied local video, starting at 0.885, 1.395, 0.995 and 1.585 seconds. The latest revision trims each to 60 ms, lowers the low-pass cutoff to 6.5 kHz, and adds an early decay with a smooth 30 ms release to suppress the harsh trailing transient reported by the user. Samples alternate without immediate repeats; synthesized ticks remain a loading/failure fallback. The access beep remains synthesized. Audio context resume and music play are both requested directly during Return's input event, before any asynchronous yield.

## Carrier rumble

`scripts/extract-carrier-sfx.py` reproducibly extracts 116.2–120.2 seconds of the user-supplied carrier/solar-sailer video. `public/audio/carrier-rumble.wav` is stereo PCM, 44.1 kHz, 3.6 seconds after a 0.4-second loop crossfade, DC removal, 35–900 Hz filtering and peak normalization to 0.65. Provenance/hash and processing are in `public/audio/carrier-source.json`. This is a mixed film soundtrack excerpt, not an isolated vehicle stem. Auditory approval remains pending; the assistant has not listened to the sample. In-game it uses stereo HRTF placement, camera distance attenuation, distant low-pass filtering and Doppler following the carrier's world position. The master mute/standby gate applies.


September 14: eight ground enemies reuse arabinowitz's supplied tank GLB, normalized geometry, surface materials and cannon sample. Each clone has independent turret/recoil transforms and red insignia. Source assets are unchanged; no additional models were downloaded.

### September 14 Recognizer sound revisions

Re-cut `recognizer-flight.wav` from exactly 2:04–2:06 of the local `1982 tron clu scene.mp4`; stereo PCM with the existing 120 ms loop join (1.88-second playback). Added `recognizer-explosion.wav` from 3:06–3:07, a one-second stereo effect with short edge fades, 45 Hz high-pass and 12 kHz low-pass. Recognizer destruction plays it through two world-space HRTF emitters; tank destruction retains its existing sound. Both excerpts are available on `/audio.html`. These remain mixed film soundtrack excerpts, not isolated sound-effect stems.

Correction: the 3:06–3:07 selection contained terminal typing. `recognizer-explosion.wav` now uses video time 1:47.84–1:48.69 (0.85 seconds), aligned with the visible explosion before the cockpit cut. Recognizer excerpts are now extracted from the user-supplied M4A. Full decoded PCM comparison found that M4A equals the video audio after trimming its first 2112 frames (47.89 ms); the extraction script compensates for this offset and records source/seek per sample. The game and audition page request version 2 of the explosion to bypass the previous cached audio.

The supplied `Recognizer Explosion.m4a` edit matches video time 113.207 seconds (normalized waveform correlation 0.997). `scripts/clean-recognizer-explosion.py` uses surrounding soundtrack context and shared-stereo harmonic/percussive masks to suppress sustained tonal ridges. It generates original/balanced/strong audition WAVs under `public/audio/studies` and a provenance manifest. Requires NumPy/SciPy (installed only in a temporary environment). This is approximate suppression: overlapping cannon/explosion energy cannot be reliably separated by this method, and stronger masking loses transient detail. Listening comparison is pending.

## Sound resource library

[Open the sound library](../sounds/index.html) for downloaded Syna-Max recreation previews, existing film edits, cleanup candidates, verified stock-effect catalog IDs and vendor metadata exports. The shelf preserves inactive resources, author/source links and licensing notes for this personal-use project. `docs/sounds/catalog.json` is the editable inventory; `scripts/build-sound-library.mjs` regenerates its page during the docs build. Public MP3 previews are clearly distinguished from original downloads and unacquired commercial-library audio.

### MCP closing dialog

`docs/references/dialog/END OF LINE.mp3` is the user-supplied MCP “END OF LINE” film dialog (1.28-second MP3). It plays once as the terminal starts typing the final sign-off. Imported directly through Vite and decoded into Web Audio; no edits to the source recording. Source: Disney's 1982 TRON, supplied by the user for this fan tribute.

### Embedded terminal raster font

`public/fonts/InterfaceRaster-Regular.ttf` is a modified VT323 font, renamed **Interface Raster**. Each of 582 glyphs retains its original monochrome outline and adds COLRv0 layers: bright pixels plus 15-unit bands at 68% brightness within each 80-unit source pixel row. The two embedded palettes match terminal blue and sign-off red. This replaces the screen-space scanline mask, keeping the dim bands aligned through typing, resizing, and sentence fades. The CSS cursor receives a matching dim-band treatment.

Based on Peter Hull's VT323 under SIL OFL 1.1; original notices remain in the font and `public/fonts/OFL-VT323.txt`. Rebuild with `uv run --with fonttools==4.65.0 --with skia-pathops==0.9.2 python scripts/build-terminal-font.py`. No extra dependencies are needed to run the game.

## Debris physics

Rapier 3D (`@dimforge/rapier3d-compat` 0.20.0), by Dimforge, Apache-2.0. The local npm package includes WebAssembly; no runtime CDN is required. Used for vehicle debris only. [Source and license](https://github.com/dimforge/rapier).

## Procedural pad teleport cue

`src/audio/teleport.js` generates original deterministic stereo PCM buffers at the browser sample rate. Authored in this project; no external recording, model or asset was used. A descending FM sweep collapses into a short digital transient, followed by a rising inharmonic shimmer and short stereo echo. Departure lasts 0.28 seconds, arrival 0.62 seconds; Clu's combined transition lasts 0.78 seconds. Buffers are cached and reused; one-shot nodes disconnect on completion/reset. This is an original game sound, not a claimed recreation of a film sample. `node tests/teleport-audio.mjs` writes a standalone listening preview to `test-results/teleport-preview.wav`.

## ENCOM terminal mark

`public/images/encom-terminal.svg` is a project-authored vector approximation of the ENCOM mark visible in the user-supplied original-film still `docs/references/images/MCP terminal.png`. Paths and glow styling were authored locally; no external font or logo asset is loaded. The underlying film branding is not an original project design; no additional license is asserted.

## Cycle arena entrance audio — September 28

`scripts/extract-arena-entry-sfx.py` extracts four local WAVs from the user-supplied `docs/references/videos/Enter Cycle Arena.m4v`. `public/audio/cycle-entry-source.json` records source hash, exact cut boundaries, channel selection and processing. Dialogue uses the 5.1 center channel (11.72–14.28 s and 17.32–18.65 s); transport uses the stereo downmix at 14.28–17.32 s and startup at 28.35–31.408 s. All use short edge fades, 60 Hz high-pass filtering and peak normalization to 0.72. These are TRON (1982), Walt Disney Productions soundtrack excerpts; no redistribution license was supplied. Transcription located dialogue boundaries; subjective listening approval remains pending. The full source video is not included in the game build.

## MCP conversation face — October 9

`docs/references/images/MCP/MCP.png` is the user-supplied TRON (1982) film still, attributed to Walt Disney Productions; no redistribution license was supplied. `src/mcp/face.js` maps this original onto a subdivided plane, trims the screenshot border through texture coordinates, and deforms the mouth/jaw during synthesized speech. No replacement image was generated. Movement was informed by the user-supplied `docs/references/videos/MCP/MCPandSARK.m4v`; the video is not bundled in the game. Speech now uses a reference-conditioned MCP clone through Chatterbox, with no browser voice fallback.


## MCP cloned speech — October 9

`public/audio/mcp-reference.wav` contains only MCP speech from 23.23–31.08 seconds of the supplied `MCPandSARK.m4v`, extracted from the 5.1 center channel. `scripts/extract-mcp-voice.py` records exact filtering, transcript, source hash and film attribution in `public/audio/mcp-reference.json`. Residual soundtrack may remain; this is not a claim of studio-isolated dialogue. The film source is TRON (1982), Walt Disney Productions; no redistribution license was supplied.

`public/audio/mcp-clone-preview.wav` is newly synthesized dialogue conditioned on that reference, not a film dialogue excerpt. Its adjacent JSON records text, pinned model revision, duration and generation time. Chatterbox by Resemble AI is MIT licensed; the ONNX conversion is `onnx-community/chatterbox-ONNX`, revision `3cab09af388d3f02bba43443fce88c1f4525ac43`, run through Transformers.js 4.3.1 (Apache-2.0). Model weights download only in MCP and remain in the client's IndexedDB cache. The application uses the library's Chatterbox interfaces; no code was copied from the demonstration app.

## Cycle roster renders — October 10

`public/images/cycle-roster/{gold,blue,red,green}.png` are transparent orthographic top-down renders of the existing Daniel Preti light cycle asset, including the same geometry repairs and team materials used in play. The front faces upward. Source attribution and use constraints are unchanged from the underlying cycle model. Regenerate with `node scripts/render-cycle-roster.mjs` while the local Vite server is running; these static thumbnails add no runtime 3D rendering loop.

## MCP same-dialogue comparison — October 10

`public/audio/mcp-match/` contains the film reference excerpt, newly synthesized matching dialogue, and processed pitch/reverb candidates. `comparison.json` records the transcript, model, measurements, processing search and limitations. `scripts/match-mcp-voice.py` produces the normalized listening files used by `public/mcp-voice-comparison.html`. The original retains the film attribution and constraints above; the other samples are synthesized, not original actor recordings. Objective pitch/tail measurements are an aid to listening, not proof of a perceptual match.

## MCP dot-matrix lettering

`public/fonts/MCPDotMatrix-Regular.ttf` is an original local dot-matrix font,
inspired by the user's supplied “END OF LINE.” film reference. Its geometric
5×7 glyph patterns and round dots are generated by `scripts/build-mcp-font.py`
with FontTools. No existing font outlines or film pixels are embedded. Glyph
design is dedicated to CC0 1.0; the license accompanies the font. Only MCP uses
this typeface, with one shared size and normal/dim blue text colors.

## POV-Ray light-cycle experiment — October 12

The game and `raycast-cycle.html` study adapt **Carl N. Hoff's** solid-geometry light cycle from [Jason Cox's POV-Ray scene](https://github.com/jasonacox/lightcycle-povray). Unmodified source, repository MIT license (Jason Cox, 2019), provenance and adaptation notes are retained in `docs/models/povray-lightcycle/`. The browser shader transcribes the model's 54 primitives and Boolean operations, changes coordinates/scale, and substitutes experiment lighting and the game's grid. It does not import the original scene's reflective floor, animation or trails. A submillimeter surface-priority tolerance stabilizes the window/roof boundary in GPU float precision. The CSG model is the default cycle renderer and credit preview; the original mesh remains the fallback. The CSG intersection kernel is project-authored; Three.js supplies WebGL and post-processing.

## Retired grid cloud asset

The grid cloud is no longer loaded or shown in the game or credits. The retained study files were extracted from [Tron 1982 by jvouillon](https://sketchfab.com/3d-models/tron-1982-d7b1e9a03bca4bb6aa636b56ae45ec88), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), centered and converted to game coordinates. This records provenance for the archived asset.
