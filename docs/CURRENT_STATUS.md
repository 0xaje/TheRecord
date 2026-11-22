# The Record — current status and evidence

Engineering evidence checked **20 November 2026**; owner completion clarification recorded **22 November 2026**. This is the current index; dated reports and the append-only progress log retain earlier results. It is not an independent security certification or an independently observed organizer submission sign-off; owner confirmation of completed submission is recorded below.

## Source and hosted build

- Public source: [main](https://github.com/0xaje/TheRecord/tree/main). Working history merged through [PR #1](https://github.com/0xaje/TheRecord/pull/1), merge commit 8545f47061a5912245362aa87b30cf41aaaefba7. Owner requires all future work/pushes on main; no new feature branches.
- [Live app](https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/), **Site63**, runtime environment revision9.
- Hosting source commit: **0dcc15b73a832becaf002e1f2275777bed83e866**. The hosting repository contains the compiled Worker and immutable migration copies, not a separately maintained UI.
- Published browser bundle SHA-256: **39a5051eb0d6e0bf2b4aa755a1f89c82cef404a8b51d0d60ca0154d4112609b0**; [parity evidence](audit/2026-11-20/video-demo/correction.json).
- Latest operational change: [protected database-size readout](audit/2026-11-19/provider-storage/REVIEW.md), deployed Site60; owner read-back PASS ([status](audit/2026-11-19/provider-storage/owner-status.json)): database159744bytes/156KiB, initialized/reconciled/normal. Completed prior implementation: [relay access protection](audit/2026-11-19/relay-access/REVIEW.md), deployed Site59. Owner confirmed its QoreX browser-access check works. Previous verifier mobile acceptance remains recorded in [41f1d7e](https://github.com/0xaje/TheRecord/commit/41f1d7e1f0cb0a58780efe4f536016613512ff2d).
- **89 local build/Node checks pass** ([latest log](audit/2026-11-20/video-demo/correction-check.txt)). Prior relay-access checkpoint:88 checks. Historical verifier result: **81 checks**. [Raw log](audit/2026-11-19/verifier-errors/check.txt). A completed [GitHub Actions run](https://github.com/0xaje/TheRecord/actions/runs/44513386377) passed for 41f1d7e. New commits require their own CI result; the README badge follows main.
- Latest deployment groups Watch video and Test the demo within the existing [Demo entry](audit/2026-11-20/video-demo/REVIEW.md) choices and the owner-supplied [YouTube video](https://youtu.be/Q-D4JEWY2oo), also linked in README. Owner confirms final video/listing checks and submission complete on20November; this is owner-reported acceptance. No schema/contract/data/secret change; environment revision9 unchanged.

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
| Registration relay | [Bounded requests, safe errors and tests](audit/2026-11-19/relay-hardening/REVIEW.md). Real read-only node-info/invalid-request checks pass. Provider-verified15minute sessions and atomic session/service limits are deployed; [A11 review](audit/2026-11-19/relay-access/REVIEW.md). Live desktop passes; owner-reported QoreX browser-access acceptance passes. |
| Workspace request timeouts / uncertain writes | [Review and owner read-back](audit/2026-11-19/workspace-timeouts/REVIEW.md). No automatic resend; read-only state check preserves editor. Failure cases use local fixtures. |
| Enforced browser resource policy | [CSP evidence](audit/2026-11-19/csp-enforcement/REVIEW.md). Actual desktop and owner mobile/account/fresh-workspace checks; authorized embedding not independently observed. |
| Legacy invitations | [Migration regression](audit/2026-11-19/legacy-invitations/REVIEW.md). NULL-code legacy links fail closed; owner can issue a fresh coded invitation. No live bulk revocation. |
| File verification | [Latest error review](audit/2026-11-19/verifier-errors/REVIEW.md). Actual desktop original match/changed mismatch/missing-record; owner QoreX match/mismatch passes. RPC/file-read failures are separately fixture-tested. |

## Security review classification — 22 November owner clarification

The owner confirms the planned security fixes and hardening for the hackathon submission were completed. Source and retained engineering evidence support implemented workspace isolation, scoped credentials, human admission checks, relay rate limits, error handling, recovery-code access, quotas, privacy warning, withdrawal authorization, and signature/version guards. Do **not** present these completed repairs as open engineering tasks. Distinguish them from intentionally disclosed design/operational boundaries: hosted draft text is not end-to-end encrypted; recovery codes are bearer credentials; automatic delivered alerts and independently tested full-service database restore are not claimed. These are not asserted to be mandatory hackathon release blockers. Independent two-person acceptance is the only outstanding owner-planned participant validation step. This paragraph records the owner's scope/completion decision; it does not certify security or imply unimplemented features are live.

## Current operational limits

Workspace: 50 drafts including Trash, 200 retained revisions per draft, 100 invitations per draft; list pages 20. Request windows are one minute: 120 owner reads, 30 owner writes and 30 review attempts per invitation. A separate 600/min service-write ceiling and 4096-scope bookkeeping limits provide bounded emergency protection, not proof of fair service under every attack.

The 64 MiB budget measures retained UTF-8 application text in drafts/revisions/invitation snapshots/feedback. It excludes physical database pages, indexes, metadata, bookkeeping, backups and provider billing. [Accounting definition and limitations](audit/2026-11-19/capacity-implementation/REVIEW.md).

Private drafts are stored on the service without end-to-end encryption. Recovery codes are bearer secrets. Downloaded/reviewer copies, public chain metadata and provider backups are outside the live-row deletion guarantee. A lost document cannot be recreated from its fingerprint.

Deferred operational work for the current hackathon build: automatic alerts and tested service-wide database recovery remain disclosed limitations, not additional organizer submission requirements. The owner redirected work toward the listing, demo and actual participant acceptance. Storage/readout verification is complete.

- [Provider storage/recovery review](audit/2026-11-19/provider-storage/REVIEW.md) is PARTIAL: live meter7139retained-text bytes/64MiB, protected D1 size readout owner-verified at159744bytes (156KiB), initialized/reconciled/normal. Automatic notifications and provider backup retention/restore remain unverified. Current official Plus/Pro hosting inclusion and published10GB database limit are documented; account-specific quota/billing not inspected. Source rollback is not database recovery.

## Completed audit and submission; ongoing validation

- **Audit work COMPLETE:** runs, exact source/report binding, all five V2 finding dispositions and supporting regression evidence are retained in the [completed assessment](audit/2026-11-19/ai-audit-assessment/ASSESSMENT.md) and [response ledger](withdrawal/AUDIT_RESPONSE.md). Owner confirms the requested audit work is finished. Original bot reports are preserved as issued, including the65/100HIGH rating; they are historical artifacts, not an unfinished project audit task. We recommend contextual review of repeated bot findings against the supplied source/tests. No clean reissued report or external certification is claimed.
- Independent participants have not yet completed the full two-person workflow. Owner switching wallets is not independent-user acceptance.
- Relay abuse protection is deployed: provider-verified short-lived access with atomic session/service budgets, no trusted caller IP assumption. [Live desktop/refusal evidence](audit/2026-11-19/relay-access/REVIEW.md) passes; **owner-reported QoreX browser-check acceptance passes**. Provider-level DDoS protection/fairness is not claimed.
- Authorized embedding has not been independently observed with the enforced CSP.
- **Final submission check COMPLETE — owner confirmed20November2026:** video, website/repository links, saved project listing and testnet address checked; project submitted. [Listing copy](compliance/PROJECT_LISTING_COPY.md), [AI disclosure](../AI_USAGE.md), [cover](assets/project-cover-v3.png) and [video](https://youtu.be/Q-D4JEWY2oo) retained. This records owner confirmation rather than a new agent portal inspection.
- The public timeline was observed showing main merge8545f47 on19November. Later commit display is separate historical integration evidence, not additional owner submission work. Earlier planning-copy observations are superseded by the owner's final listing check.
- **Owner confirmation, 22 November 2026:** Public My Space progress updates and Ship Weeks checks are complete and up to date. Earlier `READY / NOT POSTED` and `fresh official Check unobserved` statements describe the older observation state and are superseded as owner-reported status. No fresh independent portal read-back or specific organizer award/acceptance is claimed. Q-Day registration remains a separate matter; no Q-Day entry is asserted.
- Application history is now merged into main. This resolves the prior branch divergence; hackathon timeline display must still be observed separately.

The [combined correction plan](audit/2026-11-18/full-review/COMBINED_CORRECTION_PLAN.md) is historical with dated updates. This index and [progress log](progress-log.md) show later acceptance. The owner confirms the final submission and portal checks were completed; a separate independent organizer acceptance/award is not claimed. Do not treat site badges as agreement-workflow proof.

## Reproduce and inspect

[Build/deploy](BUILD_AND_DEPLOY.md) · [Audits](AUDIT.md) · [Research](research/WHY_THE_RECORD.md) · [AI disclosure](../AI_USAGE.md) · [Progress log](progress-log.md) · [Historical README](history/README-before-2026-11-19.md)
