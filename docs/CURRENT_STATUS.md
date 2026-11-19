# The Record — current status and evidence

Checked **19 November 2026**. This is the current index; dated reports and the append-only progress log retain earlier results. It is not an independent security certification or final submission sign-off.

## Source and hosted build

- Public source: [main](https://github.com/0xaje/TheRecord/tree/main). Working history merged through [PR #1](https://github.com/0xaje/TheRecord/pull/1), merge commit 8545f47061a5912245362aa87b30cf41aaaefba7. Owner requires all future work/pushes on main; no new feature branches.
- [Live app](https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/), **Site59**, runtime environment revision9.
- Hosting source commit: **d6b21e08644460ff8343ca48dc917a73de90b4e7**. The hosting repository contains the compiled Worker and immutable migration copies, not a separately maintained UI.
- Published browser bundle SHA-256: **ed955c2c8b440ce92299f0fdc0be057f4040640a97213125dfffa7ffb8c9c5fd**; [parity evidence](audit/2026-11-19/relay-access/hosted.json).
- Latest implementation: [relay access protection](audit/2026-11-19/relay-access/REVIEW.md), deployed Site59. Its physical QoreX acceptance is pending. Previous verifier mobile acceptance remains recorded in [41f1d7e](https://github.com/0xaje/TheRecord/commit/41f1d7e1f0cb0a58780efe4f536016613512ff2d).
- **88 local build/Node checks pass** for the relay-access checkpoint ([latest log](audit/2026-11-19/relay-access/check.txt)). Historical verifier result: **81 checks**. [Raw log](audit/2026-11-19/verifier-errors/check.txt). A completed [GitHub Actions run](https://github.com/0xaje/TheRecord/actions/runs/44513386377) passed for 41f1d7e. New commits require their own CI result; the README badge follows main.
- Latest deployment adds relay access controls and additive session migration0012. Contract, existing agreement data, secrets and runtime environment revision9 are unchanged.

## Real Diana agreement evidence

| Evidence | Scope |
| --- | --- |
| [Original approval/amendment evidence](diana-evidence.md) | Two distinct wallet keys, finalized versions, original/changed verification. Both wallets operated by owner. |
| [V2 lifecycle and receipts](withdrawal/LIVE_ACCEPTANCE.md) | V1 finalized; V2 proposed/one approval/withdrawn; V3 re-proposes the same changed file with two fresh approvals. Version numbers are not reused. |
| [V2 deployment/runtime verification](withdrawal/deployment-verified.json) | Creation artifact and deployed runtime match source-bound metadata. |
| [V2 historical signature regression](withdrawal/security-regression.txt) | 14 real historical read-only checks; not newly broadcast failed transactions. |
| [V2 scoped-window proof](withdrawal/SCOPED_WINDOW_LIVE.md) | Permitted contract call committed; outside recipient refused before inclusion while allowance remained. The refused attempt is not a successful transaction receipt. |

Network: **qorechain-diana / EVM 9800**. Original/default-demo contract **0x25721b3be0f24438da7daed4c800b073ef9bb802**. Withdrawal-enabled V2 **0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f**. Both are supported through correctly scoped links; original records are retained.

V2 source SHA-256 **688545ad745ece328b60f61d6348e1744b093359bd0eb2d7e02a306df3193980**. [Source](../contracts/TheRecordV2.sol). [V3 finalization](https://dashboard.qorechain.io/explorer/tx/0xab11d9e3409fd974af93039a7d30abee1f409027c183cdbb1e61ad8c32086960).

## Engineering checkpoints

| Checkpoint | Verified result / evidence |
| --- | --- |
| Walkthrough, Blog, typography, privacy disclosure | [Judge-entry review](audit/2026-11-19/judge-entry/REVIEW.md); actual desktop and owner-reported QoreX checks. |
| Owner isolation, write fairness, legacy transfer quota | [Backend review](audit/2026-11-19/backend-limits/REVIEW.md). Invalid traffic no longer consumes a shared read budget. |
| Saved revisions, Trash and deletion | [Backend tests](../test/private-agreements.test.mjs), [revision evidence](audit/2026-11-18/live-revision-checks.json), [Trash evidence](audit/2026-11-18/live-trash-checks.json), [deletion evidence](audit/2026-11-18/live-delete-checks.json). |
| Retained-text capacity / operator access | [Capacity review](audit/2026-11-19/capacity-implementation/REVIEW.md). Owner operator readout confirmed normal/reconciled; never share operator.secret. |
| Mandatory new-workspace human check | [Enforcement and owner acceptance](audit/2026-11-19/admission-enforcement/REVIEW.md). Missing/invalid proof403; desktop and owner QoreX save/persistence observations distinguished. |
| Workspace credential logging | [Privacy repair](audit/2026-11-19/workspace-log-privacy/REVIEW.md). Updated clients use redacted Authorization; existing code/ownership preserved. Historical logs and older unrefreshed clients remain limitations. |
| Registration relay | [Bounded requests, safe errors and tests](audit/2026-11-19/relay-hardening/REVIEW.md). Real read-only node-info/invalid-request checks pass. Provider-verified15minute sessions and atomic session/service limits are deployed; [A11 review](audit/2026-11-19/relay-access/REVIEW.md). Live desktop passes; physical QoreX acceptance pending. |
| Workspace request timeouts / uncertain writes | [Review and owner read-back](audit/2026-11-19/workspace-timeouts/REVIEW.md). No automatic resend; read-only state check preserves editor. Failure cases use local fixtures. |
| Enforced browser resource policy | [CSP evidence](audit/2026-11-19/csp-enforcement/REVIEW.md). Actual desktop and owner mobile/account/fresh-workspace checks; authorized embedding not independently observed. |
| Legacy invitations | [Migration regression](audit/2026-11-19/legacy-invitations/REVIEW.md). NULL-code legacy links fail closed; owner can issue a fresh coded invitation. No live bulk revocation. |
| File verification | [Latest error review](audit/2026-11-19/verifier-errors/REVIEW.md). Actual desktop original match/changed mismatch/missing-record; owner QoreX match/mismatch passes. RPC/file-read failures are separately fixture-tested. |

## Current operational limits

Workspace: 50 drafts including Trash, 200 retained revisions per draft, 100 invitations per draft; list pages 20. Request windows are one minute: 120 owner reads, 30 owner writes and 30 review attempts per invitation. A separate 600/min service-write ceiling and 4096-scope bookkeeping limits provide bounded emergency protection, not proof of fair service under every attack.

The 64 MiB budget measures retained UTF-8 application text in drafts/revisions/invitation snapshots/feedback. It excludes physical database pages, indexes, metadata, bookkeeping, backups and provider billing. [Accounting definition and limitations](audit/2026-11-19/capacity-implementation/REVIEW.md).

Private drafts are stored on the service without end-to-end encryption. Recovery codes are bearer secrets. Downloaded/reviewer copies, public chain metadata and provider backups are outside the live-row deletion guarantee. A lost document cannot be recreated from its fingerprint.

## Audit and submission gates still open

- **Project assessment of all five V2 AI findings is complete:** [comparison and dispositions](audit/2026-11-19/ai-audit-assessment/ASSESSMENT.md). **QCAIA findings remain formally Open.** Latest V2 report 65/100, HIGH risk; [finding ledger/source binding](withdrawal/AUDIT_RESPONSE.md). Disputed findings and successful tests do not alter auditor status. Organizer acceptance of the staged audit chain remains unverified.
- Independent participants have not yet completed the full two-person workflow. Owner switching wallets is not independent-user acceptance.
- Provider physical-storage/billing monitoring, alerts and backup erasure/retention remain unverified. Application text counters do not replace those.
- Relay abuse protection is deployed: provider-verified short-lived access with atomic session/service budgets, no trusted caller IP assumption. [Live desktop/refusal evidence](audit/2026-11-19/relay-access/REVIEW.md) passes; **new QoreX browser-check acceptance remains pending**. Provider-level DDoS protection/fairness is not claimed.
- Authorized embedding has not been independently observed with the enforced CSP.
- Final video of no more than three minutes, saved project listing/address fields and final public read-back remain unsigned-off. No placeholder video is presented as a deliverable.
- The public hackathon timeline was freshly observed showing main merge8545f47 on19November. The connected repository URL is correct; no GitHub App repair was needed. Public About/How it is made still use planning copy and need owner editing. Portal VERIFIED feature badges are not proof of every product capability.
- Public My space updates are **READY / NOT POSTED** unless explicitly recorded otherwise. Ship Weeks four completions are owner-reported; fresh official Check is unobserved. Q-Day registration deadline passed without confirmed entry.
- Application history is now merged into main. This resolves the prior branch divergence; hackathon timeline display must still be observed separately.

The [combined correction plan](audit/2026-11-18/full-review/COMBINED_CORRECTION_PLAN.md) is historical with dated updates. This index and [progress log](progress-log.md) show later acceptance. Recheck official event wording and portal acceptance before final submission; do not treat site badges as agreement-workflow proof.

## Reproduce and inspect

[Build/deploy](BUILD_AND_DEPLOY.md) · [Audits](AUDIT.md) · [Research](research/WHY_THE_RECORD.md) · [AI disclosure](../AI_USAGE.md) · [Progress log](progress-log.md) · [Historical README](history/README-before-2026-11-19.md)
