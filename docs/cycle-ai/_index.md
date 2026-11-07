---
title: Fast, compelling cycle AI
topTitle: TRON
subtitle: Bounded JavaScript tactics, resource planning, and measured evolution
---

## Higher weight on confirmed kills — October 26

Offline fitness version 3 doubles the entire confirmed-kill reward for both kill types equally: two base points plus up to two early-elimination points. Winning stays at one point, with its existing maximum 0.5 speed bonus. Unfinished confinement earns zero; approach remains capped at 0.15. Thus even a late single-owner confirmed kill earns more than a win without offense. A direct wall owner and successful enclosing owners still share one victim pool, so counting both roles cannot multiply the victim's total reward. Friendly/self/uncredited deaths remain excluded. The corrected immediate self-wall trap attribution is used consistently for every policy in this run.

A fresh plateau search from deployed `approach-480000-1-0` tested fifteen mutations over three generations with historical opponents, 180-second limits and two workers. It executed 464 tournament matches: 32 initial validation, 288 training, 96 challenger validation, and one unique 48-match final reference. Node 22.23.4/macOS arm64. Training leaders failed all validation attempts: approximately 19%, 31% and 4.2% lower fitness, with improvements in only 2/8, 1/8 and 4/8 seed groups and lower confirmed offense. None meets the >=5% gain / >=6-of-8 breadth / offense / runtime gates. The search stops after three unsuccessful generations.

No policy was promoted or trial updated. The final retained-policy reference has 12 wins, 22 direct eliminations and eight shared trap credits in 48 matches, with mean v3 fitness 2.55039. It is one reference evaluation, not three independent comparisons of the same policy. Final serial AI p99 is 0.352 ms and tick p99 0.638 ms; maximum tick 11.500 ms exceeds the nominal budget, although the p99 gate passes. No candidate browser check or deployment is claimed. Higher kill weights remain the default for future offline runs; live gameplay weights/control are unchanged.

All 650 unit tests pass before training, and twenty focused fitness/trap/plateau tests pass afterward, including actual swept self-wall death → trap attribution → doubled kill scoring. Exact settings, weights, hash provenance and records: `tools/ai/results/kill-weighted-1000000.json`; full local rows: `test-results/cycle-ai-kill-weighted-2026-10-26.json`. See the plan source for the complete command. Earlier v2 fitness and pre-correction credit counts cannot be compared directly with these new totals. No training remains running.

## Immediate self-wall attribution correction — October 26

Fixed a gap in periodic trap detection: a victim could hit its own trail after an opponent completed the enclosure but before the next scheduled observation, leaving no recorded trap. Death proposals now trigger a victim scan before credit is decided, ahead of ordinary periodic work, using the same collision barriers and global flood budget. The enclosing opponent receives the existing trap-assist credit and hollow victim-colored roster dot. Direct wall kills, reserve rewards and collision decisions retain their previous rules.

A failing-before regression now passes, along with a swept-collision/full-and-delta-snapshot integration and a Chrome roster fixture. All 649 unit tests pass. The bounded coarse graph still cannot prove every narrow trap, and a victim with no pre-closure observation can lack sufficient history. This is a correction to attribution, not new evolved weights. Historical fitness summaries used the previous tracker; future policy comparisons should rescore both sides consistently under this correction. Local change; not deployed.

## Extended search reached a plateau — October 25

At the user's request, continued beyond one generation until three consecutive generations failed a predeclared improvement gate. The runner now supports named configurations, historical opponent artifacts, a fixed current-policy opponent, relative gains and multiple mutation scales. A gain must exceed both 5% and 0.02 absolute fitness, improve at least six of eight validation seed groups, preserve confirmed offense and pass serial runtime checks. The counter resets on acceptance. The final test uses twelve entirely separate seed groups and requires nine positive groups. Identical final policies share one evaluation instead of repeating mirrors.

The run completed four generations and 608 tournament matches: 32 initial validation, 384 training, 96 challenger validation and 96 final comparisons. Six policies per generation, four training seeds, 180-second limits and two workers on Node 22.23.4/macOS arm64. Small/medium/large mutation scales were 0.1/0.2/0.3. First-generation candidate `cycle-ai-plateau-2026-10-25-0-4` improved validation fitness 36.2% and passed all selection gates; three subsequent generations failed to improve further. Fixed validation is selection data, not held-out proof.

| Final unseen-seed result (48 matches each) | Selected candidate | Deployed AI |
| --- | --- | --- |
| Wins | 16 | 12 |
| Direct wall kills | 18 | 27 |
| Trap assists | 9 | 6 |
| Mean fitness | 1.42948 | 1.54465 |

Final fitness is 7.46% lower, only six of twelve paired groups improve, and confirmed offense declines. The selected candidate therefore fails the final gate despite winning more matches. Deployed/default and local trial remain `approach-480000-1-0`; no browser trial or deployment was performed for the rejected candidate. Final serial AI p99 is 0.224 ms and tick p99 0.326 ms; maximum tick 8.564 ms exceeds the nominal tick budget, although the p99 gate passes. Forty targeted tests and smoke checks pass. The trainer exited normally and no further run is scheduled. This is evidence of a plateau for these mutation/opponent/reward settings, not proof that no stronger AI exists.

Reproduce with `node tools/ai/evolve-until-plateau.mjs --population=6 --trainSeeds=4 --validationSeeds=8 --finalSeeds=12 --seconds=180 --workers=2 --patience=3 --minGain=.02 --relativeGain=.05 --improvedFraction=.75 --seedOffset=800000 --mutationSeed=10252026 --mutationScales=.1,.2,.3 --preserve-offense --evaluation-opponent=current --opponent=tools/ai/results/historical-340000.json --opponent=tools/ai/results/followup-370000.json --artifact=cycle-ai-plateau-2026-10-25`. Training seed groups begin at 820000 and advance by 100 each generation; validation 840000–840007 and final 900000–900011. The exact initial policy, opponent weights and runner hash are archived; changing the future default changes the starting policy. Summary and tested weights: `tools/ai/results/plateau-800000.json`; full rows: `test-results/cycle-ai-plateau-2026-10-25.json`.

## Further evolution stopped for lack of gain — October 25

A fresh generation from the now-deployed `approach-480000-1-0` tested five mutations against a training mix containing the incumbent and historical policies `approach-340000-0-0` / `approach-370000-0-2`. Six policies × four seeds × four rotations gives 96 training matches. Training fitness favored the incumbent: 1.74619 versus the best mutation's 1.49312; direct kills 11 versus 9, with six wins each.

No mutation was selected. The trainer completed two 48-match fresh-seed evaluations of the same incumbent; those duplicate outcomes (12 wins, 19 direct eliminations, six assists, mean fitness 1.16192) are a reproducibility check rather than independent improvement evidence. The announced continuation gate required >=5% gain, improvement in >=9/12 seed groups, nondecreasing confirmed offense and a runtime pass. Zero gain/zero positive groups fails it, so no further round ran. The existing deployed/default and local trial weights remain unchanged.

Final serial AI p99 is 0.236 ms and tick p99 0.351 ms; maximum tick 8.454 ms slightly exceeds the 120 Hz budget despite passing the p99 gate. Node 22.23.4/macOS arm64, two workers and 180-second limits. Full local output: `test-results/cycle-ai-productivity-600000.json`; summary and exact tested weights: `tools/ai/results/productivity-600000.json`. Frozen historical opponent input: `tools/ai/results/historical-340000.json`. See the plan source for the exact command and stop criteria. No training remains active and no browser/policy/deployment changes were made.

## Promoted as normal gameplay — October 25

At the user's explicit request, `approach-480000-1-0` is now the shared solo and multiplayer default in `shared/simulation/cycle-ai/policies/aggression-v3.js`. The former default remains in v2 for rollback. The normal game URL needs no trial parameter. This promotion follows the tournament/browser checks below and the user's decision to try it as the normal PWA version; no prior human play review is claimed.

All 642 unit tests, production build/asset audit, Worker dry run and production PWA checks pass. Normal Chrome startup verifies the new policy, frame AI p99 0.60 ms, dense-scene p99 0.40 ms and no page errors. The multiplayer Worker is deployed; static/PWA publication uses the website Pages workflow. Installed PWAs receive the new client through the existing background update process. Exact promoted weights and release checks are retained in `tools/ai/results/promotion-480000.json`.

## Broader evolution candidate available locally — October 25

A second run used six policies × two generations × four training seeds, followed by twelve fresh evaluation seeds, four rotations each and 180-second limits: 288 tournament matches in total. Two workers ran on Node 22.23.4/macOS arm64. The trainer now accepts repeatable `--opponent=artifact.json` arguments and stores imported weights and paths. This run started from the deployed policy and included the preceding challenger as a historical training opponent. Held-out opponents remained fixed to the deployed policy.

| Held-out result (48 matches each) | Candidate `approach-480000-1-0` | Deployed `approach-340000-0-0` |
| --- | --- | --- |
| Wins | 27 | 12 |
| Direct wall eliminations | 25 | 21 |
| Trap assists | 7 | 3 |
| Mean fitness | 1.92559 | 1.27585 |

Fitness improves 50.9%, with positive paired differences in eleven of twelve seed groups and no held-out timeouts. The four rotations within each group are correlated; these results are exploratory and compare against one fixed opponent distribution. Final serial AI p99 is 0.269 ms, tick p99 0.401 ms and maximum tick 1.262 ms. Generation-selection probes had some tick-budget outliers; the trainer gates p99, not maximum latency.

All 36 targeted AI/fitness/approach tests pass. Chrome 155 at 1280×800 verifies the exact trial policy, tuning controls and execution without page errors. Rendered-frame AI p99 is 0.50 ms (maximum 1.10 ms); dense 12-cycle/2,048-trail p99 is 0.40 ms (maximum 0.80 ms). Inspected `test-results/cycle-ai-trial.png`; this does not establish subjective enjoyment. The candidate is available through `http://127.0.0.1:5173/?cycleAITrial=1` → LIGHT CYCLES. The preceding local trial is backed up as `test-results/cycle-ai-trained-before-480000.json`. Normal gameplay defaults and production are unchanged.

Reproduce with `node tools/ai/train.mjs --population=6 --generations=2 --trainSeeds=4 --heldOutSeeds=12 --seconds=180 --workers=2 --seedOffset=480000 --opponent=tools/ai/results/followup-370000.json --artifact=cycle-ai-followup-2026-10-25-round2`. Summary, exact weights and browser results are in `tools/ai/results/followup-480000.json`; full rows are in `test-results/cycle-ai-followup-2026-10-25-round2.json`. No training remains running and no further run is scheduled. Human review and promotion remain separate steps.

## Current-rules evolution follow-up — October 25

Completed a fresh one-generation run from the deployed `approach-340000-0-0`, under current speed ramping: population four, three training seeds, eight held-out seeds, four rotations each, 180-second limits and two workers. This is 48 training matches plus 64 held-out comparisons; the longer horizon produced no timeouts. Node 22.23.4, macOS arm64. Training selected `approach-370000-0-2`.

| Held-out result (32 matches each) | Challenger | Current policy |
| --- | --- | --- |
| Wins | 10 | 8 |
| Direct wall eliminations | 9 | 9 |
| Trap assists | 4 | 10 |
| Mean fitness | 1.18044 | 1.32497 |

The challenger improves paired fitness in only two of eight seed groups and scores 10.9% lower overall. Retain the deployed weights. Rotations share seeds; these exploratory results do not establish a general win-rate gain. Serial AI p99 is 0.226 ms and tick p99 0.317 ms; the final 8.858 ms tick maximum exceeds the nominal 120 Hz budget despite passing the p99 gate. No browser/play review or promotion was performed.

Reproduce with `node tools/ai/train.mjs --population=4 --generations=1 --trainSeeds=3 --heldOutSeeds=8 --seconds=180 --workers=2 --seedOffset=370000 --artifact=cycle-ai-followup-2026-10-25`. Full local output is `test-results/cycle-ai-followup-2026-10-25.json`; the repository summary is `tools/ai/results/followup-370000.json`. The trainer exited normally and no further run is scheduled.

## Obstacle-aware training reward — October 15

The offline trainers now include bounded approach credit based on navigable route distance, not Euclidean proximity. See the [current plan](../) for deployment state, checks and limitations. `tools/ai/approach.mjs` samples a swept-disc route graph once per simulated second, using the same active trail segments as collision. It credits the AI's own progress toward a frozen target, checks that the opponent is still reachable, and excludes passive closing and disconnected regions. A per-pair progress high-water mark limits repeated approach/retreat credit; initial enemy-pair normalization prevents team-size/death artifacts. The maximum approach bonus remains 0.15. Fitness version 2 now assigns one base point plus up to one early-confirmation point per eliminated enemy, shared between direct wall owners and successful trappers. Unfinished confinements no longer earn fitness. See the current plan for the bounded evolution results and limitations.

This is offline instrumentation only: it does not add pathfinding to the live controller or change the deployed policy. The 2.4 m graph is a conservative route estimate; it can miss narrow passages and does not predict future trails or enforce heading/turn dynamics. No Euclidean fallback is used. Training outputs record the reward configuration. All 583 unit tests and a four-seat tournament smoke pass; a subsequent two-generation run and fresh-seed comparison are recorded in the current plan. Its candidate improved trap assists and combined fitness but not direct kills, and remains unpromoted.

## Implemented locally — October 14

The first bounded controller is implemented and enabled by default for multiplayer and the initially unbreached standalone arena. It is plain shared JavaScript: no service requests, inference library or background training. The previous controller remains available with `race.aiMode = 'classic'`; exterior/open-arena behavior stays on the existing controller unless explicitly overridden for development. No production deployment is part of this implementation request.

Implemented behavior:

- One scheduled bot decision per 120 Hz tick for ordinary sequential IDs, each bot planning at 10 Hz; the hard ceiling is two plans per tick. A short safety guard runs every tick. Human seats are untouched, commands are applied after all bot observations, and the six-tick turn cooldown uses simulation time even across partial resource-exhaustion steps.
- A shared, fixed-capacity trail index uses the actual trimmed/damaged/expired collision segments. Queries cap work and treat overflow as unknown/blocked. The index currently rebuilds each step; measured cost fits the reference-machine gate, so incremental maintenance is deferred rather than adding invalidation complexity prematurely.
- Nine joint heading/pedal candidates. The speed forecast shares the authority's response formula and step order; arrival checks account for acceleration, available charge and an opponent's possible turbo response. Cutoffs require an arrival lead and an exit. Closing a confined approach earns more than crossing open space. Brake/yield and resource-conserving coast options compete with turbo.
- Stable target selection and switching penalties, plus seeded choice only among safe near-best candidates. Planning flood fills share a 255-cell limit across the three directions. Full two-turn search, explicit multi-bot role reservations and learned opponent prediction are not implemented yet.
- Versioned bounded scoring weights, an offline evolutionary tournament tool, and an optional 32→16→1 neural residual scorer. Neural output is capped and cannot bypass safety. The scorer is linear; the playtested evolved weights are now the local default (see promotion below). No neural weights are enabled.
- Local development controls in TAB → Arena AI, plus `__tron.configureCycleAI({mode:'bounded', measure:true})` and `__tron.cycleAI` diagnostics. The latter includes decision/guard counts and cumulative AI milliseconds. Multiplayer AI remains authority-owned; the client panel cannot edit it. Settings apply to the current local arena, persist across its rounds, and are not saved globally.

### Verification and reproducible commands

Reference machine: Apple M2 Max, macOS, Node v22.22.0; headless Chrome 155 at 1280×800. These measurements are not server-runtime or low-end-device guarantees.

| Check | Result |
| --- | --- |
| `node tools/ai/benchmark.mjs classic 3 180` | Existing full-tick p99 approximately 1.80–1.82 ms across seeds 1982–1984; matches ended in 35–69 simulated seconds |
| Initial all-bounded full matches | Full-tick p99 approximately 0.38–0.57 ms; several matches reached the 180-second horizon, so stalling/endgame variety still needs play review |
| `node tools/ai/stress.mjs` | Twelve bots and 2,048 changing segments: AI p95 0.262 ms, p99 0.493 ms, max 0.867 ms; no index overflow |
| `node tools/ai/stress.mjs --crowded` | Same history with twelve nearby threats: AI p95 0.399 ms, p99 0.487 ms, max 0.871 ms |
| `node tools/ai/compare.mjs 3` | New team won 9/12 matches against three classic teams, rotating through all four spawn teams for seeds 2200–2202. No draws. A small correlated sample, not a statistically established general win-rate gain |
| `node tests/browser/cycle-ai.mjs` | Local arena/tuning work without page errors; dense browser AI p99 0.4 ms. Actual AI work accumulated per rendered frame: p99 0.4 ms across 481 frames; max 0.7 ms. The rendered test has five AI cycles; the separate dense test has twelve |
| `npm run build` / `npm run worker:check` | Production build/asset audit and Worker dry run pass; no deployment |
| `node tests/multiplayer-browser.mjs` | Two rendered clients, twelve-cycle arena, fourteen connections, queue and restart/lifecycle checks passed |
| `node tools/ai/evolve.mjs --smoke` and `--smoke --neural` | Linear and neural candidate tournament pipelines run and emit a review artifact; short 15-second smoke matches all timed out. No claimed learning improvement or policy promotion |
| `npm test` | 550 tests pass, including collision/expiration/overflow, deterministic decisions, human isolation, policy bounds, neural safety mask, speed/resource forecast, turbo cutoff, brake/yield, turn cooldown and containment fixtures |

Run `node tools/ai/evolve.mjs` for the full offline linear experiment, or append `--neural` for the optional network experiment. It writes `test-results/cycle-ai-candidate.json`, never edits the shipped policy and never trains during play. Full runs intentionally cost more than the smoke check: multiple generations, spawn rotations and a held-out suite. Inspect performance and match results, run scenario checks and human review before importing `artifact.policy` through the development helper or changing the default policy in source. The reported Wilson interval is exploratory: spawn rotations share seeds and are correlated; it is not a sufficient promotion test by itself.

Remaining release-quality evidence: slower devices, actual deployed authority CPU/tick debt, long dense-history full-collision matches, larger held-out tournaments, and real-player impressions of aggression and endgame pacing. CPU timings below the gate do not prove that every overload fallback is strategically good. Geometry saturation stays conservative and can cost a bot an escape. No automated check establishes that the bots are already compelling to human players.

The staged design below remains the longer-term target; unchecked advanced stages are not represented as completed by this first controller.

## Decision and priorities

Design a plain-JavaScript arena AI that wins through positioning, timing and resource use. **Runtime performance is the first priority.** Add intelligence only when it fits the measured budget. The implementation status above distinguishes completed work from the remaining design; this page does not authorize deployment.

Priority order:

1. Keep simulation ticks and rendered frames smooth with twelve cycles and long trail histories.
2. Remain competent: avoid preventable crashes, preserve exits, obey the same movement and resource rules as players.
3. Act aggressively: cut off opponents, take their escape lanes and cooperate to box them in.
4. Use turbo and brake to change an encounter's outcome, conserving charge when spending it provides little benefit.
5. Vary strong decisions without randomly choosing bad moves.

Optional progression: evolve a compact parameter set using controlled win-rate experiments. Trial a tiny neural scorer only if it improves play under the same performance and safety gates. No JEV calls, model downloads, GPU inference or training in the game loop. JEV for tanks/Recognizers is outside this change.

## Current implementation and integration boundary

The authoritative movement and AI currently meet in `shared/simulation/light-cycles.js`. `chooseCycleDirection` compares forward/left/right using clearance, bounded flood-fill space, nearby cycles, a bias toward opponents' forward lanes, optional `jevGoal`, and small random score noise. Turbo/brake decisions then use clearance thresholds. AI decisions run on sampled reaction intervals; movement is continuous with bounded 120 Hz steps. The planning occupancy grid has 4.8 m cells; it is not the continuous collision authority.

Reuse the movement, speed response, resource accounting, trail trimming/damage/lifetime and swept collision rules in `shared/simulation/`. Avoid maintaining an approximate second ruleset that can approve a path the real simulation rejects. Extract small shared pure helpers where needed, with parity tests before switching controllers.

Multiplayer runs at 120 Hz with at most twelve cycles and a configured 2,048-trail limit (`shared/multiplayer/config.js`). A tick is about 8.33 ms; that is the budget for the entire authority, not an allowance for each AI. Normal speed is 38.4 m/s, maximum turbo target is 96 m/s, brake target is half normal speed. Turbo/brake each have five seconds of full-charge use and sixty seconds of recharge; acceleration/deceleration are gradual. Trail rewards can change available charge. Read all of these from configuration rather than copy constants into the planner.

Scope the first release to the closed arena in single-player and multiplayer. Preserve the existing exterior-road controller and explicit transitions to/from it. Apply the new controller only to AI-owned cycles, never human seats. Remove cycle-specific JEV goal influence and scheduling only when the replacement passes its gates.

## Performance contract before tactics

The following are **provisional acceptance targets, not measurements**. Stage 1 must establish them on a named reference desktop/browser and the actual server runtime. Include a slower browser/device profile; do not judge speed solely on this development machine.

| Quantity | Initial ceiling or target |
| --- | --- |
| All AI work per authority tick, twelve bots | p95 ≤ 0.5 ms; p99 ≤ 1 ms, including geometry-index maintenance |
| Whole authority tick | p99 < 8.33 ms; no growing tick debt in sustained worst-case matches |
| Browser frame cost attributable to AI | p99 ≤ 1 ms at 60 Hz, including multiple fixed steps per frame; no AI-caused long tasks |
| Tactical planning | At most 2 bots per tick; each bot eligible every 12 ticks (10 Hz), stable ID-based staggering |
| Strategic/target refresh | Every 60 ticks (2 Hz), also staggered |
| Maneuver candidates | At most 12 per tactical decision |
| Detailed candidates/opponent replies | Best 3 candidates; at most 3 plausible replies for the selected threat |
| Local space estimate | At most 256 visited cells per bot decision, shared across candidates |
| Emergency guard | Every simulation tick, short bounded queries for each live bot |

Define additional explicit ceilings for segment tests, rollout steps and index updates in Stage 1. Count work for the **entire tick**, not merely per candidate. Profile a full 180-second match, dense intersections, repeated tight turns, trail retirement, deaths and catch-up bursts. Test the current trail cap and the maximum supported single-player arena history. Report p50/p95/p99/max, decision age, segment-test counts, allocations/GC, frame tails and server tick debt. Measure snapshot/serialization work as well as AI.

Use operation-count limits to choose behavior; wall-clock timing is telemetry, not the normal search termination rule. This makes replays independent of machine speed. If a budget is exhausted, retain a still-valid plan or select a bounded defensive fallback. Never interpret unfinished searches as proof that a corridor is safe. Safety work has reserved capacity; tactics cannot consume it. If even the guard cannot complete its required checks, release turbo and choose the best verified alternative, recording the overload. No fallback can guarantee survival once every route is lost.

Do not run a full flood fill or recursive search every tick. Use reusable typed arrays, generation stamps instead of clearing whole maps, and fixed-capacity candidate/rollout buffers. Avoid per-bot copies of the full race, trail list or occupancy grid. Maintain one shared trail spatial index incrementally; account for active endpoints, removals, damage and death fading. Bound index queries in dense buckets too. Overflow produces conservative uncertainty, never silently missing a barrier. A Web Worker is a later measured option, not the baseline: snapshot copying and delayed answers could erase its benefit.

## Controller structure

Keep a few focused modules under a proposed `shared/simulation/cycle-ai/` directory:

| Module | Responsibility |
| --- | --- |
| `controller.js` | Per-bot plan state, fixed scheduling, emergency guard and legal turn/control output |
| `geometry.js` | Shared local queries, bounded space estimates and index maintenance |
| `maneuvers.js` | Generate a small set of attack, escape and resource-control candidates |
| `evaluate.js` | Safety filtering, short rollouts, features and utility scoring |
| `config.js` | Named units, immutable runtime limits and versioned tunable behavior weights |

A candidate is a compact sequence of at most two turns with trigger ticks/positions, a short turbo/brake/coast schedule, target ID, expected exit and expiration. Internally use meters and seconds, converting at the adapter to existing cell-coordinate state. Execute only the next committed control, then reassess. Do not expose future AI plans as public opponent intent.

All bots planning on a tick read the same pre-command observation; apply controls afterward. Use stable ID ordering for tie resolution so array order does not create an accidental advantage. Bots may observe arena geometry and public cycle pose/control/resource information. They must not inspect human pending inputs, future AI commands or hidden private intent. For fair difficulty, record perception/reaction cadence explicitly; the emergency guard is a bounded reflex, not a license to react to unseen commands. Keep turn cooldown and speed/resource limits equal to the relevant player rules.

Split cheap danger handling from planning. Each tick checks the current short swept corridor and plan validity. It can cancel turbo, brake when that actually helps, or execute a previously validated escape. Tactical planning selects the next maneuver. Strategic planning picks a useful opponent/region and, later, complementary team roles. Keep target and maneuver hysteresis so tiny score changes do not cause aimless turn oscillations.

## Aggression that creates pressure

Generate candidates from geometry rather than random action trees:

- **Cross ahead:** identify an intersection with the opponent's likely route; reach it early enough to establish a trail, then turn into a verified exit. Cancel when the opponent can arrive first or the crossing traps the attacker.
- **Overtake and cut across:** in a parallel race, test whether a short turbo burst earns enough lead for the rear emitter/trail to block the other lane. Being slightly ahead with the bike's nose is insufficient.
- **Seal an exit:** use an existing wall/trail as one side of a trap; draw the missing boundary while keeping an exit for oneself. Reward reducing the opponent's reachable choices, not merely approaching it.
- **Pressure into a pocket:** take an open lane that leaves the target choosing between increasingly confined regions. Distinguish useful containment from following behind an opponent's barrier.
- **Brake to reverse the advantage:** let an opponent cross first when braking opens a safe follow-through or defeats its cutoff; resume normal speed as soon as the timing advantage is secured.
- **Disengage and preserve space:** abandon an attack whose escape is lost. Keep an available-space maneuver in every candidate set.

For each attack, compare arrival times under the real acceleration and reserve rules. Check when the emitted trail actually occupies the crossing, continuous body clearance and a safety margin for opponent response. Evaluate a small reply set: continued motion, a legal escape turn, and a relevant speed response. Select replies from nearby threats, using conservative motion envelopes for others. A full twelve-agent minimax search is explicitly out of scope.

Use a coarse occupancy/region estimate to rank promising routes, followed by continuous swept checks for finalists and the executed prefix. Include the attacker's newly emitted trail in rollouts: a two-turn maneuver can cut off its own exit. Model known trail expiration, shortening and damage; never count a barrier as already gone just because it is visually fading. A confirmed opponent turn invalidates its old motion forecast immediately, while expensive replanning remains scheduled and bounded.

Score opponent escape loss and territory advantage alongside personal survival, remaining exits and charge. Use a hard safety filter before scoring, rather than letting a large aggression bonus outweigh a predicted collision. When no safe candidate remains, choose the best survival opportunity and record the failure. Short-horizon verification is not a proof against every future opponent action.

Team coordination is a second-stage feature: assign at most one closer and one exit-denier to a target, with brief reservations for their intended corridors. Teammates stay collision hazards. Penalize redundant pursuit and blocking an ally's escape. Do not assume a human teammate follows the plan, and do not require perfect teammate cooperation for the attacker's own safety.

## Turbo and brake as part of the maneuver

Evaluate turn and resource choices together. Candidate schedules are short pulses followed by release, not simply “turbo whenever clear.” Integrate actual speed response and charge to compare arrival times; braking reduces speed, it does not instantly stop the cycle.

Spend turbo only when it creates a robust lead, reaches an exit before closure, or materially expands safe territory. Stop boosting once the required lead is achieved. Spend brake to yield a dangerous crossing, avoid entering a closing corridor or change an opponent's cutoff timing; reject braking that only delays an unavoidable impact while sacrificing the escape.

Price reserve use by context. Charge has higher value with nearby threats or few exits, and lower value when an immediate advantageous cutoff is available. Keep a configurable reserve floor for ordinary attacks, overridable for a verified escape or a sufficiently strong finishing opportunity. Test exhausted reserves and rewards; releasing a request matters because recharge depends on requested controls. Apply switching hysteresis to avoid turbo/brake flicker.

## Randomness without deliberate mistakes

Remove independent noise that can promote an inferior unsafe move. First reject unsafe and clearly dominated candidates. Then choose among alternatives within a small normalized utility tolerance of the best, provided each meets the same clearance, exit and reserve constraints. With only one strong move, take it deterministically.

Sample modest personality preferences once per round: cutoff preference, target stickiness, resource conservation, desired open space and preferred side in symmetric situations. Keep safety margins and computational ceilings outside this variation. Maintain commitment until invalidation or a materially better option appears; do not resample every frame.

Use an independent seeded PRNG stream per bot, round and policy version. A different bot's death must not consume this bot's random sequence. Replay the same seed, policy and observed inputs identically on the same supported runtime. Cross-engine bit-identical floating-point behavior is a separate test requirement, not a promise. Multiplayer remains server-authoritative; clients do not need to reproduce AI decisions to render them smoothly.

## Optional evolution from win rates

Begin with approximately 8–12 bounded parameters: cutoff reward, containment reward, space value, reserve price, attack reserve floor, timing margin above the hard minimum, target-switch cost, commitment duration and near-best selection tolerance. Separate these from non-evolvable safety minima, reaction rules and runtime ceilings. Store a versioned JSON policy with parameter bounds, training seeds, benchmark results and parent policy ID.

Run a plain Node.js headless tournament outside live matches. Mutate a small population around the champion, evaluate cheaply to reject poor candidates, then spend more trials on promising challengers. Use paired seeds with swapped spawn locations, team colors and teammates. Compare against the frozen current bot, several historical champions, defensive and aggressive opponents, plus mixed-policy teams. Separate duel and six/nine/twelve-cycle results. Rotate a held-out seed pool and keep the final promotion suite unseen during optimization.

Rank performance lexicographically: runtime gate, safety regression gate, then combined aggression-and-win fitness, then team win rate. Record draws/timeouts explicitly, treat the whole match as the statistical unit, and report sample counts and uncertainty. Do not promote on a handful of wins or repeated testing against the same seeds. Require a prespecified statistically supported improvement on held-out matches and no material regression in scenario failures, resource efficiency or performance tails. Keep diverse historical opponents to discourage cyclic overfitting. Human play review remains necessary: higher win rate can still mean dull stalling.

Public win rates are useful monitoring data, but depend on human skill, seats and teammate composition. Do not directly update weights after each public win/loss. Collect policy-tagged results, use them to identify weaknesses, validate a challenger offline, and activate a frozen approved version between matches with rollback available. Never mutate behavior midway through a match. Keep training opt-in and off the browser/server simulation loop.

## Optional tiny neural scorer

A small network is appropriate to **rank validated candidates**, not to replace collision checking or invent arbitrary controls. First establish the linear weighted scorer and evolutionary tuning baseline. Only keep the network if a controlled comparison earns its extra complexity under the same total decision budget.

Initial experiment: 32 normalized candidate features → 16 ReLU hidden units → 1 utility output. This is 528 weighted multiply-adds and 17 biases per candidate, or 545 float32 parameters (2,180 raw weight bytes). With twelve candidates it requires 6,336 weighted multiply-adds per decision. These are operation counts, not timing claims; feature extraction, geometric queries and rollouts can cost more than inference.

Implement inference with fixed typed arrays and ordinary JavaScript loops. No tensor framework, WebGPU, WASM runtime or additional download is required. Clamp/validate inputs and outputs; a non-finite score falls back to the linear scorer. Keep candidate generation, safety masks, resource rules, scheduling and deterministic PRNG outside the network.

Features should describe the candidate rather than a raw arena image: verified clearance/time-to-impact, own exit count, bounded reachable space, target escape reduction, crossing arrival margin, nearby threat distances/headings, current and predicted reserves, speed-control cost, ally interference and plan-switch cost. Include truncation/uncertainty flags so a capped space estimate is not treated as complete information. Features must use only permitted observations and have documented scales. The compressed view can miss global traps; the neural scorer does not remove that limitation.

Train and evaluate outside live play. A first experiment can use bounded weight mutation and tournament selection; compare its sample cost with evolving the smaller linear parameter set. Another option is offline supervised fitting to stronger bounded-search labels, followed by actual match evaluation. A score trained from match outcomes is not automatically a calibrated win probability. Do not call improved imitation loss improved gameplay without tournament evidence.

Version features, architecture and weights together. Benchmark linear and neural scorers with identical candidate sets, seeds and runtime ceilings; measure complete AI cost, not inference alone. Keep the linear policy if neural gains are inconclusive. The hybrid idea has precedent in [Stockfish's neural evaluation](https://stockfishchess.org/blog/2020/introducing-nnue-evaluation/); its results and specialized NNUE architecture are not evidence that a network will improve TRON.

## Implementation stages and acceptance gates

### 1. Establish the budget and baseline

- [x] Add a headless seeded tournament/performance harness and fixed encounter fixtures, retaining the classic baseline.
- [ ] Measure current twelve-bot full matches, near-cap trail histories, simultaneous threats and browser frame tails on named hardware/runtime versions.
- [ ] Specify segment-test, rollout and whole-tick operation ceilings; verify deterministic budget exhaustion and bounded memory. Ratify or tighten the provisional timing targets.
- [ ] Record win rates, unforced crashes, attack opportunities attempted/completed, resource spent per useful maneuver and timeouts. Separate performance timing runs from debug overlays/logging.

### 2. Ship a bounded competent controller behind a flag

- [ ] Extract rule helpers with parity tests; add shared spatial queries and staggered planning with emergency guard.
- [ ] Add escape/open-space candidates, explicit continuous validation and resource-aware timing. Test off-grid turns and speed changes.
- [ ] Pass runtime gates before adding attack search. Validate reset/death/round changes and release all controller/index state correctly.

### 3. Add attack maneuvers and controlled variety

- [ ] Add cross-ahead, overtake/cutoff, seal-exit and brake/yield fixtures, including adversarial replies and abort conditions.
- [ ] Test equal-arrival crossings, own-trail traps, fading/damaged/trimmed trails, multiple threats, depleted charge and a lost exit immediately after commitment.
- [x] Add near-best seeded choice with fixed policy preferences and safety filtering. Per-round personality sampling remains deferred.
- [ ] Add complementary teammate roles only if individual tactics fit the budget. Test ally obstruction and uncooperative human teammates.
- [ ] Compare against the frozen baseline with paired seeds; inspect rendered matches for readable attacks, competent escapes and absence of jitter/stalling. Repeat runtime gates with all tactics enabled.

### 4. Evolve parameters; optionally compare a neural scorer

- [x] Implement versioned policies and offline challenger tournaments with runtime checks and held-out matches. Automatic promotion is disabled; paired statistical and scenario review remain required.
- [ ] Demonstrate a repeatable team-win-rate improvement with uncertainty reported; retain historical opponents and rollback policy.
- [ ] Optionally implement the 32→16→1 scorer and compare it fairly with the tuned linear baseline. Reject it if it fails the same runtime gate or lacks meaningful gameplay gains.

### 5. Integrate and validate release readiness

- [x] Use the same controller in the local initially unbreached arena and multiplayer authority; keep client prediction/rendering separate.
- [x] Disable cycle JEV goal requests/influence for the new mode; preserve tank/Recognizer JEV behavior and the exterior cycle controller.
- [ ] Run unit/parity/replay tests, browser lifecycle checks, sustained authority load and multiplayer tests with human and AI seats. Confirm no added startup or frame hitching from policy/index setup.
- [ ] Record real-player impressions of cutoff pressure, deaths, turbo/brake intent and variety. Document remaining defects and actual benchmark hardware/results before recommending deployment.

Validation status: implementation measurements and completed checks are recorded above. Unchecked stages remain outstanding, especially cross-device/server benchmarking, advanced coordination, training promotion and human play review.

## Persistent trap attribution and aggressive evaluation — October 14

The authority now tracks coarse reachable space on a 40×40 graph. One cycle is sampled every 0.1 seconds, and dying victims are sampled immediately before attribution; at most three opposing wall owners are tested per sample, geometry is capped at 2,048 segments, and all floods in one update share a 16,000-node visit budget. This is attribution only, never a replacement for swept collision. A new enemy wall must reduce reachable space substantially: the remaining area is at most 40% of the arena, and removing its newly added barriers restores at least 80 coarse cells and 1.5× the area. Mere proximity and following do not earn credit.

A detected trap remembers the original walls and region. New walls laid inside that region—including the victim filling it with a spiral—do not erase attribution. Before awarding an assist, the authority checks that the victim remains inside the original region and that surviving original barriers still enclose it. Removing the attacker's wall must restore meaningful escape space. There is no timeout. A direct hit on that same attacker's wall remains a direct kill, not an additional assist. Multiple attackers share at most one assist reward per victim. Hollow victim-colored roster dots show assists; filled dots remain direct wall eliminations. Compact snapshots carry assists, but not graph/history state.

Conservative limitations: this graph cannot prove every narrow passage or every driving maneuver is viable. Breaches expand to coarse cells and deny uncertain credit. Trail damage, trimming or retirement invalidate pending attribution rather than risk keeping credit across a sub-grid opening; this can miss valid traps, including when an unrelated trail changes. Budget exhaustion cannot award an assist. A death-time scan now catches a box completed between the victim’s periodic scans. An enclosure already present at that victim’s first observation still lacks evidence of a newly closing opponent wall. Large-region partitions and non-cardinal road joins are deliberately excluded. Human attribution review and slower-hardware/Worker profiling remain outstanding.

Offline tournament fitness now awards 1 point per team win, 0.5 per direct enemy wall elimination, 0.35 per trap assist, and 0.1 per newly created confinement. Confinement and assist rewards are separately capped to one shared reward per victim per match. Runtime compliance ranks first; combined fitness ranks next, with win rate breaking ties. Thus aggression is a primary objective, not merely a tie-breaker for equally winning passive policies. Artifacts retain raw wins, draws, direct kills, assists and confinements. Promotion remains manual, with held-out checks and human gameplay review; no evolved weights have been deployed.

Validation on Apple M2 Max, Node 22.22.0 and Chrome: 561 unit tests pass, including persistent 90-second trapping with self-fill, escape/opening invalidation, duplicate/direct/friendly exclusions, and shared reward ranking. Chrome roster checks pass; hollow assist dots visually inspected. A 12-cycle/2,048-trail stress fixture (`node tools/ai/trap-stress.mjs`) measures scheduled attribution work at p95 0.152 ms, p99 0.187 ms and max 0.191 ms. One 180-second bounded-AI match produces one trap assist despite zero direct wall kills, with total simulation tick p99 0.660 ms; the match times out, so this is not evidence of improved winning or entertainment. Evolution smoke pipeline and production build pass. Implementation is local, not deployed.

## First aggression evolution trial — October 14

Completed `node tools/ai/train.mjs`: four policies × two generations × four training seeds × four spawn rotations (128 training matches), then eight fresh seeds × four rotations for both the selected candidate and baseline (64 evaluation matches). Each match allows 180 seconds. Mutations are seeded (44123); historical opponents remain in training. Three worker threads execute simulation matches without timing instrumentation. Serial, uncontended performance checks gate each generation winner and the final candidate. The neural scorer remains disabled.

Selected policy: `aggression-1-0`. Full weights, training scores, per-match held-out results, configuration and serial timing are retained in [the experiment artifact](experiments/aggression-2026-10-14.json). No automatic policy promotion or deployment occurred.

| Fresh-seed results (32 matches each) | Baseline | Candidate |
|---|---:|---:|
| Direct enemy wall eliminations | 3 | 5 |
| Trap assists (shared credits) | 9 | 10 |
| Confinements (shared credits) | 42 | 44.17 |
| Wins | 4 | 5 |
| Timeouts/draws | 16 | 13 |
| Losses | 12 | 14 |
| Mean combined fitness | 0.4016 | 0.4818 |

This is a modest exploratory gain, not established superiority. Candidate fitness is better on five seed groups, worse on two and tied on one; the approximate paired t interval across eight independent seed groups for the mean fitness difference is −0.301 to +0.461 (95%), spanning no improvement. Four spawn rotations within a seed are correlated. More losses and still many timeouts warrant gameplay review. These tournaments use closed arenas; they do not establish the same result under multiplayer wall-breach rules.

Serial M2 Max/Node 22.22 timing for the candidate: AI p99 0.186 ms, full tick p99 0.598 ms, maximum full tick 2.528 ms. Chrome 155 on macOS verifies the exact selected weights, no page errors, and a rendered frame AI p99 of 0.300 ms; the isolated 12-cycle/2,048-trail browser planner fixture gives p99 0.400 ms. Captured and inspected the arena rendering. Sixteen focused AI/fitness tests and the production build pass. Visual rendering does not establish that the opponent feels more fun.

To play locally, open `http://127.0.0.1:5173/?cycleAITrial=1` and choose LIGHT CYCLES. This development-only route loads `test-results/cycle-ai-trained.json`, validates the policy and requires its serial runtime check to have passed. The normal URL retains the baseline, and multiplayer authority is unchanged. Neither the loader nor the training artifact URL appears in production bundles. To reproduce the saved trial without retraining, copy the experiment JSON above to `test-results/cycle-ai-trained.json`. Browser check: `node tests/browser/cycle-ai.mjs --trial`.

## Playtested policy selected for solo and MP — October 14

At the user's request after playing the trial, `aggression-1-0` is now the shared default in `shared/simulation/cycle-ai/policies/aggression-v1.js`. Both solo arena bots and the multiplayer authority use these frozen weights. Solo LIGHT CYCLES keeps bounded AI enabled after a breach. Human controls and road mode remain unchanged. Training artifacts cannot replace this gameplay policy automatically; further evolution is separate. The original `bounded-v1` weights remain available as `BASELINE_POLICY` for reproducible offline comparisons.

The earlier trial-only restriction no longer applies to these weights: normal local solo and MP games use them without a query parameter. This is a local source change, not a production deployment. Focused authority/AI tests verify both paths select the same policy; two-client Chrome MP lifecycle checks and the Worker dry run pass.

## Extended evolution reached a plateau — October 14

`node tools/ai/evolve-until-plateau.mjs` completed four generations and stopped after three consecutive generations without a qualifying validation improvement. This is a plateau for this mutation/search setup, not proof that no better policy exists. The validation winner `plateau-0-0` scored 0.4484 mean fitness on 32 fresh matches, versus 0.4664 for the playtested `aggression-1-0` and 0.3781 for `bounded-v1`. The challenger had 5 wins, 24 draws and 3 losses; the playtested policy had 4 wins, 14 draws and 14 losses. More survival did not produce better combined aggression fitness. Neither the trial artifact nor gameplay default was replaced.

Full results: [plateau experiment](experiments/plateau-2026-10-14.json). Serial M2 Max Node timing passed: AI p99 0.252 ms and full simulation tick p99 0.661 ms. Closed-arena evaluation and small seed count remain limitations. Shared default integration passes 562 unit tests, Chrome AI and two-client multiplayer checks, and the Worker dry run; production remains unchanged.

## Research findings — October 14

### Faster-win reward follow-up

Offline evaluation now adds `fastWinBonusPoints × max(0, 1 − seconds / matchLimitSeconds)` only for the winning team. `AI_FITNESS.fastWinBonusPoints` defaults to 0.5, in addition to the base win point: a 90-second win in a 180-second evaluation earns 1.25 before aggression rewards. A deadline win earns 1.0. Losses and timeouts earn no speed bonus, while earned wall, assist and confinement credit remains. Missing or invalid timing earns no bonus. Confinement credit is already recorded when a trap is detected and is not discounted by time spent filling the trapped region.

Match results carry their configured limit, and tournament worker rows include the speed contribution. Fitness weights are retained in new training artifacts. Earlier artifacts retain their original scoring and must not be compared directly with new scores. Four fitness tests and the offline evolution smoke pass. No live simulation work or gameplay-policy change is introduced; a new training comparison is still required to establish behavioral improvement.

### Original sources

Original sources suggest several useful directions:

- [Andy Sloane's winning 2010 AI postmortem](https://www.a1k0n.net/2010/03/04/google-ai-postmortem.html): bounded search plus obstacle-aware territory ownership and chokepoint/chamber analysis. Separate contested play from isolated space filling. His [simplified JavaScript opponent](https://www.a1k0n.net/code/tron.html) is directly inspectable.
- [Animal–Animat Coevolution, 1998](https://www.demo.cs.brandeis.edu/papers/tronsab98.html): eight obstacle-distance sensors fed evolved controllers. Early perceptron evolution produced passive spirals; human-opponent evaluation helped escape this self-play equilibrium. The authors identify missing opponent position/heading as a sensory limitation.
- [Modular Reinforcement Learning for Playing the Game of Tron, 2022](https://doi.org/10.1109/ACCESS.2022.3175299): separate interaction and isolated-survival models, with board channels for arena walls, own head/trail and opponent head/trail. Positive per-step survival rewards encouraged avoidance; negative per-step rewards produced more aggressive play in their experiments. Their convolutional network is larger than our proposed tiny scorer. Small two-player grids and a simplified search baseline limit transfer of strength claims to our arena.
- [Simultaneous-move MCTS study, 2013](https://repository.tudelft.nl/record/uuid%3A814a4ba7-9508-410e-ba12-79de980cb67b): explicitly model simultaneous decisions; decoupled selection performed best among tested variants. It does not establish suitability under our twelve-cycle runtime budget.
- [Armagetron close-combat source](https://github.com/ArmagetronAd/armagetronad/blob/trunk/src/tron/gAIBase.cpp): `ThinkCloseCombat` uses relative opponent position, direction and speed, reaction allowance, wall sensing and explicit cutoff comparisons, with emergency survival checks. This is a useful real-time interception reference, not evidence of learned turbo overtaking.

Proposed next experiment, not implemented: keep bounded geometry/safety work, expose opponent-relative motion and speed reserves to a small policy controlling turn/turbo/brake jointly, and train against diverse historical opponents with explicit overtake/interception scenarios. Evaluate aggressive wins and successful confinement rather than survival time alone. A modest time penalty needs testing against suicide/recklessness. Maintain runtime as the first gate; use expensive search offline if it helps produce training examples. Our variable-speed, multi-cycle arena requires its own validation.

## Faster-win evolution completed — October 14

Ran `node tools/ai/evolve-until-plateau.mjs --fast-wins` using Node 22.22.0 on Apple M2 Max. Start from frozen `aggression-1-0`; mutation seed 882913, training seeds beginning at 220000, validation 240000–240003, final 300000–300007. Each seed has four team-position rotations, with 180-second match limits. Runtime measurements run serially after parallel match evaluation.

All three generations failed the predeclared improvement criterion (fitness gain at least 0.02, improvements in at least three of four validation seed groups, and runtime pass). Training-selected challengers had validation fitness deltas −0.1560, −0.3443 and −0.2188; only the first improved any seed group (one). Stop after three consecutive failures. This establishes a plateau for this bounded weight-mutation experiment, not absence of better policies. No neural policy or new action repertoire was trained.

The run executed 352 matches: 16 initial validation, 192 training, 48 challenger validation and 96 final evaluations. Because the champion stayed unchanged, two final 32-match evaluations use the same policy and seeds and produce identical results; they are a reproducibility check, not independent evidence.

| Fresh evaluation | Retained playtested policy | Original baseline |
|---|---:|---:|
| Wins / draws / losses | 5 / 19 / 8 | 5 / 12 / 15 |
| Mean winning duration, seconds | 147.46 | 151.20 |
| Direct wall eliminations | 6 | 6 |
| Trap assist credits | 9 | 12 |
| Confinement credits | 52.5 | 50 |
| Total faster-win bonus | 0.4519 | 0.4000 |
| Mean combined fitness | 0.5266 | 0.5500 |

Only five wins per policy contribute to mean winning duration, and they need not be the same scenarios. Eight independent seeds with correlated spawn rotations are insufficient to claim a reliable speed advantage. The retained policy has more draws and slightly worse combined fitness than the original baseline here. Neither this comparison nor unsuccessful mutations demonstrate that the new reward reduced spiraling. Trial and gameplay weights remain unchanged.

Serial runtime passes the existing gate: AI p99 0.235 ms and full tick p99 0.478 ms; maximum full tick 10.860 ms exceeds one 120 Hz tick budget, so the p99 result is not a guarantee of no overruns. Closed-arena fixtures do not establish performance with MP breaches or on slower/server hardware. Four fitness unit checks pass; script syntax and generated-document checks pass. No browser test or deployment was needed for this offline experiment.

Preserved [full weights, rows, configuration, validation and timing](experiments/fast-wins-2026-10-14.json). Further work should change the training situations or available decision structure rather than claiming more repetitions of this search have found a better AI.
