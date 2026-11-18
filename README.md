# The Record

The Record lets two parties review an agreement, approve the same version on QoreChain Diana testnet, and verify a copy against its finalized fingerprint. The full text stays off-chain.

## Try the workflow

1. Open Drafts and save a private draft. Create an invitation and share its link and access code with the reviewer.
2. Open the invitation with the code and download the reviewed revision.
3. Use the exported file to create a Diana record with two registered signer addresses. Each signer verifies the same exported file and approves the same version. In QoreX Browse, use **Approve with QoreX**.
4. Verify the exported file against the finalized version. An amendment needs two fresh approvals.

[Live testnet app](https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/) · [Judge walkthrough](docs/judge-walkthrough.md) · [Diana evidence](docs/diana-evidence.md)

[QCAI audit reports and regression evidence](docs/AUDIT.md)

## Build

From the repository root in Ubuntu/WSL, using Node.js 24.22.3:

```sh
npm ci
npm run check
npm run start:local
```

Open **http://127.0.0.1:8788/**. See [build and deployment instructions](docs/BUILD_AND_DEPLOY.md) for database migration, identity boundaries, CI and deployment packaging.

The browser build is in `dist/` and the Worker entry point is `dist/server/index.js`. The hosted draft workspace needs a D1 binding named `DB`, the SQL migrations in `migrations/`. The reviewer uses the invitation link and code.

## Diana deployment

- Network: QoreChain Diana testnet, EVM chain ID 9800
- Contract: `0x25721b3Be0F24438DA7DAEd4C800B073ef9BB802`
- [Deployment receipt](https://dashboard.qorechain.io/explorer/tx/0x0cee4b8ec137fa45d2b765ddf2eaff928cd7571a02a9369eb5bff0b7ad9bfbfd)
- [Contract source](contracts/TheRecord.sol)

Signer key registration and approvals use `@qorechain/qoresign` 0.2.0. The app also uses viem for EVM operations, cosmjs-types for native transaction encoding, and esbuild for bundling.

The hosted workflow has been tested with two distinct wallets operated by one tester. Independent co-signer testing on the public site is in progress.

## License

[MIT](LICENSE)

## Review and regression checks

[Engineering and judge review — 18 November 2026](docs/audit/2026-11-18/review.md) records passing checks, open risks and release gates.

Use Node.js 24 for the isolated SQLite backend regression tests:

```sh
node --test test/private-agreements.test.mjs
node scripts/check-diana-approvals.mjs
node scripts/check-history.mjs
```

The second command makes read-only Diana calls. Solidity test instructions are in [AUDIT.md](docs/AUDIT.md).

Walkthrough illustrations are by [OpenMoji](https://openmoji.org/), used under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). See [asset credits](web/assets/ATTRIBUTION.md).

The [agreement history page](https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/history) reads real version and approval events from Diana and checks them against a fixed contract-state snapshot. It requires no wallet. Long scans can be resumed; incomplete results are labelled. Private draft revisions are available separately under Drafts → Saved revisions.

## Saved private revisions

Each new save retains a revision. Under **Drafts → Saved revisions**, open or download an earlier revision without changing the editor. Revision summaries are paginated, and content access uses the same workspace ownership checks as the draft. A workspace recovery code grants access to this history too.

Migration `0005_draft_revisions.sql` adds a table and atomic save triggers without rewriting earlier migrations or backfilling invented history. For existing drafts, the current text is the earliest available baseline; its original save time may be unknown. Text overwritten before this feature cannot be reconstructed. These private revisions are separate from Diana versions and are not end-to-end encrypted.

The optional live regression creates a non-sensitive test draft and requires explicit acknowledgement:

```sh
node scripts/check-private-revisions.mjs --live-write
```

No wallet or chain transaction is used. See the [live revision evidence](docs/audit/2026-11-18/live-revision-checks.json).

## Draft service limits and access boundary

Draft lists use 20-item pages; **Load older drafts** retrieves the next page.
Existing owners can still open a selected older draft after saving it.
The service permits up to 50 drafts per workspace, 200 retained revisions per
draft and 100 invitations per draft. Database triggers enforce these bounds
atomically. Existing content is not deleted when a limit is reached.

Fixed one-minute windows allow 120 owner reads, 30 owner writes and 30 review
attempts per invitation; a shared 600-request Draft API ceiling bounds overall
traffic. A 429 response supplies `Retry-After`. The shared ceiling can affect
all users under heavy traffic. These are application controls, not proof of
DDoS resistance; rotating recovery identities does not establish a real person.
Only expired rate-accounting buckets are cleaned here. Document retention and
delete/restore policy remain separate work.

Legacy signed-in identity relies on the hosting platform's trusted
`oai-authenticated-user-id` header. The live anonymous spoof probe returned 401.
Do not expose this handler through another host that forwards arbitrary caller
identity headers. Workspace recovery codes remain bearer secrets.

Migration `0006_backend_bounds.sql` is additive. It does not rewrite old
migrations or remove documents. Storage errors return a generic 503 rather
than exposing internal SQL details. The explicit live check below sends at most
63 invalid, non-sensitive requests to one random test workspace and creates no
records or chain transactions:

```sh
node scripts/check-backend-bounds.mjs --live-limit-check
```


### Reversible private draft Trash

Use **Move saved draft to Trash** in Drafts. Saved revisions are retained and
review links are revoked atomically. Open **Trash** to restore; issue a new
invitation afterward. Nothing is automatically deleted. Trash counts toward the
50-draft workspace limit. Diana agreement records cannot be deleted this way.
Permanent deletion is now available inside Trash; see the policy below. Hosting backup retention remains unverified.

Apply additive migration `0007_draft_trash.sql` after migrations 0001–0006.
Regression: `node --test test/private-agreements.test.mjs`.
Live acceptance (creates one non-sensitive draft, no wallet action):
`node scripts/check-draft-trash.mjs --live-write`.
See `docs/audit/2026-11-18/live-trash-checks.json`. Release 35 API checks passed;
owner-reported phone Trash/restore acceptance passed. Current visual desktop acceptance has not been independently repeated here.


### Browser storage failures

Public file verification initializes even when localStorage access is denied.
Drafts show a recovery warning. A new workspace, recovery switch or legacy move
stops if the recovery code cannot be persisted and read back; it does not write
new drafts under a temporary, unsaved identity. Save your recovery code outside
the browser: clearing site data can still remove the browser's copy.

Run `npm run build:site` before the combined regression checks:

```sh
node --test test/private-agreements.test.mjs test/workspace-storage.test.mjs test/verification-storage.test.mjs
node scripts/check-verifier-storage.mjs
```

The last command downloads the published JavaScript and checks startup in an
isolated DOM harness with denied storage. It does not prove visual mobile
acceptance or simulate a Diana approval. Current evidence is in
`docs/audit/2026-11-18/`.


### Permanent deletion policy (current)

Inside **Trash**, select **Delete permanently** and type `DELETE` in the
confirmation. The owner-only operation removes the draft, all saved revisions,
review invitations, legacy invitation codes and feedback from the live database
in one atomic statement. Cancellation keeps the draft. A changed revision or
Trash timestamp requires refreshing. Permanent deletion cannot be restored.

Downloaded copies, files already read by reviewers and public Diana records
remain. Hosting backup and infrastructure log retention/erasure are unverified;
this feature does not promise erasure of those copies. Request-limit accounting
is removed separately by bounded expiry cleanup. Nothing is automatically purged.

Apply additive migration `0008_draft_delete.sql` after migrations 0001–0007.
Checks: `npm run build:site` then the regression commands above.
The explicit live acceptance command creates one new non-sensitive draft and
permanently deletes only that disposable draft:

```sh
node scripts/check-draft-delete.mjs --live-disposable-delete
```

Do not adapt the script to delete existing user drafts. Deletion tests/evidence
are stored in `docs/audit/2026-11-18/`. Owner reported the phone Trash/restore
workflow passed; owner also confirmed permanent deletion worked on the phone. Hosting backup erasure remains unverified.


### Restricted-window helper (advanced test)

The real mobile test showed QoreX refuses website `MsgOpenEVMWindow` requests.
The `/#evm-window` page is now **inspect/check-only**, with no window-signing
request. It checks public native opening receipts entered by hash. See the
[Ubuntu disposable-account instructions](docs/compliance/UBUNTU_SCOPED_WINDOW.md)
for the SDK route. `init`/`plan` print public addresses without signing or sending;
separate `register`/`open` commands require explicit broadcast/address confirmation.
No existing QoreX phrase is requested. The owner completed a real scoped opening, permitted The Record creation and outside-recipient rejection on Diana. See the [scoped proof record](docs/compliance/UBUNTU_SCOPED_WINDOW.md#live-owner-result-and-read-only-review--18-november-2026). This SDK proof does not establish website-based QoreX window-opening support. The SDK is a development dependency for the CLI and codec tests.

## Submission readiness

See the [18 November readiness review](docs/compliance/SUBMISSION_READINESS.md) and [ready-to-paste project listing text](docs/compliance/PROJECT_LISTING_COPY.md). The public listing's original planning copy needs updating. Final demo video/listing fields, independent participant testing and exact event audit acceptance remain unverified.

Additional dependencies used in the scoped helper/CLI: @qorechain/evm 0.14.0 and @qorechain/sdk 0.14.0. The latter is development-only. Their use does not imply QoreSeal encryption or smart-account spending rules are implemented by this product.

## Problem evidence

[Why The Record exists](docs/research/WHY_THE_RECORD.md) maps primary court/regulator evidence to the exact-version approval problem, compares existing signing approaches and states what remains unvalidated. [Founder explanation draft](docs/research/FOUNDER_PITCH.md). Technical test results do not establish customer demand or payment enforcement.

## Pending-update withdrawal development

The withdrawal-amendments branch prepares a separate TheRecordV2 deployment. Existing contracts and records remain unchanged. The candidate is not activated on the public site. See [implementation, tests and owner checkpoint](docs/withdrawal/IMPLEMENTATION.md).
