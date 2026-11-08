---
title: Security review and remediation plan
topTitle: TRON
subtitle: TRON and related dekorte.com software — October 23, 2026
---

## Relay and multiplayer hardening — November 7

The current follow-up restores finite shared AI quotas (1,000 calls and 16,000,000 input bytes per UTC day; 300 calls per IP per day and 60 per minute), renews active concurrency leases every three seconds and aborts provider work on renewal failure. Renewals neither consume quota nor revive expired/released leases. These volume limits do not guarantee exact dollar spend, and anonymous callers can still exhaust the allowance.

Production Worker and Vite preview multiplayer now allow three simultaneous clients per IP, with twelve admissions per rolling minute including reconnects. Only Vite development is exempt; trusted transport IPs identify callers. Close, error and failed upgrades release slots once, while recent reconnect history remains after the arena empties. Admission counters retain short-lived raw IPs in bounded arena memory only; no IP logging or persistence is added. Shared public IPs share the limit. Vite retains its complete upstream sensitive-file blocklist alongside project exclusions.

Validation on macOS arm64 / Node 24.22.1: 720 unit tests pass, including thirteen new security regressions; production/PWA/asset build and Worker dry-run packaging pass. Real loopback HTTP/WebSocket checks cover file blocking and admission; simulated-time SQLite/provider mocks cover renewal and abort behavior without paid calls. This change is prepared for a fork pull request; no deployment or new browser play validation was performed. See the current [project plan](../) and [multiplayer notes](../multiplayer/).

## Decision summary

Address the confirmed publication of a legacy development TLS private key first. Then patch Node and certificate trust stores, update active development/build dependencies, and retire or upgrade the older utility dependency trees. Preserve gameplay behavior and keep the public multiplayer protocol unchanged during this work.

The baseline below records the initial assessment. The implementation status supersedes its original version inventory. Runtime and dependency fixes have now been applied; public-key containment was deployed separately. No shared history has been rewritten. Package presence establishes an affected version, not necessarily an exploitable application. There is no evidence from this review of an attacker using any finding.

## Implementation status — October 23

- Removed three exposed development-key paths from the published site and tracked files, preserving ignored local copies. Parent containment commit `5840b02`; Pages run `40032587958` passed. All three former URLs returned 404 after deployment. Added artifact exclusions and a tested private-key/path guard before upload. Replaced the two old Python TLS launchers with Python 3 loopback-only HTTP servers; retired the old BIT Node server.
- Patched Node to 22.23.4 and npm to 12.2.1 locally and in project/container pins; CI pins 22.23.4/24.22.1. Restarted TRON and the separately maintained active Max Headroom checkout with Node 22.23.4. Max frontend/API listeners verified on 127.0.0.1:5023/8010, frontend HTTP 200. Preserved the active checkout's unrelated feature work; its security edits remain local.
- Updated TRON Vite 8.3.5 and Wrangler 4.152.0, Max Vite 6.4.5, both source-map-js trees, crawler fast-xml-parser 5.11.2 and Puppeteer 25.16.0, and Postcard Puppeteer 25.16.0. CI subsequently caught updated Undici advisories in Miniflare’s exact 7.29.1 pin; a scoped `overrides.miniflare.undici=7.30.1` patch resolves them without downgrading Wrangler or changing Undici’s major version. See [the upstream advisory](https://github.com/advisories/GHSA-xjj6-f33q-929c). All four maintained npm projects plus the separate active Max checkout report zero npm findings. Max certifi is 2026.10.23; OSV finds no matches in the updated 37-package lock. After-audit JSON is saved beside the baseline evidence.
- Verified the unit suite inside the container (642 passed) and a clean npm 12 install with version-pinned approvals for the five required dependency setup scripts. Rebuilt TRON's development container with Node 22.23.4, npm 12.2.1 (npm 10's newest version still had vulnerable bundled dependencies), and current Debian updates. Fresh CI advisory data also flagged npm’s bundled Undici 6.29.0; its package is replaced explicitly with 6.29.1 locally and in the image, pending an upstream npm release. npm version/audit commands and the image clean install pass with this patch. Image ID: `sha256:5e5039fefa57cba056832cce904b5e4a6c1176eedc38e22eac909d38bb103ee5`. Rebuilt Max's local API image: `sha256:fe39e4716436057b3a55b48ed4fa868975c872318a75fc632f07ae2ee6bfb19f`; verified Node 22.23.4, Python 3.12.15 and certifi 2026.10.23 inside it. This is not evidence of a cloud Docker deployment; the configured public services use Cloudflare Workers.
- Added weekly and push CI audits, OSV lock checks, container scanning for fixable high/critical findings, artifact-guard fixtures, and dependency-update configuration. Pinned existing Pages actions to reviewed release SHAs. Crawler and Postcard now have committed lockfiles and offline smoke tests.

### Verification completed

On macOS arm64: TRON's 642 unit tests, production build/asset checks, Worker dry-run, WebKit resize regression, two-client/14-connection multiplayer regression, PWA lifecycle and PWA update/recovery checks passed. Max website checkout: build, 93 mocked Python tests, and four focused browser checks passed using an isolated server on port 5192 (not the other checkout's server). Active Max checkout: build and 21 API tests passed. Crawler's two offline XML/browser tests and Postcard's one offline composer test passed using downloaded Chrome for Testing 156.0.8078.47. No paid model calls or live crawls were used.

### Remaining exposure and follow-up

Trivy 0.76.1 found **844 high/critical package/advisory rows in the TRON development image and 63 in Max's image, with zero available fixes reported** after remediation. These counts include repeats across related Debian binary packages; they are not unique exploitable defects. Full compact inventories: [TRON container findings](evidence/tron-container-findings.json), [Max container findings](evidence/max-container-findings.json). Development/media tools should not process untrusted inputs with production credentials. Owner: project maintainer; review by **October 30, 2026**, or immediately when vendor patches appear. This is a temporary documented exposure, not a clean-image claim. Weekly CI fails on fixable high/critical findings; it does not silently certify unfixed findings as safe.

Historical key copies remain in Git history; rewriting shared history requires separate authorization. Current launcher use of these keys has been retired, but other trust-store entries, reuse, historical downloads and unavailable access logs have not been exhaustively established. Do not reuse any exposed key. No evidence establishes production TLS key exposure. Cloud-provider internals, other macOS software and vendored source are not covered by the completed package scans. New public dependency builds and CI results will be recorded after rollout; no backend protocol or gameplay change is intended.

## Scope and evidence

Reviewed the TRON repository, parent website publishing workflow, Max Headroom npm/Python locks and Dockerfile, car crawler, Postcard tooling, and legacy BIT local-server lock. Queried npm advisories for all five npm trees and OSV for 37 registry packages in Max Headroom's uv.lock. Consulted upstream Node, Vite, Undici, ws and certifi advisories. No exploit payloads were run.

The running shell reports Node 22.22.0 and npm 10.9.4. TRON's `.node-version` also pins 22.22.0; its engine floor is only >=22.12.0. Its development container uses a digest-pinned Node 22 Bookworm image. Parent CI selects Node 24 for TRON and Node 22 for Max Headroom. Max Headroom's container copies Node from a floating Node 22 image into a Python 3.12 Bookworm image. Exact deployed container versions, image vulnerabilities, and CI-resolved patches were not inspected.

TRON's public frontend is static; its configured public multiplayer/AI backend is a Cloudflare Worker/Durable Object, not the developer's Node process. Updating local Node does not patch provider-managed Workers, browsers, or an already built Max Headroom container. Wrangler/Miniflare advisories do not by themselves establish a vulnerability in Cloudflare's deployed runtime.

| Locked npm tree | Critical | High | Moderate | Low | Total affected nodes |
| --- | ---: | ---: | ---: | ---: | ---: |
| TRON | 0 | 6 | 0 | 0 | 6 |
| Max Headroom | 0 | 2 | 0 | 0 | 2 |
| Car crawler | 2 | 11 | 21 | 1 | 35 |
| Postcard | 1 | 7 | 0 | 0 | 8 |
| Legacy BIT local server | 9 | 38 | 61 | 4 | 112 |

These are npm dependency-node counts, including parent packages flagged through vulnerable dependencies. They are not unique vulnerability counts and must not be added together as independent exploits. Python OSV matched certifi 2026.7.22 to two identifiers for the same trust-store issue. No match for the other 36 queried packages is not proof that they are secure.

Saved evidence: [inventory and lock hashes](evidence/inventory.json), [TRON npm](evidence/tron-npm-audit.json), [Max npm](evidence/max-npm-audit.json), [crawler npm](evidence/crawler-npm-audit.json), [Postcard npm](evidence/postcard-npm-audit.json), [legacy BIT npm](evidence/bit-npm-audit.json), [Python query](evidence/python-osv-query.json), and [Python results](evidence/python-osv-result.json). npm audit returned nonzero because it found vulnerabilities, not because the registry checks failed. Reports describe the review date; rerun them before patch selection.

## P0 — Remove private keys from published artifacts

The parent repository tracks development TLS keys in the legacy BIT server directory. Its Pages assembly broadly copies the parent checkout with rsync, without excluding that directory. A public request to one tracked key path returned HTTP 200; an in-memory comparison confirmed the response exactly matched the committed private key and contained a private-key PEM marker. Key bytes were neither printed nor saved in this report.

This establishes public exposure of that development key, not exposure of the production site's TLS key. Current local modifications to its key/certificate were excluded from the last commit, but the older committed key remained publishable. Merely ignoring future files does not remove tracked or previously published copies.

- [ ] Identify every use of the exposed key and related certificates by fingerprint; treat it as compromised anywhere it is still trusted. Replace locally used credentials and remove any corresponding local trust entries. Revoke issued certificates where applicable; do not rotate unrelated production certificates without evidence they share the key.
- [x] Remove private keys from tracked content while preserving necessary local development files in an ignored, non-published location. Check all other tracked key paths, not just the sampled file.
- [x] Change website assembly to an explicit public-content allowlist or robust exclusions for development servers, private keys, credentials, local configs and dependency directories. Add a pre-upload artifact check that rejects private-key PEM markers and known secret paths.
- [ ] Publish the corrected artifact through the normal reviewed deployment process. Purge applicable CDN caches and verify previously exposed paths no longer return key material. Check source maps and downloadable archives as well as HTML links.
- [ ] Review repository visibility and access logs where available. History rewriting is a separate coordinated action, not a substitute for rotation; obtain explicit approval before rewriting shared history.

Acceptance: no private keys in the assembled website; sampled former paths contain no key bytes; affected credentials replaced or retired; prevention check fails on a harmless test fixture. This is the first remediation to undertake, independent of package updates.

## P1 — Patch runtimes and certificate trust stores

Node's October 21 security release includes a high-severity Brotli decoder memory-corruption/RCE issue (CVE-2026-111497), DNS NUL handling (CVE-2026-105482), TLS hostname verification fixes, and dependency/trust-store updates. Malicious Brotli must reach decompression to trigger that decoder flaw; affected version alone does not prove reachability. Use **22.23.4** as the immediate Node 22 patch target; Node 24 environments need the corresponding **24.22.1** security release or a subsequently verified patched release. [Node advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases), [Node 22.23.4 release](https://nodejs.org/en/blog/release/v22.23.4).

The local shell and project pin are confirmed below that target. Do not assume all long-running servers use the shell's executable or version. No direct application Brotli decoder was found in the reviewed TRON server/build sources, but dependency downloads and HTTP clients also warrant inspection. Snapshot/SEA-specific entropy advisories should not be presented as affecting our normal execution without evidence those modes are used.

Max Headroom locks certifi **2026.7.22**. The critical October 20 advisory removes emSign roots associated with compromised intermediates; the fixed bundle is **2026.10.18**. This matters for outbound HTTPS clients that use certifi. It does not establish interception occurred. [certifi maintainer advisory](https://github.com/certifi/python-certifi/security/advisories/GHSA-6q48-6c7w-9gw2).

- [x] Upgrade the local Node 22 installation, project version pin, documented minimum and runtime checks together. Keep the first fix within the same major version; consider a major-version migration separately.
- [x] Inspect each active Node process's executable, then restart relevant local servers under the patched binary after saving work. Verify versions after restart; changing a version file does not update a running process.
- [x] Rebuild TRON's development image from a verified patched Node base and record its new digest. Rebuilding with the existing pinned digest will not fetch a new Node base.
- [x] Verify CI resolves patched Node 22/24 releases; pin or enforce minimum security patches and print actual runtime versions in build logs. Check npm and other global tools separately; npm audit does not audit the Node executable.
- [ ] Update certifi in Max Headroom's uv.lock, sync a clean environment, rebuild its image, and verify the installed bundle version and expected HTTPS connectivity. Inventory other certifi environments and OS CA stores separately.
- [ ] Inspect the deployed Max Headroom image's actual Node/Python/OpenSSL/OS package versions and image digest, scan that image, then rebuild/redeploy if affected. Floating Docker tags do not update running containers. Keep both Node image references consistent during the rebuild.

Acceptance: supported patched runtime in shell, relevant processes, CI and built containers; updated Python trust store in the deployed application; immutable image evidence and smoke checks retained. No claim of deployment completion until the running service is verified.

## P1 — Patch active frontend and development tooling

| Component | Locked version | Proposed target | Exposure and treatment |
| --- | --- | --- | --- |
| TRON Vite | 8.3.0 | 8.3.5, verified published at review | October advisories fixed from 8.3.3; patch development server/build tooling |
| Max Headroom Vite | 6.4.3 | 6.4.5 on the existing major | Relevant fixes begin at 6.4.4; avoid an unnecessary major migration |
| source-map-js, both projects | 1.2.1 | >=1.2.2 | Indexed source-map denial of service; primarily build/tool input processing |
| TRON Wrangler | 4.136.1 | 4.152.0 candidate | Update with a compatible Miniflare dependency tree, then audit resolved versions |
| TRON Miniflare dependencies | sharp 0.35.4; undici 7.29.0 | sharp >=0.35.5; compatible Undici >=7.29.1 on 7.x | Fix through supported parent updates; do not force Undici 8 merely because it is latest |

The Vite custom-middleware script-execution advisory requires an unchanged request URL passed to `server.transformIndexHtml` plus other conditions. TRON uses Vite's normal app handling; its HTML-transform plugins are not evidence of that vulnerable call pattern. The review found no matching custom call in the inspected sources. Other advisories concern editor launch, path restrictions and, in Vite 8.3, a four-byte disclosure through WASM errors. Windows-only issues are not directly applicable to this Mac, but other contributors may be affected. Loopback binding reduces exposure but is not a replacement for patching. [Vite custom middleware](https://github.com/vitejs/vite/security/advisories/GHSA-9jrq-w75r-8gcw), [filesystem restriction advisory](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22), [WASM disclosure](https://github.com/vitejs/vite/security/advisories/GHSA-vfpm-58rq-9qcg).

Sharp's advisory concerns its librsvg dependency; establishing exploitability requires tracing untrusted SVG processing. Undici has several affected API paths, including BalancedPool TLS-option handling and WebSocket/response handling. Their presence under Miniflare does not mean the shipped browser game uses them. Node's bundled Undici and the npm package are separate patch targets. [Sharp advisory](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [Undici maintainer advisory](https://github.com/nodejs/undici/security/advisories/GHSA-w293-vg96-wgc3), [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).

- [x] Make small dependency-update commits per project, regenerate locks and inspect dependency changes. Use compatible parent upgrades before overrides. Do not run `npm audit fix --force` across the whole site.
- [ ] Resolve all reported high/critical nodes or record an explicit, evidence-backed, time-limited exception. Audit all dependency classes, including development tools that handle source and credentials.
- [ ] Preserve loopback-only development listeners, origin checks and file-deny rules. Test file restrictions using dummy secret fixtures, never actual API keys.
- [x] Keep the API protocol, rendering settings and AI policy unchanged so security-update regressions can be isolated.

## P2 — Retire or refresh older utilities

The crawler, Postcard and legacy BIT locks contain much larger backlogs. They are separate from the BIT experience bundled inside TRON. Establish whether each legacy tool is actively run before treating its dependency tree as public server code.

- [x] Car crawler: prioritize its untrusted web/XML ingestion. Upgrade fast-xml-parser and the Puppeteer/browser chain, AWS SDK/Undici and ws dependencies. npm proposes major upgrades for some roots, so validate XML output and crawler behavior on saved fixtures before any live crawl. The package currently has no working test script.
- [x] Postcard: update Puppeteer and its browser-download dependencies; compare generated output on a fixed local fixture. The package also has no working test script. An audit label on basic-ftp does not imply Postcard exposes an FTP service; determine whether vulnerable methods are invoked.
- [x] Legacy BIT local server: prefer retirement/removal from deployment if unused. If retained, inventory actual imports and replace obsolete/unmaintained roots such as Parcel 1/request chains; several audit paths have no automatic fix. Keep it inaccessible to untrusted networks until reviewed. Do not blindly force 112 nodes through an automated upgrade.
- [ ] Refresh bundled Chromium/Playwright/Puppeteer browser binaries with their supporting libraries; a package upgrade alone may leave an old browser cache executable. Keep crawling/screenshot tools sandboxed, with no production credentials, when processing untrusted pages.

Older utilities contain ws versions below the patched 8.21.0 line for a memory-exhaustion advisory; TRON's ws 8.22.0 is outside that affected range. The full reports include exact ranges and remediation suggestions for the FTP, XML, archive extraction and other findings. [ws maintainer advisory](https://github.com/websockets/ws/security/advisories/GHSA-96hv-2xvq-fx4p).

## Validation, rollout and rollback

1. Preserve this audit baseline and lock hashes. Capture resolved runtime versions, installed package trees and container digests before changes. Package locks describe intended installs, not necessarily every deployed process.
2. Apply publication/key containment separately from runtime and library updates. Keep each project independently reviewable.
3. In clean patched environments, run TRON's unit suite, production build/asset audit, Worker dry-run build, and browser checks for startup, PWA update/offline behavior, solo/MP connection and materialization. Test Safari and Chrome. No paid model calls are needed.
4. For Max Headroom, run its build, mocked Python tests, and focused microphone/live-session/caption/reconnect checks. The October 22 handoff recorded one initial-status-indicator browser failure; distinguish that baseline defect from new upgrade failures rather than claiming the whole suite was green.
5. Re-run npm audits and Python vulnerability checks. Review actual imports and build output for remaining findings; require an owner, rationale and expiry for any accepted exposure.
6. Inspect the assembled website for private material before upload. After deployment approval, publish submodule commits before the parent references, deploy required backend images/Workers, and verify actual versions and former key paths. Do not confuse a Git push with a confirmed backend upgrade.
7. Roll back functional changes only to another patched build. If a security patch breaks a feature, temporarily disable the affected feature rather than restore exposed keys, vulnerable tooling or stale trust stores. Preserve compatible protocol behavior during deployment.

## Ongoing checks and review limits

- [x] Add proposed weekly dependency/lock review and upstream security monitoring, with urgent handling of high-impact runtime/trust-store notices. This plan does not create a scheduled task.
- [ ] Add CI package audits, Python lock scanning, image scanning and secret/artifact checks. Gate new high/critical findings; track existing exceptions explicitly instead of suppressing all audit output.
- [x] Enable appropriate dependency-update PRs per ecosystem and pin GitHub Actions to reviewed commit SHAs with automated update support.
- [ ] Complete the unmeasured surface: running cloud container inventory; Debian/Python/OpenSSL/FFmpeg packages; global tools; installed browsers and macOS; CI action versions; vendored JavaScript; and manually copied binary/model tooling. The dependency audit cannot cover these.

No current audit match was reported for TRON's Three.js, Rapier, Transformers.js or ws dependency roots; this is not an independent source/binary security assessment. Colvmn's reviewed package manifest declares no npm dependencies, but its custom code and vendored resources still require normal code review. Deployed provider infrastructure and all historical artifacts are outside the completed scan. Targets above are verified as of this review and must be rechecked when implementation begins.
