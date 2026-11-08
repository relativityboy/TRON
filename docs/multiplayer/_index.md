---
title: Multiplayer light cycles
topTitle: TRON
subtitle: Authoritative arena, bandwidth reduction, and staged low-latency hosting
---

## Revised proposal for review — October 22

See [WebRTC private-match plan](webrtc/index.html) for a staged connectivity probe and three-human reliable-channel experiment with rotating hosts, precise-turn measurements, and a comparison with dedicated-server transports. This proposal does not supersede the public hosting plan below or authorize implementation.

## Selected low-latency hosting plan — October 14

Adopt the staged migration below, based on the hosting proposal review. Keep the static client on GitHub Pages and AI services on the existing Cloudflare Worker. Target one Google Cloud VM for the authoritative public arena, first over WebSockets and then with WebTransport plus WebSocket fallback. Preserve the shared JavaScript simulation, public queue, AI vacancy filling and current gameplay. This is the implementation plan, not authorization to purchase infrastructure or publish a deployment.

The current production arena uses the Cloudflare Durable Object. Protocol 2 bandwidth reductions are in the October 14 release: the compatible Worker and matching static client are deployed and production browser checks passed. The measured 93.2% reduction is a five-second twelve-cycle benchmark, not evidence of lower production latency. The historical browser-host/WebRTC proposal later on this page is superseded by this plan.

### Stage 1 — Establish the compact-protocol baseline

- [x] Release protocol 2 through the authorized October 14 deployment: compatible Worker first, then static client; retain protocol 1 for cached clients and verify baseline repair.
- [ ] Instrument round-trip time, jitter, snapshot age, server tick drift/catch-up, input-to-visible-turn latency, reconciliation distance/frequency, bytes per client and server CPU. Report median and tail values, distinguishing local predicted response from authoritative confirmation.
- [ ] Record browser/version, hardware, player locations, region, player/spectator counts, protocol, input sequence and network conditions for reproducible comparisons. Test two humans and a full twelve-cycle arena with spectators.
- [ ] Capture close cutoffs, turbo/braking, simultaneous turns and deaths in real two-person play. Set acceptable latency and correction thresholds from those observations before selecting a new transport.

### Stage 2 — Move the existing WebSocket authority to a VM

- [ ] Extract a reusable server host around the existing room/hub; keep simulation at **120 Hz** and normal snapshots at **20 Hz**, with urgent updates for applied control changes. Do not change simulation timestep or collision behavior as part of hosting migration.
- [ ] Benchmark candidate Google Cloud regions near actual players. Run the same recorded encounters over WebSockets on the VM and the Durable Object to distinguish hosting/scheduling gains from transport gains.
- [ ] Select a VM from measured worst-case tick time and sustained load, including all twelve cycles and the configured spectator limit. Do not assume a cheap shared-core instance gives consistent CPU scheduling.
- [ ] Set up TLS, automatic process restart, health checks, bounded connections/queues, monitoring and certificate renewal. Use a DNS-only arena record for direct access; allow TCP 443 and, for the next stage, UDP 443. Account for the origin being directly reachable.
- [ ] Keep queue/round state in memory initially. A server restart resets the arena; clients reconnect with backoff and rejoin as new participants. Do not promise seat recovery without implementing reconnect identity.
- [ ] Retain the existing production endpoint as a configurable rollback destination. Migrate between rounds; never let two servers independently referee the same match.

The proposed $25–60/month is a provisional base infrastructure budget, not a total-cost guarantee. Estimate VM, IPv4, disk, outbound bandwidth, logging and monitoring from measured player/spectator hours before provisioning. See [Compute pricing](https://cloud.google.com/products/compute/pricing/general-purpose) and [network pricing](https://cloud.google.com/vpc/network-pricing). No assumed future Cloudflare UDP release is a dependency.

### Stage 3 — Add a loss-tolerant WebTransport adapter

Keep the same authoritative room and simulation for both transports. Prove a maintained server implementation can host the shared JavaScript authority before committing to a transport library. Negotiate protocol capabilities and fall back to WebSockets when WebTransport is unsupported or UDP is blocked.

| Information | Delivery requirement |
| --- | --- |
| Replaceable motion state | Unreliable datagrams, independently decodable or based on an explicitly acknowledged baseline; discard stale updates |
| Turn/control inputs | Sequenced, bounded repetition and acknowledgments; retry until acknowledged or explicitly expired/rejected |
| Trail creation/removal | Reliable sequenced events, or repeated acknowledged events with equivalent recovery guarantees |
| Join, queue, round boundaries, confirmed deaths and scores | Reliable stream with round/event IDs and duplicate protection |
| Initial state and repairs | Reliable complete snapshots, with event/baseline IDs to coordinate subsequent updates |

- [ ] Replace the current previous-snapshot delta dependency before using datagrams. A lost packet must not invalidate all subsequent state. Add periodic keyframes/checksums and bounded full-state repair; never permanently lose collision geometry with a dropped trail update.
- [ ] Respect negotiated datagram size limits. Split or route larger recovery/history payloads through reliable streams rather than sending oversized datagrams. Bound backpressure and drop obsolete motion updates.
- [ ] Define input send cadence, retry deadline and rejection behavior. Acknowledge the highest consecutively resolved sequence, or use selective acknowledgments for gaps; highest-received sequence alone is unsafe under reordering. Deduplicate repeated inputs and prevent a later command from silently discarding an earlier turn.
- [ ] Synchronize server tick estimates and validate client timestamps within bounded windows. Keep the existing eight-tick input lead as a comparison baseline, then tune from measured jitter; a fixed 60 ms delay is not a fairness guarantee. Late inputs do not rewrite confirmed collisions without a separately designed rollback system.
- [ ] Restore authoritative local state and replay pending inputs for prediction. Reuse shared motion rules for speed, turbo, braking and acceleration; opponents do not move at constant speed. Reconcile predicted trails as well as positions and preserve authoritative eliminations/reward events.
- [ ] Define ordering across streams and datagrams using round/tick/event IDs. Handle death-before-position, round changes, delayed trail events and repairs without resurrecting a cycle, duplicating rewards or mixing rounds.

WebTransport provides unreliable datagrams and reliable streams; it does not remove geographic delay. Keep fallback for older browsers and blocked UDP. See [WebTransport datagrams](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport/datagrams). The current [Workers protocol documentation](https://developers.cloudflare.com/workers/reference/protocols/) and [Containers architecture](https://developers.cloudflare.com/containers/concepts/architecture/) do not provide the direct inbound UDP game-server endpoint this plan needs; HTTP/3 support alone is not a WebTransport service.

### Stage 4 — Compare, validate and roll out

- [ ] Compare WebSocket and WebTransport on the **same VM, region and simulation**, using identical encounters and player counts. Report latency tails, corrections, bandwidth, CPU and tick drift; do not infer improvements solely from lower byte counts.
- [ ] Test 20/50/100/150/250 ms round trips, variable jitter, 0/1/3% packet loss, burst loss, duplication and reordering. Verify recovery when an input, trail event, baseline or round boundary is delayed or lost.
- [ ] Cover Chromium, Safari and Firefox, including unsupported WebTransport, blocked UDP, connection interruption, transport fallback, server restart, late join, solo Return restart and overflow queues. A reconnect must not create duplicate participants or simulation loops.
- [ ] Replay recorded inputs to verify unchanged authoritative collision outcomes. Test simultaneous cutoffs, turbo/braking and trail disappearance. Confirm bounded memory, queues and bandwidth under sustained twelve-cycle/spectator load.
- [ ] Record real two-person play and inspect visual corrections and apparent deaths; retain acceptable rendering performance and keep single-player independent of multiplayer networking.
- [ ] Enable WebTransport only if it improves the agreed latency/correction thresholds without correctness regressions. Publish measured costs and unresolved limitations; retain WebSocket fallback and a tested endpoint rollback path.

Planning validation: this update documents the selected architecture and acceptance gates only. VM, WebTransport, network-impairment and migration checks above remain unrun. Regenerate the HTML and indexes with `node docs/colvmn/static-gen.js docs`.

## Existing authoritative implementation — October 13

The user-selected design is one public, server-authoritative arena, reached through LIGHT CYCLES MULTIPLAYER. Six, nine or twelve cycles compete, with at most three cycles per team. Humans occupy available seats and AI fills the rest; additional humans spectate in a FIFO waiting queue. Surviving humans keep their seats, eliminated humans rejoin the back of the queue, and disconnects release seats. Teams are randomized between matches, with two, three or four teams; enough teams are added to seat up to twelve humans. Countdown expansion preserves the scheduled start time.

The local Vite server hosts the room at `/api/multiplayer`. Production support is prepared as one Cloudflare Durable Object named `public-arena-v1`, using the existing Worker and `MULTIPLAYER_ARENA` binding. The authoritative Worker is deployed and a production-origin WebSocket check confirms advancing snapshots and the three-cycle team cap. The static client has also been published; the protocol 2 client update was published in the October 14 release. Run `npm run dev`, choose the multiplayer menu, and open another browser window to join the same room. Single-player does not load the multiplayer client or start a multiplayer network loop.

The referee runs the shared simulation at 120 Hz and sends trail-delta snapshots at 20 Hz. The deployed baseline schedules sequenced inputs eight ticks ahead (about 67 ms). The October 14 local follow-up below removes that lead and applies accepted inputs on the next authority tick, retaining bounded timestamp acceptance. Clients extrapolate motion and predict their pending turns; collision and elimination remain authoritative. There is no rollback yet. A late command takes effect on a future server tick rather than rewriting a collision. This removes browser-host authority advantage but does not make differing network latency equal.

Human cycles carry a thick diagonal stripe, first half black and second half white, on the colored shell. Their roster circles mirror it; your circle has an extra outline. Eliminated circles retain their team outline with transparent interiors. Custom stripe patterns are a possible later addition.

The room stops when empty. Active rounds are bounded to three minutes or 2,048 trail segments, connections to 64, input messages to 512 bytes and 80 per second, with idle and slow-connection limits. An active simulation keeps its server instance awake: exact hosting cost needs measurement. No paid service was purchased. The deployment flag `MULTIPLAYER_ENABLED` can disable access.

Multiplayer does not pause when the window loses focus; held controls clear and input resumes immediately on focus. Escape still opens the return-home confirmation. The controls hint sits below multiplayer status.

### Verification and remaining work

- [x] Seven room tests cover capacity, queues, survivor priority, disconnected seats, team variation, input sequence/timing validation, trail deltas and control timeout.
- [x] Full simulation suite: 511 tests pass, plus a dedicated multiplayer audio regression. Production build and Worker dry run pass.
- [x] Headless Chrome on macOS: two rendered clients and twelve additional WebSocket clients share one twelve-cycle arena; overflow waits, local Return cannot reset the match, and single-player/home does not eagerly load the multiplayer client. Both renderers compile the human stripe without shader errors; inspected their captures.
- [ ] Real two-person play, delayed/jittery connections and close cutoff fairness.
- [x] Authoritative Worker deployed; live production-origin WebSocket snapshots verified.
- [ ] Measured server CPU/bandwidth costs, abuse protection beyond basic connection/input limits, and sustained load.
- [ ] Reconnect identity and seat recovery. Currently a new connection is a new participant; browser tabs are separate players and server restart resets the room.

The earlier browser-host proposal below is retained as an architecture comparison, not the selected implementation. Its private rooms, WebRTC and rollback milestones have not been implemented. Pricing references in that proposal were checked October 13, 2026.

## Why timing matters

The arena currently simulates at 120 Hz and cycles normally travel 38.4 meters per second. One simulation step moves a cycle 0.32 meters. A 50 ms delay means 1.92 meters of travel; 100 ms means 3.84 meters, longer than the 3.6-meter bike. Network delay cannot simply be hidden behind smooth animation when a new wall decides whether someone lives.

Those distances use actual elapsed delay, not automatically the displayed ping. Round-trip time includes both directions; half the ping only approximates one-way delay on a symmetric connection. Jitter buffers and input scheduling add more time. Rendering at 60 fps does not make a delayed turn timely.

Local steering should respond immediately through prediction. Remote steering will sometimes need correction. The difficult case is a late turn that creates a wall across another player's already-predicted path. Reconciliation must include trail geometry and collision outcomes, not just vehicle positions.

## Historical browser-host proposal — superseded

The remaining architecture comparison, prototype, budget and acceptance sections describe the earlier browser-host option. They are retained for reference and are not the selected migration steps.

### Architecture choices

| Approach | Strength | Main cost or limitation |
| --- | --- | --- |
| Browser host with WebRTC | Minimal server simulation cost; direct connection when possible | Host advantage, host cheating and suspension; TURN sometimes required |
| Authoritative server with WebSockets | Shared referee and simpler connection setup | Active server cost; delayed reliable packets can hold up newer data |
| Deterministic lockstep between peers | Very small input messages | Waiting for inputs delays everyone; exact reproducibility required |
| Peer rollback without a single referee | Immediate local prediction | Harder dispute handling and synchronized trail/death corrections |

Start with host authority, not full peer consensus. The host simulates all players and bots, accepts validated inputs, and broadcasts authoritative snapshots and events. Clients predict their own motion and reconcile against those snapshots. WebRTC is the transport; it does not itself solve fairness or synchronization.

Lockstep needs identical simulation results for identical inputs, and waiting for missing inputs can cause stalls. A fixed timestep alone does not prove determinism across browsers. See Glenn Fiedler's [deterministic lockstep explanation](https://gafferongames.com/post/deterministic_lockstep/).

### First playable prototype

1. Extract a headless arena session around the existing 120 Hz simulation. Preserve swept collision behavior, seeded randomness and stable cycle IDs. Version the simulation and arena data so incompatible clients cannot join.
2. Add private join codes and a two-human room. The host owns any bots. Keep JEV requests asynchronous and outside the synchronization path; record accepted bot decisions if replay needs them.
3. Send timestamped, sequenced turn and throttle inputs, initially batching at 30 Hz. Repeat unacknowledged critical inputs. Send state updates around 20–30 Hz while each client renders independently. Measure before increasing these rates.
4. Keep a short history of complete simulation state plus a trail creation journal. Rewind and replay all affected cycles and trails for accepted late inputs. Start with a bounded 100 ms history as an experiment, not a guaranteed fairness threshold.
5. Separate tentative collision feedback from confirmed elimination. Never award turbo, remove a cycle, or announce a result twice after replay. Define simultaneous collisions by simulation time and a consistent tie policy.
6. Validate input order, plausible timestamp age and legal turn rate. Drop inputs outside the history window rather than allowing arbitrary backdating. Show degraded connection status when corrections become frequent.

Use a reliable control channel for room state, starts and confirmed outcomes. A separate channel can carry disposable latest-state updates. Critical turns still need delivery or repetition and acknowledgments even if their transport is unreliable. Avoid resending the entire growing wall history each frame: send sequenced trail events, periodic checksums and occasional recovery snapshots.

The first prototype should end the room cleanly if its host leaves or suspends. Host migration, spectators, public matchmaking and competitive anti-cheat can wait. A malicious browser host remains trusted in this design; private casual rooms are the appropriate initial scope. Direct peer connections can expose network addresses to peers; relay-only mode trades that exposure for relay traffic.

### Hosting and budget

Use an isolated room/signaling endpoint alongside the existing Worker, with short room expiry and limited joins. Keep only ephemeral room metadata; do not persist every game tick. Issue short-lived TURN credentials on the server, never a permanent service key in the client. Rate-limit room creation and cap simultaneous rooms and relay usage independently of the existing AI endpoints.

Cloudflare lists TURN at $0.05 per outbound GB with a 1,000 GB free allowance; STUN is free. Verify allowance scope and account terms before enabling it. At a hypothetical total metered relay rate of 20 KB/s per room, one room-hour is about 0.072 GB. Actual traffic depends on players, packet overhead and how many connections require relaying. [TURN pricing FAQ](https://developers.cloudflare.com/realtime/turn/faq/).

For an authoritative Durable Object alternative, the paid plan includes 400,000 GB-seconds monthly and one million requests. Active objects are charged at 0.128 GB; incoming WebSocket messages use a 20:1 billing ratio. Extra duration is $12.50 per million GB-seconds, rounded up; the paid baseline is $5 monthly. An active simulation must not be budgeted as an idle hibernating lobby. [Durable Object pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

Illustrative calculation: 100 room-hours consume 46,080 GB-seconds. Four clients each sending 30 messages/second produce 2.16 million billable request equivalents over those hours. This excludes joins, other Worker traffic, storage and existing account usage. These are planning calculations, not measured game costs. A small fixed-price server is another option if sustained usage grows, but adds maintenance and regional deployment work.

The cheapest practical first version should mostly pay for signaling and occasional relay traffic, with simulation on the host. Set application admission limits before any public launch; billing alerts alone do not enforce a spending ceiling.

### Acceptance gates

- [ ] Replay identical recorded inputs and compare complete state hashes, including trails, random state and confirmed deaths. Test Chromium, Safari and Firefox; if deterministic replay diverges, use authoritative state restoration rather than assuming lockstep safety.
- [ ] Test 20, 50, 100, 150 and 250 ms round trips, variable jitter, and 0%, 1% and 3% packet loss, in both direct and relayed connections.
- [ ] Test mutual cutoffs, simultaneous turns, trail crossings, disconnects, host suspension, late duplicate inputs and round restart.
- [ ] Measure input-to-visible-turn latency, rollback time, corrections per minute, reversals of apparent deaths and bandwidth. Review captures and actual two-person play; smooth rendering alone is insufficient.
- [ ] Keep 60 fps rendering on the target laptops while replay runs. Confirm the normal single-player path loads no multiplayer transport or background network loop.
- [ ] Decide an acceptable latency band from playtests. If even nearby play produces frequent unfair-looking deaths, try a small equal input delay and compare, or move authority to a nearby server before adding more players.

Expand to four humans only after two-player cutoffs feel convincing. The goal is satisfying casual play at low cost, not a promise that intercontinental close-contact racing can feel identical to local play.

## Snapshot bandwidth and transport follow-up — October 14

Protocol 2 transmits only presentation state and changes to that state. Coordinates are rounded to 0.0001 grid cells (0.48 mm); authority and collision calculations remain full precision. AI planning state, collision grids and render history stay server-side. The initial snapshot and new rounds are complete; later snapshots carry cycle/trail field patches, a baseline tick, and changed roster/crash data. Baseline mismatch requests a complete repair. Protocol 1 remains available for older cached clients; deploy the Worker before the client.

`node scripts/measure-multiplayer-bandwidth.mjs` compares both formats on the same five-second simulation. With twelve cycles, protocol 1 averages 197,499 bytes/sec per player and protocol 2 averages 13,360 bytes/sec, a 93.2% reduction before compression. Six cycles with one human drop 88.5%. Event-driven updates after applied human control changes supplement the usual 20 Hz updates. These are bandwidth results, not a measured reduction in live latency.

[WebTransport](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API) provides unreliable datagrams suited to replaceable position updates, with reliable streams for turns and game events. [WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel) can also be unordered with limited retransmission. Both require a compatible peer/server; they are not raw UDP sockets exposed to browser JavaScript. The current [Cloudflare Workers protocol list](https://developers.cloudflare.com/workers/reference/protocols/) documents HTTP, WebSockets and TCP interfaces, but no direct WebTransport or WebRTC game-server API. HTTP/3 support alone does not supply the WebTransport session/datagram API. A future change would need a suitable separately hosted authoritative server or transport gateway, reliable event delivery, obsolete-update dropping, and WebSocket fallback. It may reduce stalls from retransmission under packet loss; it will not remove propagation latency. No new hosting has been provisioned.

## Remote motion smoothing — October 14 follow-up

Straight-line choppiness can occur without low rendering FPS: the old client restarted its extrapolation clock at each snapshot arrival, converting network jitter into position corrections. It also applied the local input lead to opponents whose future controls were unknown. Remote presentation now uses a continuous clock and a 75 ms snapshot buffer, interpolating through confirmed trail corners while keeping bike and trail endpoints together. The clock adjusts its rate within 10% to maintain the buffer and holds at the latest confirmed pose if updates stop. Local prediction remains immediate on its existing timeline; authoritative deaths and HUD state are not delayed.

The jitter regression at 144 Hz reduces worst normal-speed straight-line frame-step error from 1.344 m to 0.0267 m under the tested 15–50 ms delivery delays. A 50 ms buffer ran dry in that test. Jittered two-client Chrome checks and the build pass. These results do not establish real-player fairness or subjective smoothness: the remote presentation buffer adds delay, and long network stalls can still hold motion. Deployed October 14: TRON `b9b1948`, dekorte.com `c5a52e0`, Pages run `38608501930`. All 525 unit tests and the production build pass. Production Chrome confirmed the new playback code, 53 compact snapshots and solo restart with no page errors; the existing server is unchanged.

## Fixed-wall turn responsiveness — October 14 local follow-up

The next local change removes the fixed eight-tick lead for local presentation and input packets. Input timestamps still establish freshness, but no longer delay an accepted command: the server applies it on its next 120 Hz tick. Clients record a fractional keypress time privately, predict the turn at their displayed position immediately, and replay it until acknowledged. The preceding trail ends at the predicted corner. Remote cycles retain their separate 75 ms playback buffer.

With 1.8 m of clearance to the existing arena wall's collision boundary, tests at normal speed (38.4 m/s) and turbo (96 m/s) survive zero/two-tick input transit under next-tick handling, whereas the old eight-tick schedule crashes. Two ticks of transit move the accepted turn 0.64/1.6 m from the keypress position. Six ticks of transit (50 ms) is too late at that clearance for either approach. All 528 unit tests, production build and Worker dry run pass. These are controlled simulation results, not a guarantee of precise turning at arbitrary network latency.

No collision rollback or provisional death system is included. Inputs received after confirmed impact cannot restore the player. This follow-up requires both a server and client deployment; it is currently local only.

## Connection admission security — November 7

Production Worker and Vite preview enforce three simultaneous clients per IP and twelve admitted connections per rolling minute (including reconnects). The Worker uses Cloudflare-provided `CF-Connecting-IP`; preview uses the TCP peer address. Forwarded headers and client-supplied development flags cannot bypass admission. Close, error and failed upgrade paths release slots exactly once. Recent admission timestamps remain after the arena empties, then expire after one minute. Counters contain short-lived raw IPs in memory only, with no logging or persistent storage; admission memory is bounded to 4,096 tracked IPs and fails closed if full. Vite development is exempt. Shared public IPs share limits. No authentication or distributed-bot protection is implied.
