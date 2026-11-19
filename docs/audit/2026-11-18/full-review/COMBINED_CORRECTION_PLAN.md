# Combined audit reconciliation and correction plan

18 November 2026. Baseline: GitHub e08a9a5, public Site 43. Inputs: engineering REPORT.md (74/100) and supplied 11-page Independent Hackathon Judge Review PDF (73/100). The supplied PDF was read in full; its observations are attributed to that review, not automatically treated as independently reproduced here. No application changes, new wallet transaction, live load test or deletion occurred during reconciliation.

## Conclusion

Both reviews agree that the narrow agreement/version workflow has genuine Diana proof, but neither currently picks it for first place. Scores use different reviewer-defined weights; do not average them into an official score or infer a rank. The additional review's browser observation is valuable because the earlier engineering audit lacked fresh visual access. It does not establish the root cause or persistence of a rendering failure.

The merged plan prioritizes a reliable judge entry, backend isolation, usable error/recovery behavior, stronger regression/independent acceptance, then submission. Contract changes remain a separate architecture decision. No scope expansion into escrow, political tracking or legal identity is proposed.

## Claim-by-claim reconciliation

| ID | Issue | Reconciliation/status | Required action |
| --- | --- | --- | --- |
| A01 | Blank deployed walkthrough | NEW reported live failure; not freshly reproduced here. Source has ten chapters, previous desktop render passed, latest files match build. Neither fact disproves a runtime failure. | Highest-priority clean-session route test, console/resource diagnosis and regression. Fix actual cause if reproduced; no speculative rewrite. |
| A02 | Stale public listing | Both reviews confirm planning-language mismatch. | Replace with factual current copy; verify saved form and public read-back. |
| A03 | Final video/address fields | Both retain unverified gates; absence from public rendering does not prove fields are empty. | Inspect actual saved fields; final video <=3min, playable, truthful. Video work follows functional corrections per owner preference. |
| A04 | Shared 600-request limit | Both agree; engineering review reproduced unrelated-owner 429 after invalid traffic, isolated SQLite only. | Reject invalid requests before global DB accounting; trusted-source and per-identity fairness; test legitimate users remain available. |
| A05 | Legacy migration bypasses quota | Engineering review uniquely reproduced 50+2 ->52 via owner UPDATE. | Atomic additive quota guard, no partial transfers/data loss. |
| A06 | Unlimited number of recovery workspaces | Engineering review identifies storage-growth risk beyond per-workspace quota. No production load test. | Choose monitored service budget and abuse controls. Rotatable bearer keys are not real-person admission control. |
| A07 | Pending amendment stuck | Both agree on liveness limitation, not outsider ability to forge approvals. | Decide cancel/reject/replace policy before code or redeploy; preserve old finalizations and replay binding. Owner approval required for material contract change. |
| A08 | Legacy identity header | Conditional deployment risk; supplied PDF explicitly did not demonstrate exploit. Existing identity-gateway-check.json records anonymous and fabricated-header writes both401. | Retain the existing evidence. Add repeatable edge regression using only own disposable identities; do not describe live bypass as confirmed or trust generic forwarded headers on a new host. |
| A09 | Plaintext draft storage | Both agree; disclosed in Blog/docs, but source lacks an adjacent editor warning. | Prominent plain-English disclosure before typing. Do not describe server drafts as E2EE. Client encryption is separate scope, not mandatory for this track. |
| A10 | Recovery-code compromise/backups | Engineering review adds no rotation/revocation, unknown backup erasure and restore resilience. | Document current limits, test recovery, plan atomic rotation if approved. Do not promise erasure of downloaded/on-chain/backup copies. |
| A11 | Relay regression coverage | PDF adds useful specific gap; no dedicated relay suite in current tests. Relay already restricts path/type/size and same-origin POST. | Test malformed/big/wrong-type envelopes, forbidden paths/origin, upstream timeout/redirect/errors and safe error output; bounded source-aware abuse policy. |
| A12 | Old invitations with null access-code hash | Compatibility concern, not a demonstrated authentication bypass. Current equality check fails closed for NULL. Existence of still-needed live rows unverified. | Test legacy migration fixture. Prefer clearly invalidating legacy invitations and letting owner issue fresh codes; never invent/backfill a secret or bypass the check. No live bulk revocation without assessing data/policy. |
| A13 | Sample demo friction | PDF usability recommendation, not correctness bug. Current workflow is real but multi-step. | Two clearly labelled sample buttons fetch real public files and call the same hash/Diana verifier. No predetermined results, fake approvals or transaction. Keep arbitrary file input. |
| A14 | Google Fonts import | CONFIRMED source issue: ordinary CSS rules precede @import in web/index.html. MDN states that placement is invalid/ignored. | Use a head stylesheet link or correct import order; verify appearance and layout after actual fonts load. Not a cause proven for blank chapters. |
| A15 | Security headers | Both recommend defense-in-depth; Worker source lacks explicit CSP/frame/type headers. Platform might add headers. | Inspect effective deployed headers, choose compatible policy, test scripts/styles/fonts/RPC/blob downloads/QoreX. No blanket CSP that breaks wallet or embeds without compatibility review. |
| A16 | Generic verifier errors | PDF adds user-facing differentiation; backend calls often collapse errors. | Distinguish network/RPC, file-read, invalid input and pending transaction. Keep uncertainty truthful and errors non-sensitive. |
| A17 | Draft requests can hang | Engineering source confirms no application timeout in private workspace API helper. | Bounded waits/cancellation, safe write-outcome read-back; never auto-resend uncertain writes. Test interrupted save/share/recovery/delete. |
| A18 | Browser/wallet and Solidity test gaps | Both agree:30Node tests do not exercise every UI/wallet or Solidity path. Foundry logs are owner-run, no fresh Foundry here. | Add contract CI, meaningful lifecycle cases and actual clean-browser match/mismatch/history acceptance. Independent two-person QoreX run with real receipts remains required by our acceptance plan. |
| A19 | Source/runtime and audit acceptance | Both require exact audit trail. Reports source-match; statuses remainOpen, disputes documented. Engineering adds deployed-bytecode/source comparison gap. | Preserve compiler/deployment artifact, compare runtime; fix real issues with tests. Re-audit exact changed source if contract changes; verify current event acceptance before spending again. Do not force code changes merely to satisfy erroneous AI prose. |
| A20 | Stale status/docs and optional award | Engineering adds release24 top status despite43, noisy append history, missing AI_USAGE.md. | One current evidence index; historical evidence retained and labelled. Honest AI_USAGE.md plus selected award option if pursued. No mass deletion of old SQL/SDK/legacy tables. |
| A21 | Demand/cost evidence | Both agree product value is plausible, adoption unproven. | Independent completion, consented interviews, onboarding time and full lifecycle cost measurement. No price advantage, legal identity or payment guarantee claim. |
| A22 | Competitor claims | PDF sampled six projects; only three source-reviewed by that reviewer. Links are present. This reconciliation did not independently audit their repositories. | Use as hypotheses about clearer demos, operational proof and tests. Do not repeat exact test counts/rank/claimed completeness as our verified findings. Never expand into escrow merely to copy peers. |

Reference for A14: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@import . Other findings map to source paths in REPORT.md and the supplied PDF. Existing gateway probe: ../identity-gateway-check.json. The earlier resolved wallet warning is not reopened. Retained old files/JSON are historical snapshots, not claims that solved gaps remain open.

## Milestone 1 — Judge entry and truthful first-run information

Must work: /walkthrough and /walkthrough/ render all ten chapters from a fresh direct visit and navigation; Blog scroll/menu remains usable; font rules load correctly; workspace disclosure appears before text entry.

Implementation: diagnose actual live render/resource/startup problem before patching. Keep initialized navigation robust so an optional feature error cannot silently hide all content. Add a useful loading/failure message if content depends on JS. Correct font loading. Add editor disclosure: 'Drafts are stored on this service and are not end-to-end encrypted. Anyone with your recovery code can access your workspace. Do not enter sensitive information.' Retain design and OpenMoji attribution.

Tests/evidence: clean desktop session and actual QoreX phone, direct routes, anchor jumps, down/up tracking, no horizontal overflow, network/console observations, route-level content assertion and screenshots or explicitly owner-reported phone results. A server HTTP200 or matching bundle is not a rendering pass. Save commit, deployment/version and published parity. Gate OPEN until observed render works; blocked browser access must be recorded rather than bypassed.

Event: supports the demonstrable dApp and public submission; no new chain claim. Review Ship Weeks status at start/end; current four owner-complete/freshCheck-unobserved stands. No retrospective Q-Day claim.

## Milestone 2 — Backend availability and atomic limits

Must work: invalid anonymous traffic cannot consume every other owner's read allowance; legacy migration cannot exceed quota or partially move drafts; existing data/invitations remain intact.

Implementation: A04/A05 first; add route/method/origin shape validation before expensive accounting, trusted-edge source limits where the hosting boundary supports them, and retain owner/invitation limits. Global emergency capacity protection is separate from normal fairness. Additive migration/transaction for owner transfer. Decide minimum service-capacity monitoring for A06. Do not trust a user-provided IP header.

Tests/evidence: reproduce original failures in isolated SQLite, then assert fixed behavior for two independent owners, invalid routes/origins, normal bursts, legacy exact-fit/overflow/concurrent moves and rollback. Full regression, same-source build/deploy parity. Test own disposable hosted drafts only if necessary; no public saturation test. Save original/fixed results, migration journal and commit. Gate remains open if edge source identity or platform controls are unavailable.

Event: engineering quality and working service; does not replace scoped-window/pqcVerify receipts. Judge review must distinguish effective platform controls from app-only tests.

## Milestone 3 — Real verifier shortcuts, errors and trust boundaries

Must work: sample buttons genuinely fetch/hash files and query Diana using the same verifier; ordinary file selection unchanged; uncertainty/error states readable; timeouts release controls without duplicate writes; relay rejects malformed requests.

Implementation: A11/A13/A15/A16/A17, plus legacy invitation fixture A12 and adjacent onboarding guidance (Diana/QoreX/PQ registration/faucet/fee payer). Check effective response headers before choosing CSP. Preserve local-file privacy. Do not remove all capacity protection or enable legacy invitations without valid codes.

Tests/evidence: real sample match/mismatch against same finalized version; file-read/RPC timeout/wrong-network/invalid input; write interruption/read-back; relay envelope/path/origin/size/upstream cases; CSP with normal wallet and download paths. No fixtures described as live approvals. Save results/screenshots/commit/deployment parity.

Event: same truthful testnet proof, better judge access. No added signing transaction for a read-only sample demo.

## Milestone 4 — Contract policy, build provenance and automation

Must work: preserve all finalized versions and domain separation; define what happens to rejected pending amendments; reproduce the deployed artifact and contract test environment.

Approval checkpoint: adding cancellation/rejection/replacement/expiry changes architecture and needs explicit owner policy approval before implementing or deploying it. Do not silently modify the current contract or existing agreement IDs. Establish migration and renewed audit costs/requirements before a new deployment. Candidate approach: an explicit abandoned/cancelled proposal state with events and replay-safe signatures, retaining finalized originals; exact authority/rules require a design review, not a casual patch.

Tests/evidence: pinned Solidity compile/FoundryCI, create constraints/domain binding/lifecycle/invariants, original still verifiable, stale signatures refused, chosen cancellation behavior, real Diana integration evidence on any new deployment. Archive compiler settings/runtime comparison and exact submitted audit-source hash. Stage2 acceptance stays separate from our score or dispositions. Gate open until chosen policy and provenance pass.

## Milestone 5 — Independent complete user acceptance

Must work: two people other than simply the builder switching wallets complete draft/review/download/create/verify/two approvals, mismatch check, amendment/new approvals, old-version verification and history. Owner recovery and Trash/delete acceptance already exist; retest changed areas using disposable non-sensitive material, not old private documents.

Evidence: participant roles without private identities, network/contract/agreement/version, public signer addresses, committed receipt hashes, files' hashes, timestamps/completion time, errors and owner-reported phone limits. Distinguish independent participant testimony, screenshots and independently fetched receipts. No recovery codes/mnemonics in evidence. Gate open if friends unavailable; other milestones may proceed only without pretending acceptance passed.

Event: genuine working-dApp evidence. Independent tester count is our acceptance standard, not an invented official rule. Real Diana behavior required for chain claims.

## Milestone 6 — Submission and evidence package

Must work: official listing describes current facts; repository/live app/listing agree; final <=3min video and saved testnet address fields verified; audits/acceptance accurately described; current status at top; eligible optional awards documented.

Implementation: existing listing copy, one judge evidence index, exact current source/deployment addresses, final real video after corrections, AI_USAGE.md with human decisions/testing and AI-generated work if pursuing that optional award. Preserve cover/credits/MIT. Avoid vague marketing/legal claims. Keep privacy/backup and production limits honest. Confirm public write-up versus saved form read-back.

Evidence: final listing screenshot/public read-back, videoURL/duration/playback, current README/CI, audit hashes and status, fresh official requirements/ShipWeeks Check. Owner reviews/posts progress updates; do not post on their behalf. Deadline and event conditions must be rechecked near submission; known deadline2December23:59UTC,3December00:59WAT. Q-Day17Novemberentry deadline passed without confirmed entry.

## Working rules and next action

Each milestone ends with tests, saved evidence, a blunt judge review and a My space draft marked READY or POSTED correctly. Do not average scores, promise winning, count illustrative images as live evidence, or delete old migration/evidence records for tidiness. No political/escrow/identity product expansion, no unapproved encryption overhaul, no unnecessary audit payment.

**Exact next action:** begin Milestone1 with direct deployed walkthrough rendering diagnosis, font correction and editor privacy disclosure; finish its acceptance before expanding its scope. The backend fixes remain next and must not be forgotten. Listing copy can be prepared now, while final submission/video remain later.

Status: plan prepared; implementation has not started. Both prior review scores remain historical reviewer opinions, not rescored after hypothetical fixes.

My space draft — NOT POSTED: I reconciled two reviews into one evidence-based correction plan, prioritising the deployed walkthrough, backend isolation, real verifier usability and independent QoreX testing. Existing real Diana results remain the functional proof; outstanding items are not marked complete.

## Resumption status — 19 November 2026

The original plan above is historical. Contract withdrawal/correction, source/runtime binding, V2 audit review and V2 scoped-window proof now have separate evidence under docs/withdrawal. Formal audit closure/event acceptance and independent users remain open. Milestone 1 implementation has now begun: A09 editor disclosure and A14 font import corrected/published on Site45, 39 automated checks pass and published asset parity passes. A01 blank walkthrough not reproduced on fresh desktop direct routes, so no causal fix claimed. Actual QoreX phone acceptance remains open. Current checkpoint and exact next action: ../../2026-11-19/judge-entry/REVIEW.md. Backend A04/A05 still queued next; not fixed by V2 work.

19 November backend update: owner confirmed the requested QoreX UI checks; judge-entry milestone complete with owner-reported phone acceptance. A04 reproduced shared-read blocking and A05 migration quota bypass now corrected on Site46 with43 automated tests and bounded ten-request hosted workspace acceptance. New schema-only migration0009; no old migration changed. Review/evidence: ../../2026-11-19/backend-limits/REVIEW.md. Complete Milestone2 remains OPEN for A06 trusted-edge abuse admission and monitored service storage/cost budget; available Sites controls do not establish those. No public saturation test or universal production-readiness claim. A11/A15/A17 remain queued.

19November A06 partial implementation after owner approval: Site47 has64MiB retained-application-text accounting/enforcement, private operator aggregate readout and4096 request-scope bound. All53 checks pass; real hosted initialization and post-workflow reconciliation pass. No data deletion/reset. ../../2026-11-19/capacity-implementation/REVIEW.md contains exact evidence and owner operator handover command. A06 is NOT closed: production anti-bot integration/QoreX acceptance and provider metrics/alerts remain open. Existing prior architecture approval is recorded; do not request it again.
