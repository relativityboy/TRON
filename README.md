# TRON

An open-ended Three.js/WebGL simulation inspired by the 1982 film: explore a diagonal, branching maze while five autonomous Recognizers wander, observe, pursue sightings and search when they lose you. There is no timer, assigned route, capture meter or win/loss screen. All simulation, graphics and audio run in the browser.

## Play locally

Requires patched Node.js 22.23.4+ (22.x) or 24.22.1+ (24.x) and a desktop browser with WebGL 2. WebAssembly is optional: restricted browsers use simpler JavaScript debris motion and scenery collisions. Debris-to-vehicle impact damage requires the Rapier backend; normal vehicle control and weapon damage do not.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. Enter completes the typing terminal; Enter again starts the simulation. Reduced-motion preferences reveal the text immediately.

| Control | Action |
| --- | --- |
| W / Up | Accelerate |
| Shift+W | Latch throttle; W cancels |
| S / Down | Brake, then reverse |
| A/D / Left/Right | Steer, including turning in place |
| J / L | Turn turret left / right |
| F | Smoothly level gunner aim with the ground; I/K interrupts |
| Space / left click | Fire; hold to repeat |
| C (hold) | Rear view |
| V | Toggle aerial view |
| P | Toggle stabilized first-person gunner view |
| O | Cycle gunner zoom: 1× / 2× / 4× / 8× |
| I / J / K / L | Gunner aim: up / left / down / right; slower when zoomed |
| Scroll wheel / two-finger scroll | Zoom aerial view (also while paused) |
| Tab | Toggle maze survey; does not reveal aircraft knowledge |
| H | Toggle instruments (hidden by default) |
| Escape | Pause/resume and settings |
| R | Reset Clu and all aircraft |
| M | Mute/unmute |
| T | Ten-second turbo boost (2.5× normal top speed; available once per minute) |
| Shift+T | Development tuning, only when opened with `?tuning=1`; Close or Escape dismisses it |

The barrel stays level. Bullets assist only height when the manually aimed cannon aligns with an unobscured Recognizer. Shots and sight lines are blocked by the same diagonal walls that constrain the tank.

Each aircraft begins outside the maze and maintains its own observations. Radio messages are delayed, range-limited copies of sightings; they do not refresh old information. After losing sight, a craft predicts a short continuation of the last observed motion, investigates and searches, then forgets stale sightings. It cannot consult Clu's hidden position. Aircraft use separate spatial audio sources, muffled by intervening slabs.

The maze is a reconstruction study based on the supplied frames, not an exact recovered film map. Models remain procedural; inspected internet replacements are documented but not yet acquired. Recognizer legs are approximately 9 m / 30 ft following the user's scale estimate.

## Local wall workshop

Run `npm run workshop` and open <http://127.0.0.1:5190/wall-study.html> for a fixed workshop address. The page is also available at <http://127.0.0.1:5173/wall-study.html> with a current `npm run dev` server. Orbit the model, optionally select a part, type a correction and press Enter. Shift+Enter inserts a newline. Drop PNG/JPEG/WebP references into the page; checked references and a capture of the current view accompany the correction. Each submission starts a separate local `codex exec` request using your existing Codex sign-in and configured model, and consumes that account's normal usage. Run `codex login` if needed; no additional API key is required for a ChatGPT-authenticated CLI.

The editor returns validated boxes and polygon-profile extrusions, capped at 48 parts / 1,500 triangles. It does not edit game code. Successful revisions and reference images persist under ignored `.local/wall-studio/`; previous versions can be restored, and the displayed model can be exported as GLB. Cancelled, failed or timed-out requests retain the previous model. Reference files stay on this Mac until selected images are submitted to Codex. The development server only exposes this editor on localhost; it is not part of the production site or `npm run preview`.

The source starting model is `studies/maze-wall/design.json`. `node tools/studies/export-maze-wall.mjs` exports the latest local workspace model (or the starting design when no workspace exists) to `studies/maze-wall/maze-wall.glb`. The earlier procedural wall remains an unapproved starting study, not a fidelity target.

The outside-arena scene uses the same prompt UI at <http://127.0.0.1:5190/scene-workshop.html>. Its current walls, single-material lighting and film references are preloaded. Prompts adjust wall proportions, bays, doorway and lighting while preserving the approved floor resource. It has independent history under `.local/outside-arena-studio/`, restore/cancel and scene GLB export; the maze-wall workspace remains separate. Changes outside the available wall/lighting parameters are reported as unsupported rather than silently claimed.

Workflow checks: `node --test tests/unit/wall-studio.test.js` and `node tests/browser/wall-workshop.mjs`. The browser check uses a controlled editor and a temporary workspace. `TRON_STUDIO_LIVE=1 node tests/browser/wall-workshop-live.mjs` explicitly opts into one real Codex revision in a temporary workspace.

## Build and verification

```sh
npm test
npm run build
npm run preview
```

Production preview: <http://127.0.0.1:4173>. The `dist/` folder is a static site with local fonts and documentation. No backend or external runtime services are needed.

With the dev server running and Google Chrome installed:

```sh
npm run test:browser
npm run test:browser -- --terminal
npm run test:browser -- --soak --duration=180
```

The smoke check exercises entry and branch driving, turret controls, five agents/audio sources, pause, radio/sighting memory, shooting and repeated resets. The sustained test steers through connected passages using actual keyboard events and checks collision, errors and resources. Screenshots/reports go to ignored `test-results/`.

`npm run test:browser -- --lifecycle` checks focus, settings, WebGL failures and production startup; both dev and preview servers must run. `--compat` checks available Playwright Firefox/WebKit executables. Actual Safari verification remains separate.

See [validation](docs/validation/_index.md), [assets](docs/assets/_index.md), [references](docs/references/_index.md), [Goal.md](Goal.md) and [the plan](docs/_index.md).

## Documentation

The plan is `docs/_index.md`. Generate HTML with [colvmn](https://colvmn.dev):

```sh
npm run docs
```

The project generation wrapper runs colvmn and embeds its stylesheet in each generated page. This keeps local `file://` pages styled even when Safari blocks sibling-folder resources. Edit the Markdown/JSON sources and run `npm run docs`; never edit generated HTML. The upstream colvmn checkout remains unchanged.

The engine is a local checkout in `docs/colvmn`, installed from <https://github.com/stevedekorte/colvmn> at revision `1b2612e52b3a17d6778785dbdfeeab147af1f941`. To restore it if absent:

```sh
git clone https://github.com/stevedekorte/colvmn.git docs/colvmn
git -C docs/colvmn checkout 1b2612e52b3a17d6778785dbdfeeab147af1f941
npm run docs
```

The project is hosted in the private `stevedekorte/TRON` repository. Clone with submodules:

```sh
git clone --recurse-submodules https://github.com/stevedekorte/TRON.git
```

colvmn is pinned as a Git submodule at the revision above. For an existing checkout, run `git submodule update --init --recursive`.

Visual comparison studio: http://127.0.0.1:5173/reference.html (development server). Four fixed reference views and an overlay slider share the game renderer. Capture them with `node tests/reference.mjs`.

Default traced layout: http://127.0.0.1:5173/?maze=blueprint. The blueprint now loads by default; use /?maze=authored for the original. Compare with the supplied blueprint at /reference.html?maze=blueprint&shot=blueprint; editable pixel outlines live in src/levels/blueprint-outlines.js.

Sound audition: http://127.0.0.1:5173/audio.html. Headphones are useful for the Recognizer flyby. Rebuild extracted samples with `python3 scripts/extract-sfx.py`; source credits and timecodes are in docs/assets/_index.md.

### Website deployment

The dekorte.com Pages workflow checks out the pinned `fun/TRON` revision using its `TRON_DEPLOY_KEY` secret (a read-only deploy key for this repository), runs `npm ci` and `npm run build`, then publishes `dist` at `/fun/TRON/`. Push TRON changes, update the website submodule pointer, and push the website to deploy. The Vite relative base supports both root hosting and subdirectory hosting. `tests/production-path.mjs` checks a static build at that path; set `TRON_URL` to test the live site.

## Isolated Codex and browser tests

Development servers leave the running game intact when source files change.
Refresh the browser when you want to load edits. For automatic reload instead,
start the native server with `TRON_HMR=1 npm run dev`.

The container launcher gives Codex and its subprocesses access to this checkout
without mounting your Mac home directory, SSH agent, or Docker socket. TRON is
the **only host-folder bind mount**, at `/workspace`. Linux dependencies and the
container home (including Codex login and session history) use separate Docker
volumes. The container runs as an unprivileged user, with a read-only image
filesystem, no added capabilities, and private temporary/shared memory. Network
access is enabled for Codex and dependency downloads.

Docker Desktop must be running. From this folder:

```sh
scripts/codex-container build   # Already built during setup; repeat after image changes.
scripts/codex-container login   # One-time Codex device login; follow its browser instructions.
scripts/codex-container         # Start a new Codex session inside the container.
```

Codex runs with `--sandbox danger-full-access --ask-for-approval never` **inside
this container**: Docker supplies the filesystem boundary. The launcher does
not grant those permissions to a Codex process running directly on your Mac.
Existing host sessions and credentials are not copied; `scripts/codex-container
resume --last` resumes the last *container* session after one exists.

Both historical test servers start automatically at container ports 5173 and
5174. During an interactive session or shell, open
<http://127.0.0.1:5183> on your Mac (5184 forwards the second server). These
loopback-only host ports avoid the existing native development server. Exiting
the session removes that container and its servers; source edits, dependencies,
login and history persist. There is no background privileged Docker agent
inside the container.

```sh
scripts/codex-container test                       # Isolation, WebGL, tests, build
scripts/codex-container run node tests/wall-shadow-edges.mjs
scripts/codex-container shell                      # Interactive Linux shell
```

The test command does not require Codex login. Reports and captures are written
to `test-results/` in this checkout. Chromium renders through SwiftShader in the
container; its performance is not representative of native Mac GPU rendering.
The full-game container regressions use reduced motion and lower render scale.
Browser fixtures accept `TRON_BROWSER_CHANNEL`; the container selects bundled
Chromium, while native runs retain Google Chrome as their default.

Image/configuration: `containers/codex/`. The image's Playwright version must
match `package-lock.json`; rebuild if that dependency changes. The entrypoint
refreshes the isolated Linux dependency volume when the package files change.
Do not mount the Docker socket or additional host directories if you want to
preserve the folder-only host-file boundary.

References: [Codex containers](https://learn.chatgpt.com/docs/agent-approvals-security#run-codex-in-dev-containers),
[device authentication](https://learn.chatgpt.com/docs/auth),
[Playwright containers](https://playwright.dev/docs/docker).

### Optional tactical enemies and Jev

Design and API contract: [Jev enemy control](docs/jev/_index.md).

The game now starts in **Tactical + Jev** with the full enemy population (small encounter disabled). To change modes, open the dev game with **?tuning=1**, press **Shift+T**, choose **Enemy AI**, then click **Apply AI and restart**. Your selection persists; earlier experimental preferences are reset once for this new default:

- **Classic** restores the original controller, roster and pursuit reinforcements. It makes no AI requests.
- **Tactical — local** uses oriented, swept aircraft clearance, staged turns/descents and a bounded corridor planner. Units choose withdrawal, regrouping, pressure, wall-side strikes or cover from local scores. It needs no key.
- **Tactical + Jev** gives the same maneuver options, explicit routes and outcome measurements to Jev. The local controller still executes movement and checks collisions. Network failures, expired replies and answers below the confidence threshold retain local control and are labeled in the panel.

The **Small tactical encounter** checkbox starts two Recognizers and one ground tank. Tactical modes disable repeating pursuit reinforcements regardless of roster size. Applying a mode starts a fresh run; the choice persists in local browser settings. Tactical restarts use simulation seed 1982; maze placement remains the layout established for that page session. The expanded **Latest AI decision** panel shows the observation snapshot, route choice, probabilities, acceptance and wall-clock latency. `aiConfidence` is adjustable in tuning (default 0.25); detailed movement constants are in `src/game/tactical.js`.

The local Vite server reads the key from `TYPESAFE_API_KEY` (including `.env.local`) or, if absent, the single raw key in `credentials/Typesafe.txt`. Restart Vite after changing credentials. The environment file is ignored by Git; `credentials/Typesafe.txt` is tracked with git-crypt encryption. Both locations are denied by the development file server. Locked checkouts ignore the encrypted credential and use local AI fallback unless a server environment key is provided. Never put the key in a `VITE_` variable. `.env.example` documents the optional model setting. The existing credential file has been connected; no key needs to be pasted into the game.

Only units whose fresh sighting/radio memory or unknown sound estimate is within one maze length request Jev decisions. Distant or unaware units use local tactics. Enemies hear nearby engines and more distant cannon fire, impacts and explosions; walls muffle sounds and reports carry uncertain bearing/range estimates. Hearing permits investigation, not a confirmed target fix. Range controls are in Shift+T when the dev page is explicitly opened with `?tuning=1`.

Requests go through the same local server at `/api/jev/decision`. Direct browser access was checked: TypeSafe rejected CORS preflights for the tested localhost/127.0.0.1 origins. The relay is therefore required for this browser setup; it sends requests directly to TypeSafe without an additional AI layer. There is one in-flight request, at least 600 ms between starts, a 2.2-second server timeout, and a $1 USD rolling-hour local spending budget (set server-only `JEV_HOURLY_BUDGET_USD` in `.env.local` and restart Vite to change it). Local clients space calls by at least 650 ms of wall time. This game-owned cap is separate from purchased JEV credits. The browser retries failures with backoff. No calls are made while paused or in Classic/local mode. Late replies after pause, restart or teleport cannot change a vehicle's active maneuver.

`npm run dev` and `npm run preview` provide the local relay. Public builds set `VITE_JEV_API_BASE` to the Cloudflare Worker URL below. Without that build setting, static hosting falls back to local tactics.

Verification: `node --test tests/tactical.test.js tests/jev.test.js`; `node tests/tactical-browser.mjs` uses a mocked unavailable-provider response and defaults to the isolated server at port 5175 (`TRON_URL` overrides it). `node tests/tactical-browser.mjs --live` additionally permits exactly one real provider request and requires the configured server key. Neither browser test prints or reads the key.


### Public Jev relay (Cloudflare)

The public game is served at https://dekorte.com/fun/TRON/. Its build sets `VITE_JEV_API_BASE=https://tron-jev.tron-canyon-run.workers.dev`; this is a public address, never a credential. Local Vite still uses its own relay by default.

Worker source lives in `workers/jev/`, with configuration in `wrangler.jsonc`. Authenticate with `npx wrangler login --device`, validate with `npm run worker:check`, and deploy with `npm run worker:deploy`. Store or rotate the provider key using `npx wrangler secret put TYPESAFE_API_KEY < credentials/Typesafe.txt`. Subsequent deployments preserve the secret. Cloudflare credentials stay outside the repository; local `.dev.vars` and `.wrangler` files are ignored and denied by Vite.

The website Pages workflow must set the public API base during its Build TRON step. Push this repository, update the website's `fun/TRON` pinned revision, then push the website to publish a new client. Worker changes are deployed separately.

Anonymous access is intentional. Allowed browser origins are dekorte.com and www.dekorte.com. Origin checks are not authentication: a non-browser caller can imitate them. One persistent SQLite Durable Object enforces the spending guard across Worker instances: 1,000 requests and 16 MB of serialized provider input per UTC day, 300 requests per IP per day, 60 per IP per minute, at least 750 ms between requests, one in-flight request per IP and four globally. Failed provider calls consume budget. Daily keyed IP hashes are retained instead of raw addresses; shared networks share an allowance. Client snapshots and secrets are not stored by the budget object.

These are request/byte caps, not a guaranteed dollar cap. Limits are intentionally conservative for an initial public trial. Change the named variables in `wrangler.jsonc` and redeploy to tune them. Set `JEV_ENABLED` to `false` to disable public provider calls. The client honors Retry-After and runs local tactics during errors, rate limits and exhausted allowances. Quotas persist across deploys; do not delete the Durable Object to reset them accidentally.

AI calls renew their ten-second concurrency lease every three seconds until the provider response body completes. Renewal does not consume quota. Failed renewal aborts the provider request; completion/failure stops renewal and releases the slot. This applies to the longer MCP chat and speech requests as well as JEV decisions.

Public multiplayer and Vite preview allow three simultaneous connections per IP and twelve admitted connections per rolling minute, including reconnects. Cloudflare uses `CF-Connecting-IP`; preview uses the TCP peer address and ignores forwarded headers. Disconnect/error releases a slot, but reconnect history remains for the rest of its minute. These short-lived raw IP counters stay in arena memory and are not logged or written to storage. Vite development is exempt so local multi-client tests can use one IP. Networks sharing a public IP share these limits.

### Clu autoplay and spatial teleporters

Clu autoplay is temporarily disabled (`CLU_AUTOPLAY_ENABLED=false`). U, Shift-U, the autoplay button and Clu JEV statistics are unavailable. The descriptions below document the retained implementation for future reactivation. Clu I/K camera zoom now works only in V aerial mode.

Press **U** or click the top-left autoplay button to let Jev choose Clu's maneuvers. Autoplay stays enabled until U or the button is toggled again. Held driving/turret inputs temporarily override those channels; manual firing leaves automatic driving active. Camera/aerial controls remain available for watching. The button shows Jev versus local control; service failures disengage autoplay until explicitly re-enabled. Player and enemy decisions share the same request limits. Public deployment of this feature requires both the updated Worker protocol and website client.

Teleport pads now act as invisible boxes four maze-wall heights tall: parts inside become wireframe, full entry transfers immediately with momentum/heading/relative offset intact, and parts regain solidity as they exit the destination. Full exit rearms the destination pad. Reinforcements keep their original materialization sweep.

Autoplay continues when the window loses focus or its tab is hidden. Manual play still pauses on focus loss, and Escape pauses either mode. Hidden tabs skip rendering and use a timer for fixed-step simulation; browsers or the OS can still throttle/suspend background tabs. JEV budget and failure disengagement remain active.

The top-right JEV readout shows requests this round, requests/sec over the last ten seconds and USD cost (~ means some usage is estimated). Timeout failures get two retries before autoplay disengages; quota and other service errors still disengage immediately.


## Reproducible scenarios and cleanup checks

Use `/?maze=blueprint&layoutSeed=1982&runSeed=1982` (or `maze=authored`) to replay the same layout and encounter. Restart reuses that scenario seed. Browser preferences still select the AI mode.

`node scripts/replay-autoplay.mjs` runs an enemy-free local-controller replay without JEV calls and writes route diagnostics to `test-results/autoplay-replay.json`. Optional flags: `--layout`, `--layout-seed`, `--seed`, `--seconds`, `--output`. The later-maze hold remains a known issue.

`npm run test:browser -- --refactor` checks pause, view modes, detached debug state and restart resource counts. See `docs/refactoring/_index.md` for current ownership and `docs/validation/_index.md` for measured coverage and remaining human checks.

### Installable web app

Production builds include a scoped web app manifest and service worker for ENCOM TERMINAL. Serve `dist` over HTTPS (localhost also works), then use your browser's install/Add to Home Screen command. The application opens in a standalone window. CLU uses desktop keyboard and mouse; Light Cycles also provides mobile touch controls.

On the first online visit, the worker downloads approximately 49 MiB of local game code, models, fonts and audio. Once installation completes, both game modes can launch offline. Remote Jev services and uncached documentation still require a connection. New releases wait until all game windows/tabs using the old worker close; the next launch uses the update. Only this game's scoped caches are cleaned up. Vite development does not register the worker.

`npm run build` generates the offline asset list and content revision after assembling the game. `node tests/pwa.mjs` serves the production build under `/fun/TRON/` and checks Chrome installability, icons, offline starts, audio byte ranges, and waiting updates. The PWA icon uses the compact E-and-outline mark in `public/images/encom-app.svg`, centered on a dark square with mask-safe padding. Icon generation updates content-versioned PNG/SVG URLs in the manifest and HTML so installed browsers can detect artwork changes. Run `node scripts/generate-app-icons.mjs` to regenerate the 180, 192 and 512 pixel PNGs.

### BIT program

Select **BIT** from the terminal to open the integrated program in `public/bit`. Bit requests microphone access automatically on entry; grant the browser permission prompt to begin. Escape returns to program selection. The copy preserves the original MIT license and assets while removing the standalone server, stored-key dialog, obsolete code variants and separate PWA. The original sibling project is left intact.

Bit uses the same private, budgeted Jev relay as the game. Both local and Worker protocols accept `{controller: "bit", question: "..."}` with a 1,000-character limit and fixed yes/no/unsure choices. Deploy the updated Worker alongside the client to enable public answers. Browser speech recognition and AI answers need network access; static Bit assets are available offline. `node tests/bit.mjs` tests entry, mocked speech/answers, repeat entry and Escape without live AI charges.

Video references were removed from the working tree and Git history. Video files are ignored at every path, including uppercase extensions. Extraction tools require separately supplied inputs under ignored `.local/reference-videos/`; no footage is bundled. Do not merge old pre-cleanup clones into the rewritten history.


### Encrypted JEV credential

`credentials/Typesafe.txt` is encrypted in Git using [git-crypt](https://github.com/AGWA/git-crypt). Install git-crypt before editing this file. On an authorized clone, run:

```sh
git-crypt unlock /secure/path/TRON.key
git-crypt status -e
```

The recovery key for the original workstation is stored outside the repository at `~/.config/git-crypt/TRON.key` (owner-only permissions). Back it up in a password manager or another secure location; never commit or publish it. Unlocking leaves the working copy readable locally, while Git stores ciphertext. Filenames remain public. Public clones and static builds do not need the recovery key; production JEV continues using the Cloudflare Worker secret.

Encryption rules must be present before staging credentials. Only `Typesafe.txt` and `Gemini.txt` are allowed through the credentials ignore rule; other local credentials remain ignored. Do not place credentials in `public/`, client code or `VITE_` variables. git-crypt does not remove secrets from older commits; this credential was not found in the checked prior history.

### MCP conversation

The home menu's **MCP** option opens `mcp.html`: the supplied film face, animated mouth/jaw, browser speech recognition, a short conversational reply, and in-browser cloned MCP speech (with browser text-to-speech as a fallback). Typed input also works. Microphone permission and browser speech support are required for voice input; speech recognition may use the browser vendor's online service. Recognition stops during replies to avoid hearing the synthesized voice. Stop cancels the request/speech, and Escape opens the home confirmation. Conversation history is memory-only and clears on leaving.

MCP needs a generative chat provider; JEV's choice API cannot supply dialogue. Configure `MCP_CHAT_URL` (the full OpenAI-compatible chat-completions endpoint), `MCP_MODEL`, and `MCP_API_KEY` in ignored `.env.local`, then restart Vite. A locally hosted compatible server may omit the key. The default provider is Gemini 3.8 Flash (`gemini-3.8-flash`) through Google’s OpenAI-compatible endpoint. Set `MCP_API_KEY` to your Gemini API key; the URL and model only need setting to override those defaults. Without the key, MCP reports that chat is not configured. Never use a `VITE_` prefix for credentials. `/api/mcp/status` reports readiness; `/api/mcp/chat` validates history and adds server-owned MCP instructions.

Store the raw Gemini API key in `credentials/Gemini.txt`. The existing git-crypt filter encrypts `credentials/**` before Git stores it; the unlocked working copy remains readable locally, and Vite denies serving that directory. Local MCP reads this file if `MCP_API_KEY` is unset. Upload the unlocked key to Cloudflare with `npx wrangler secret put MCP_API_KEY < credentials/Gemini.txt`. The browser calls the relay; only the relay attaches the key to Gemini requests. Keep the git-crypt recovery key outside the repository. Production static builds do not need to decrypt credentials.

For production, the existing relay Worker includes those routes. Set its server-side `MCP_CHAT_URL`, `MCP_MODEL`, `MCP_ENABLED=true` and secret `MCP_API_KEY`; deploy the Worker separately from the static site. `VITE_MCP_API_BASE` may override the public relay address; otherwise the build uses `VITE_JEV_API_BASE`. Existing Worker origin and request-budget checks apply. The face/page assets are cached by the PWA, but conversations require the configured service.

Selecting MCP starts loading a pinned Chatterbox ONNX model in a Web Worker, using WebGPU. The approximately 1.5 GB model download is exclusive to MCP; it is not included in the main game preload or service-worker asset list. Model responses are stored as bounded ArrayBuffer chunks in the `tron-mcp-voice-models` IndexedDB database, keyed by their revision-specific resource paths. Returning home keeps the MCP frame and its initialized voice worker alive; reentering MCP in the same app session reuses it immediately. A full page reload still rebuilds model/GPU sessions from cached files. Initialization stage timings are logged to the console, including cache-read statistics (which overlap model initialization). Browser storage eviction or clearing site data requires a new download. No voice API key is required.

`scripts/extract-mcp-voice.py` creates `public/audio/mcp-reference.wav` from only MCP's dialogue at 23.23–31.08 seconds of the supplied clip, using the 5.1 front-center channel; the source, processing and transcript are recorded beside it. `node scripts/mcp-voice-sample.mjs` generates an audition WAV locally. The page also offers **HEAR VOICE SAMPLE**, a previously synthesized new line, and **TEST VOICE**, which generates that line in the browser. These work without a configured chat provider. Keep `.local/voice-models` out of Git.

Cloned speech drives the mouth from the actual playback waveform. Browser-voice fallback uses word boundaries and a procedural envelope. The visual remains a 2D deformation, not a phoneme-accurate 3D reconstruction. Reduced-motion mode keeps the face still. `node --test tests/mcp.test.js tests/worker.test.js` checks the relay contract; `node tests/mcp.mjs` exercises the browser flow with mocked speech/chat and saves face captures.

`node tests/mcp-voice.mjs` performs real WebGPU generation and checks IndexedDB reuse on reload. It downloads the model in its isolated browser context.

MCP now distinguishes model transfer, atomic device-cache writes, and GPU initialization. Returning visits reuse saved weights but still initialize the speech engine. Hiding the page keeps voice loading active; Stop or leaving MCP cancels it. Gemini defaults to its native generateContent route with bounded retries for temporary failures; custom OpenAI-compatible `MCP_CHAT_URL` endpoints remain supported.

Adaptive game antialiasing targets 60 FPS by default. It adjusts supported MSAA and pixel ratio, preserves SMAA, and waits for sustained performance before changing quality. Rejected higher levels remain blocked until page reload, preventing oscillation. The development panel exposes the frame-rate target and adaptation switch.

### Public multiplayer arena

LIGHT CYCLES MULTIPLAYER uses one authoritative WebSocket arena. `npm run dev` hosts `/api/multiplayer` locally. Open another window to join the same arena. Teams have at most three cycles, with two to four teams; AI fills vacancies. Surviving humans keep seats, eliminated humans queue behind existing spectators, and twelve humans is the active limit. The match continues while a browser is unfocused.

Production uses the existing Worker, its `MULTIPLAYER_ARENA` Durable Object binding and v2 migration in `wrangler.jsonc`. Deploy the Worker before the static client. `VITE_MULTIPLAYER_URL` can override the public server URL; otherwise production uses `VITE_JEV_API_BASE`. Set `MULTIPLAYER_ENABLED=false` to disable new connections. Empty rooms stop their simulation; active rooms consume server resources and need cost monitoring. There is no paid subscription provisioned by this change.

`node --test tests/multiplayer.test.js` checks authority and queue rules; `node tests/multiplayer-browser.mjs` checks two rendered clients and additional wire clients. No rollback or reconnect identity yet; real-network cutoff fairness remains a playtest requirement. See `docs/multiplayer/_index.md` for details.

## Repository layout

See [the organization plan](docs/organization/_index.md) and `assets/catalog.json` for ownership and provenance. Runtime imports are in `assets/runtime`, static served media in `public/assets`, source models in `assets/source`, and still references in `references`. Unit tests live in `tests/unit`, browser checks in `tests/browser`, and build/validation/conversion commands in `tools`. Previous CLI locations and runtime URLs remain compatible during cache migration.
