# A06 capacity and abuse controls — decision required

19 November 2026 WAT. This is a reviewable proposal, NOT an implemented protection. Current live version46 and the A04/A05 fixes remain in place. No new authentication, challenge, operator endpoint, secret, capacity ceiling, account, payment, deletion or production setting was introduced in preparing it.

## Verified current position

The live Sites database overview returned binding DB and tables draft_revisions, drafts, invite_codes, request_limits, review_feedback and shares. Only table names were retrieved; no draft contents, owner identifiers, recovery keys or invitation codes were read. The tool returns neither physical database size nor billed usage. Available Sites operations include bounded table reads and runtime variables, but no supported WAF/rate-rule or billing-alert configuration. Do not confuse listing tables or reading Worker error logs with running capacity monitoring.

Cloudflare documents D1 storage, query, row-read/write and latency analytics through its dashboard/GraphQL interfaces. This does not establish that the owner has direct access to the Cloudflare account hosting this Sites database, nor that its plan/limits/costs equal a self-managed D1 account. Actual storage usage, provider charges and backup retention remain unverified.

Current quotas bound an individual draft/workspace, but recovery codes can be generated indefinitely. The per-workspace input ceilings conservatively permit approximately348224000 bytes of retained application text across50 current drafts,200 revisions per draft,100 invitation snapshots per draft and one feedback note per invitation. This is a deliberately loose theoretical ceiling, not measured usage: terms up to20000 UTF-8 bytes; title conservatively480 UTF-8 bytes; feedback conservatively8000 UTF-8 bytes. It excludes database metadata, indexes, counters, invite_codes and backups. It must not be advertised as exact storage or billing. Many workspaces multiply the risk.

## Recommendation and concrete behavior

Retain the public verifier, recovery-code workspace and existing QoreChain contracts. Add these controls within the same application, with no hosting migration or mandatory account sign-in:

| Control | Proposed policy | User consequence |
| --- | --- | --- |
| Retained application-text budget | Initial testnet ceiling64MiB, warning at80%, operator review at90%. This is an owner-selected application budget, NOT the provider's disk allocation or a monetary spending cap. Confirm actual usage before enabling. | Growth writes are refused at capacity; existing reads/downloads/recovery continue. No automatic deletion. |
| Private usage readout | A separate operator credential in runtime secrets; only aggregate byte/row counters, budget, status and timestamp. No public admin data, arbitrary SQL, document text, workspace identifiers or invitation/recovery secrets. | Ordinary users see a clear capacity message, not the operator interface. |
| New-workspace abuse check | After compatibility acceptance, require a server-verified Turnstile result before the first saved draft in a new workspace. Bind admission to the hash of the workspace code; reject expired/replayed/wrong-hostname/wrong-action challenge results. Preserve existing-workspace access. | A new user may face one anti-bot check on first save. Verification of public files does not require it. |
| Counter storage | Bound retained request-limit/admission records with a tested policy; do not silently evict a live limit and allow bypass. Invalid anonymous tokens must not create unlimited durable rows. | Controls remain effective when attackers rotate arbitrary keys. |
| Provider monitoring | Use provider-supported real storage/query/billing metrics if access is confirmed. Establish actual alerts and operator response. | Application byte counters are never misrepresented as a complete cost or disk monitor. |

64MiB is a proposed modest testnet payload budget, not a demand estimate. If current retained payload already exceeds it, preserve all data and block only new growth until the owner raises the reviewed limit or removes their own unwanted drafts. Do not fail the schema migration or erase records to fit the number. The existing50/200/100 quotas continue.

At capacity, use plain text: “Draft storage is full right now. Your saved drafts are still available. You can open or download them and try saving again later.” A save must never show success unless committed. Explain whether a new revision or invitation was refused; no automatic retry of uncertain writes. Restore/revoke operations that do not increase accounted payload remain available; hard deletion still requires the normal explicit owner confirmation and is never performed automatically.

## Safe implementation and rollout

1. Add private aggregate diagnostics first. Keep credentials out of source, URLs, browser logs and evidence. Fail closed before database access on missing/wrong operator authorization. An operator token is separate from wallet and workspace recovery keys.
2. Inventory existing usage without exporting document contents. Establish exact byte accounting for drafts, revisions, invitation snapshots and feedback, plus separate row counts for counters/invite_codes. Record excluded overhead. Agree how unused legacy tables are handled; do not drop them as cleanup.
3. Append schema-only migrations. Initialize counters separately under a bounded, reviewed maintenance procedure that prevents growth writes racing the baseline scan; do not perform a destructive reset or unbounded migration backfill. Reads remain available. Exit maintenance only after counter reconciliation passes.
4. Enforce the reviewed budget atomically with the same SQL transaction/trigger changes that retain revisions and invitations. A partial revision, orphan invitation or inaccurate counter is a failure. Verify accounting on Trash, restore, permanent deletion, owner transfer and trigger rollback.
5. Configure a real production challenge widget for the actual hosted domain only after owner approval; keep its secret in runtime settings. Cloudflare's test keys or fixture responses cannot establish live protection. First prove actual QoreX phone compatibility without requiring the check for every existing user; keep first-save gate off until that passes.
6. Confirm provider metrics and alert access. If unavailable, keep the provider monitoring gate explicitly OPEN. Application aggregate status is useful but does not close that gate. No paid plan, custom domain or new vendor account is created without owner authorization.

## Required tests and evidence

- Isolated SQLite exact-fit, overflow, competing writes, current-revision preservation, insertion/update/deletion counter accuracy, rollback on any dependent failure, existing over-budget installation, and existing read/recovery/download behavior at full capacity.
- Protected usage readout: missing/wrong/valid operator credential; no credential echo; no private fields in output; bounded queries and safe errors; ordinary workspace credentials confer no operator access.
- Challenge adapter unit fixtures clearly labelled as fixtures. Real configured widget plus server verification on desktop and actual QoreX phone; reject replay, expired token, wrong hostname/action and upstream failure. No automatic resend after an unknown save outcome. Never claim unique-human admission or complete bot prevention.
- Counter/admission row saturation locally, bounded expiry cleanup, no bypass by spoofed forwarded-IP headers or rotating arbitrary keys. No public flood to prove a local ceiling.
- Hosted acceptance with only a fresh non-sensitive workspace, no private or existing-owner data changes. Preserve startup/UI behavior and existing Diana evidence. Commit, native deployment, exact package hashes, local results and owner-reported phone observations saved separately.
- Actual provider metrics/alerts and operator response verified before calling monitoring complete. No automatically scheduled monitoring or message to the provider has been created.

## Decision, limits and event status

The recommended package introduces a service-wide admission policy, private operator access and an external challenge dependency. The owner's standing rule requires approval before a material architecture change. Approve this package before implementation, or explicitly choose a different admission/hosting direction. A new sign-in system and self-managed hosting are alternatives, not approved fallbacks.

A06 remains OPEN. No new live result or score is claimed. This supports engineering reliability, not a new Diana cryptographic result. Ship Weeks four owner-reported completions; fresh portal Check unobserved. Q-Day registration past; no entry claimed. Independent participants and organizer audit acceptance remain open.

## Official technical references

- D1 metrics: https://developers.cloudflare.com/d1/observability/metrics-analytics/
- D1 billing/notifications: https://developers.cloudflare.com/d1/observability/billing/
- Turnstile mobile/WebView requirements: https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/

The WebView requirements do not establish QoreX compatibility. That is a required real-device checkpoint.

Public progress: no new implementation result; no additional My space post claimed. The prior backend-fix update remains READY, NOT POSTED. This decision document is planning evidence only.

Approval/implementation update: owner replied “proceed” on19November. Application capacity and private readout are implemented in ../capacity-implementation/REVIEW.md. The historical decision request above has been satisfied for this package; do not ask again for the same architecture approval. Anti-bot and provider monitoring gates remain open as listed there.
