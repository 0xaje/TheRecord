# The Record — engineering and judge review

Review date: 18 November 2026. Reviewed GitHub commit:
`f57bd5e23a311691d18fd6da72108e81487a8150`.
Public release: Site version 30. This review adds tests and evidence; it does
not change the deployed application, contracts, database schema or wallet keys.

## Verdict

The Record has a working testnet cryptographic core and a coherent product
story. It is not ready for an unconditional end-to-end release sign-off.
No critical approval bypass was demonstrated in the checks performed.
That is not proof that the system has no vulnerabilities.

The core purpose is achieved for the recorded controlled-wallet cases:
identify an exact file, require two designated approvals, detect a changed
copy and preserve earlier finalized versions after amendment. The broader
promise of an accessible, complete accountability workflow remains partial:
there is no product history view, private draft text is overwritten on save,
and independent users have not completed acceptance testing.

## What was actually checked

| Area | Result and evidence |
| --- | --- |
| Clean source | Exported current GitHub main into a fresh directory; `npm ci` and `npm run build:site` passed. |
| Source versus hosted app | `/` and `/verify.js` matched the current local build byte-for-byte. SHA-256: HTML `eb5331616be0c2f3e7b5717781b671add63640e17df41b14ac3f9e6871b9b9d4`; JS `a4a7a8fa35301eda8b3a5ecf94c4d6e8237f4c9c03f86630801d9fc90bca518b`. |
| Live routes | Home, JS, Walkthrough, Blog, Credits, original sample and draft list returned HTTP 200. |
| Live database workflow | Nine checks passed: create, invitation, correct review, wrong-code rejection, new revision, stale-invite rejection, new invitation, revocation and revoked-invite rejection. See `live-api-checks.json`. |
| Database regression | Two test cases containing multiple assertions use real in-memory SQLite with all four migrations and a D1-compatible statement interface. Ownership, feedback, expiry, revision conflicts, revocation, input limits, origin checks and missing storage passed. This is isolated testing, not proof of deployed D1 concurrency semantics. See `backend-tests.txt`. |
| Diana signature regression | Recorded valid signature accepted at historical pre-inclusion state; duplicate, cross-version replay and altered signature rejected. See `diana-regression.txt`. Read-only calls; no new chain transaction. |
| Current real agreement | Versions 1 and 2 of `0x7579231974eb436db32c687b8d89cc0ddf39434156d7aa99131fb309a03c678e` both returned mask 3 and finalized true with their distinct expected fingerprints. See `live-chain-state.json`. |
| Dependencies | `npm audit --json` reported zero known vulnerabilities. This checks published advisories, not all defects or supply-chain risks. |
| Tracked secrets | Limited pattern scan of 37 tracked files found no obvious hardcoded private key/token. Not a comprehensive history/entropy scan. |
| Browser | Desktop workspace and recovery dialog opened and closed; no duplicate DOM IDs or unlabelled input/select/textarea controls found. Recent desktop landing, footer, Blog and scroll tracking were inspected. Not a WCAG conformance audit. |
| Phone | Previous original/mismatch/download results are owner-reported. Updated responsive layout and fresh independent wallet flow remain unverified. QoreX prevents screenshots on the owner's device. |
| Foundry | Six tests are present, with a previous 6/6 result recorded in `docs/AUDIT.md`. `forge` is absent in this review environment, so they were not freshly rerun here. |

The first new live API sequence timed out at an unidentified stage. A bounded
retest passed all nine checks. Treat this as an availability/diagnostics
observation, not a persistent failure and not a discarded result. The later
audit draft's invitations were revoked. Earlier attempt outcome is unknown;
all test content was non-sensitive and no transaction was requested.

## Findings, ordered by release importance

### R1 — High: required scoped-window evidence is incomplete

The supplied category text requires a scoped EVM window. Successful EVM
transactions and an expired-window error demonstrate dependence on a window,
but are not sufficient evidence of its exact permitted targets, duration,
transaction count and value limits. The app checks chain ID and gives an
expiry-related error; it does not display or validate the window scope.

Close with: a disposable test account's window-opening receipt and decoded
scope, a permitted The Record call, and rejection outside the documented
scope. Determine the organizer's exact meaning of scoped window before
claiming full compliance. Do not change chain architecture silently.

### R2 — High: two-stage audit acceptance remains unresolved

Both PDFs exist and `docs/AUDIT.md` explains the findings. The reported Stage 2
payment/duplicate-output issue means a second PDF alone does not establish
accepted completion of the required second stage. The recorded 65/100 score
is an external auditor's result, not a security certification.

Close with: organizer confirmation of this specific second run, or a genuine
accepted rerun with its report, run identifier/payment evidence if applicable,
reviewed source commit and disposition of findings.

### R3 — Legacy identity trust: deployment boundary checked

**Follow-up, 18 November:** the hosting identity guidance documents this as a
trusted sign-in header. A live anonymous POST remained 401 both without a
header and with a fabricated identity header; see `identity-gateway-check.json`.
The deployed boundary is supported by this evidence. Direct deployment behind
an arbitrary proxy remains unsafe without equivalent header protection.
Original audit observation follows.

`server/private-agreements.js` trusts `oai-authenticated-user-id` as a fallback
owner and uses it in the legacy move endpoint. A local handler probe confirms
that it accepts an arbitrary supplied value. The code itself does not verify
its provenance. A trusted gateway that strips caller values and injects its
own identity can make this safe; that gateway behavior was not verified here.
No attempt was made to read another person's live drafts.

Close with: document and test the gateway boundary using only owned test
identities, or replace/disable legacy access through a reviewed migration that
preserves existing owners' drafts. Do not delete legacy access blindly.

### R4 — High product gap: history is not a usable app feature

**Follow-up, 18 November:** the on-chain history view is implemented in release
31 with real event/state regression evidence in `history-checks.json`. The
private draft retention portion was subsequently implemented in release 33,
with additive migration and live revision/browser evidence in this directory.
Original audit observation:


On-chain `Proposed`, `Approved` and `Finalized` events preserve evidence and
`getVersion` returns a requested historical version. The UI has no real
history/timeline showing versions, signer approvals and receipt links.
The walkthrough's illustrated history is explanatory, not that feature.
`UPDATE drafts SET title = ?, terms = ?, revision = revision + 1` overwrites
private draft text. Share snapshots exist only for revisions that were shared;
there is no complete retained draft revision history.

Close with: read-only on-chain history and proof view first; then an approved
append-only private revision design if the full review history promise remains
in scope. Distinguish draft revision numbers from on-chain version numbers.
Do not retrofit or fabricate missing old text.

### R5 — High acceptance gap: independent complete workflow is pending

Existing evidence includes real private review-to-chain and two-wallet
finalization, but one person controlled the wallets. The latest presentation
release has not been accepted by independent participants. New read-only
checks do not replace a fresh complete wallet test.

Close with: two people on separate devices create/review/download, verify the
same bytes, approve the same version, verify mismatch, amend with fresh
approvals and recheck the original. Save agreement ID, both public signer
addresses, receipts, observed errors and final readback. Never collect phrases.

### R6 — Resolved by owner confirmation: historical wallet warning

On 18 November the owner explicitly confirmed that the wallet warning has been
solved. It is removed from active blockers. The earlier occurrence remains in
the chronological evidence; this closure is owner-confirmed, not a new provider
classification or a fresh independent reproduction.

### R7 — Backend bounds implemented; document retention remains open

**Follow-up, 18 November:** release 34 adds atomic draft/revision/invitation
quotas, fixed-window owner/reviewer/service limits, generic storage errors and
20-item workspace pagination. Nine SQLite test cases pass. See
`backend-bounds-tests.txt` and `live-backend-bounds.json` for the separate live
verification status. There is no claim of full DDoS resistance. Document
retention and delete/restore remain unfinished. Original audit observation follows.

Request bodies and individual terms are bounded, queries are parameterized,
workspace ownership is scoped, invitation tokens/codes have strong entropy,
and POST origins are checked. However, the source has no application-level
rate limit, per-workspace draft/share quota, pagination for listing drafts,
retention cleanup, or user deletion flow. Origin checking is not bot control;
a scripted client can set an Origin header. Hosting-level controls are unknown.

Close with: bounded creation/share quotas, list pagination, meaningful abuse
limits and documented retention/export/deletion policy. Use additive migrations
and preserve historical evidence. Avoid destructive cleanup of real drafts.

### R8 — Medium: “private” needs precise limits and secret handling

Draft text is stored as plaintext application fields. Provider disk encryption
was not verified; there is no app-level end-to-end encryption. Anyone with the
workspace recovery code can access that workspace; it lives in localStorage.
Blog distinguishes uploaded drafts from local file verification, which is good,
but the original master plan's stronger storage requirement is not proven.

`web/private-agreements.js` reads localStorage at module initialization without
a fallback. If storage access throws, this import can prevent the verifier's
remaining handlers from initializing. Both `localStorage.setItem` failures and
unsaved editor navigation need clear user handling. Reproduce under denied
storage before closing this robustness finding.

Close with: precise privacy/recovery copy, storage-failure isolation for public
verification, recovery/export checks and an approved storage threat model.
Actual encryption changes are an architecture decision, not a cosmetic fix.

### R9 — Medium: deployment and automated verification are incomplete

The README documents build and a DB binding but lacks a complete runnable
Worker/D1 deployment configuration, migration commands, tool versions,
backup/restore procedure and a single verification entry point. There is no
tracked CI workflow. Foundry tests and chain checks exist; systematic key
readiness, wallet-rejection, wrong-network, receipt-timeout, registration-relay,
accessibility and browser regression coverage remains limited.

This audit adds a repeatable backend regression file and sanitized evidence.
It does not pretend those additions provide full test coverage.

### R10 — Medium/low: browser policy and loading hardening

Live HTML/JS responses did not include Content-Security-Policy,
X-Frame-Options or X-Content-Type-Options. Browser JS is about 1.3 MB uncompressed,
including advanced mnemonic/registration tooling and walkthrough content on
every route. Split optional tools after profiling; do not remove a supported
fallback just to reduce size. Add a tested frame/content policy that preserves
QoreX behavior and account for the existing inline CSS and external fonts.

## Contract assessment

Positive: distinct nonzero parties, proposer-only amendments, finalized-before-
amendment, fresh zero approval mask for new versions, no duplicate approval,
fixed signature length, eligible registered ML-DSA-87 key with possession proof,
required verifier result, and domain-separated approval payload. No external
fund custody or user-controlled payout logic exists in this contract.

Limits: no cancellation/replacement of an unfinishable pending version; proposer
loss can prevent amendments; no stored signer public-key snapshot for easy
later key-rotation interpretation; anyone can relay a valid signed approval.
The last point is expected signature relay behavior, not an authorization bypass.
A competitor's extra features do not justify changing these rules mid-audit.
Add tests for zero/duplicate parties, nonexistent/old versions, same-fingerprint
amendment, key status failures and key rotation semantics. Historical state
reads do not execute all negative transitions on current deployed state.

## Dead code and repository hygiene

- Active imports connect `verify.js`, `private-agreements.js`, `approve.js`,
  `register.js` and `walkthrough.js`; none should be deleted as unused.
- Confirmed unused CSS candidates: `.story-main` and `.chapter-list button`
  selectors from the former chapter-button layout. They are a small cleanup,
  not the source of an approval problem. Remove with visual regression checks.
- `invite_codes` and reviewer email/ID fields are legacy schema artifacts. They
  are not read by the current manual-code path, but migration history must
  remain intact. Any DROP migration needs a compatibility/data review.
- `node_modules`, `dist` and `*.secret` are ignored; no generated tar archives
  were tracked in the reviewed tree. The local working directory contains old
  releases and parallel checkouts; those are not proof of GitHub dead code.
- MIT license, lockfile, contract source, six Solidity tests, evidence images
  and audit PDFs are tracked. Third-party illustration credit is retained.
- README should explicitly credit OpenMoji as well as source libraries, since
  the supplied event text asks for README credits. Add architecture, limits,
  deployment steps and tests. No `AI_USAGE.md` is present for the optional
  AI-Native award; prepare a truthful record before deciding to enter it.

## Event requirements cross-check

Source: the user's supplied `/TheRecord/Pasted text(4).txt`, read in full on
18 November, plus the live official documentation linked below. The pasted
conditions warn that rules can change. The live Rules portal was unavailable
to the web lookup; detailed numerical rubric weights remain unknown.

Category: “Build an EVM dApp whose sensitive actions receive post-quantum protection.”
Requirements: “Scoped EVM window, pqcVerify, two-stage QCAI audit, Foundry or Hardhat tests.”

| Requirement | Current condition |
| --- | --- |
| EVM dApp with protected sensitive action | Agreement approval uses pqcVerify; source and real receipts support this. Creation/amendment are ordinary EVM operations and depend on wallet/window policy; describe that boundary accurately. |
| Scoped EVM window | Partial: window use is evidenced; exact scope evidence still needed. |
| pqcVerify | Implemented; positive and negative historical checks passed. |
| Two-stage QCAI audit | Reports present; specific second-stage acceptance unresolved. |
| Foundry or Hardhat tests | Foundry source and earlier passing run present; fresh rerun blocked by absent forge here. |
| Public GitHub + MIT/Apache-2.0 + README | MIT and README present, repository was accessible through the linked connector. Signed-out public access should be rechecked at submission; web retrieval failed during this audit. |
| Build during event; library credits | Inspected commit history begins 14 November, within supplied event dates; not an independent originality certification. Add explicit illustration credits in README. |
| Video up to 3 minutes + testnet addresses | Addresses documented; final submitted video and portal fields not inspected. |
| Registration, GitHub/X/QoreX connected | Owner previously confirmed; current portal state not checked. |
| Ship Weeks | Authoritative evidence log records OWNER confirmation of all four tasks on 16 November. Swap and KEM registration receipts and PQC contract badge are linked. This supersedes stale later summaries mentioning only one earned task. Capture current portal Check results; do not claim direct fresh verification. |
| Q-Day Drill | Registration deadline in supplied text was 17 November 23:59 UTC, already elapsed. No confirmed drill registration in reviewed evidence. Do not claim Survivor eligibility or put regular wallets into the drill. |
| Public updates | Drafts exist; published status still requires owner confirmation. |

Official documentation confirms submission on 2 December 2026 at 23:59 UTC
(3 December at 00:59 WAT). The separate People's Choice period in the supplied
rules is 6–15 December; earlier trending is not proof of a final prize position.

## Comparison with winning projects

Reviewed OpenPayAI's repository/README and ETHGlobal finalist page, and
Payload Exchange's repository/README and finalist/prize page. These are
cross-event benchmarks, not the QoreChain scoring rubric. No full competing
repository audit or ranking of the 70 QoreChain submissions was performed.

Useful standards: a narrow understandable problem, explicit sponsor integration,
clear architecture, complete setup/environment/migration instructions, deployed
addresses and a reproducible demonstration. OpenPayAI documents its protection
checks and a detailed replayable demo. Payload Exchange documents its directory
structure, environment and database setup. Their awards do not certify their
security, and their use of test doubles is not a reason to replace our real
Diana evidence. The Record already has unusually concrete chain receipts; its
weakness is turning that proof into an independently usable product.

Sources:
- https://docs.qorechain.io/build-before-qday/overview/
- https://ethglobal.com/showcase/openpayai-89sbk
- https://github.com/luzianscherrer/openpayai
- https://github.com/luzianscherrer/openpayai/blob/main/README.md
- https://ethglobal.com/showcase/payloadexchange-x07pi
- https://github.com/microchipgnu/payload-exchange

## Judge assessment — subjective, not the official rubric

| Area | Assessment |
| --- | --- |
| Problem and focus | 8/10: clear need; narrow useful workflow. Differentiation needs independent user evidence. |
| QoreChain/PQC integration | 8/10: substantive contract verification, not a badge. Window/audit compliance evidence still incomplete. |
| Frontend/explanation | 7/10: coherent desktop story and useful live demo; latest phone acceptance incomplete. |
| Backend/security operations | 5/10: basic authorization/input checks are good; trust boundary, quotas, retention and storage model need work. |
| Tests/reproducibility/repo | 6/10: clean build, receipts and regression checks; deployment reproduction and automation lag. |
| Independent acceptance | 4/10: owner-controlled success, no independent full run yet. |

Overall judgment: around 6.5–7/10 as a hackathon submission today, with material
qualification. A credible contender, not a defensible predicted winner or top-N
rank. Required checks can block eligibility regardless of design quality.
The strongest next work is proof and reliability, not a new feature category.

## Ordered completion plan

1. Close required window scope and second-audit acceptance.
2. Verify/document the legacy identity gateway and add backend abuse bounds.
3. Implement the real read-only agreement/version/approval history view.
4. Agree and implement retained private revision/storage policy where required.
5. Add reproducible Worker/D1 setup, automated checks and targeted adversarial tests.
6. Complete phone and two-independent-person acceptance, including an amendment.
7. Consolidate current-state documentation, final video, public repo access,
   README credits, portal checks and My space publication.

Any change to cryptographic policy, database privacy architecture or contest
strategy needs the owner's review. This audit milestone records unresolved
items; it does not mark the release milestone complete.


## 18 November 2026 — reversible draft Trash (release 35)

Required behavior: owner-only Trash and restore, no edits/sharing while trashed,
atomic invitation revocation, saved revisions preserved, no chain changes.
Migration 0007 adds a nullable timestamp and revocation trigger. Active and Trash
lists are separately paginated. Restore does not reactivate old invitations.
Workspace recovery also works when every draft is in Trash.

Retention policy for this release: no automatic deletion. Trash retains text,
saved revisions and feedback; it counts toward the existing 50-draft quota.
Permanent deletion and a full retention/backup policy remain unfinished. This
milestone must not be described as erasure or full privacy completion.

Verification: all 10 SQLite regression tests pass, including legacy migration,
foreign-owner/stale requests, blocked writes, revoked review/feedback and exact
restored revisions. Build passes. Live release 35 API check PASS at
2026-11-18T10:39:23Z using one non-sensitive test draft, no wallet action.
Evidence: audit/2026-11-18/trash-tests.txt and live-trash-checks.json.
Hosting source bcea74f0b220ba8f505f62559c525f7155630d91.
Browser navigation failed and then browser security policy blocked inspection;
no bypass attempted. Visible desktop controls and physical-phone acceptance
are unverified. Keep milestone acceptance open for this UI check.

Judge review: server behavior has local and live proof; accidental removal is
recoverable and invitations fail closed. UI code is built/published but not
visually accepted. Permanent deletion/retention, storage-failure isolation,
encryption decision and independent acceptance still cost confidence. No new
cryptographic or contest qualification claim is made.

My space update DRAFT READY, not posted:
I added reversible Trash to The Record's private draft workspace. Live API tests
confirmed owner checks, blocked editing while trashed, revoked review links and
restoration of both saved revisions. Old links stay revoked after restore.
Desktop/mobile visual acceptance is still pending; no Diana records were changed.

Event/Ship Weeks start and end review: this is reliability work supporting the
Post-Quantum dApp workflow, not new proof of PQC approval. Four Ship Weeks tasks
remain owner-confirmed complete; fresh portal Check is unobserved. Q-Day Drill
registration expired without confirmed participation. Scoped-window evidence
and accepted second-stage audit remain open. Wallet warning owner-resolved.
Exact next action: verify the published Trash UI in an available browser/phone,
then isolate public verification from browser storage failures. No milestone
advance until required UI acceptance is recorded or its blocker remains explicit.


## 18 November 2026 — browser storage failure isolation (release 37)

Must work: denied localStorage must not abort public verifier initialization;
new/recovered/moved workspaces must not send writes before their recovery code
is persisted and read back. Existing identity stays in memory on failure; a
failed read-back attempts to restore the prior stored value. No new volatile-only
workspace fallback. Invalid saved codes show a clear recovery message.
Legacy signed-in drafts remain discoverable/movable when all are in Trash.

Verification: clean site build and 16 isolated tests PASS. Coverage includes
storage getter/getItem errors, malformed saved codes, quota/denied/silently
ignored writes, prior identity preservation, failed read-back rollback and the
built verifier registering its input/submit handlers despite denied storage.
A draft-save attempt in the isolated startup harness sends no POST when code
persistence fails. This is a DOM startup harness, not a real browser acceptance
run and not proof of the Diana agreement workflow. No chain responses mocked.
Evidence: audit/2026-11-18/storage-tests.txt. Published-code startup check result
is recorded separately; never infer mobile acceptance from that harness.
Hosting source fd2d538489f473cd932fd897d37a8eedf3b16f90, Site version 37 deployed.

Judge review: removes one shared startup failure point and prevents new drafts
from being written under an unpersisted workspace identity. Storage can still
be cleared later by browser/user action: users must save their recovery code.
Best-effort rollback is not a guarantee when the storage API is fully broken.
Draft text remains server-readable; no encryption claim. Real embedded-browser
acceptance and the Trash UI check remain OPEN due to earlier browser restriction.
Permanent deletion/full retention policy and independent testing remain open.

My space update DRAFT READY, not posted:
I fixed a reliability issue where blocked browser storage could stop The Record's
public verifier from loading. The verifier's built-code startup check now passes
with storage denied. Draft saves stop before a server write if the recovery code
cannot be stored. All 16 isolated regression checks pass; embedded-wallet visual
acceptance remains pending. No new on-chain workflow claim is made.

Event and Ship Weeks start/end review: no scope/track change. Public repo and
MIT license retained; existing real Diana evidence remains the basis for workflow
claims. Four Ship Weeks tasks owner-confirmed complete, fresh Check unobserved.
Q-Day Drill expired without confirmed participation. Scoped-window proof and
accepted Stage 2 audit still open; wallet warning owner-resolved.
Next: owner verifies published Trash/restore and storage warning in QoreX/browser;
then complete deletion/retention and deployment reproducibility work. Keep
blocked UI acceptance explicit; do not call the whole product finished.

Published-code check PASS at 2026-11-18T10:48:57.526Z; evidence: audit/2026-11-18/published-storage-startup.json. No wallet or chain transaction.
