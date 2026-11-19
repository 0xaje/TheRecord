# Approved A06 implementation: application capacity and private usage readout

19 November 2026 WAT. Owner approved the recommendation with “proceed”. This checkpoint implements the application-text budget, protected operator readout, initialization tooling and bounded limiter records. The full A06 milestone remains OPEN: real new-workspace anti-bot integration and provider metrics/alerts are not implemented or verified by this checkpoint.

## What changed

Schema-only migration0010_service_capacity adds the usage table and metering triggers. No old SQL migration changed and no existing rows were deleted or backfilled during migration. Drafts, retained revisions, invitation snapshots and feedback are accounted by actual UTF-8 byte lengths. Counters change in the same SQL statement as the corresponding mutation; an over-budget result raises ABORT and reverses the entire save/share/feedback statement and dependent triggers. Trash, restore and owner transfer do not change retained text. Normal permanent deletion decrements text and row counts atomically; a failure rolls them back together.

The configured application-text budget is67108864 bytes (64MiB), with80% warning and90% review states in the private readout. It excludes database pages, indexes, metadata, request-limit records, invite_codes and backups. It is NOT a physical disk ceiling, a Cloudflare quota, a spending cap or a guarantee that the service cannot be overloaded. Reads/downloads remain available at the text ceiling, subject to independent request/platform limits; growth writes fail with a clear503 and no false success or automatic resend. Existing data already exceeding a chosen limit remains intact and readable.

Request-limit scopes now have a4096-row admission ceiling. Stale cleanup is bounded to100 records and runs before insertion so expired records can free space. Existing live scopes are not evicted to admit arbitrary new keys. At saturation an unseen scope receives429/Retry-After; this bounds storage but can temporarily deny new legitimate scopes. It is not fair, unique-person or trusted-source admission. The remaining anti-bot work is important.

## Private operator interface

GET /api/operations/capacity returns only aggregate byte/count metrics, limit/status, timestamp, bounded-inventory completeness and accounting reconciliation. It never returns draft text, owner IDs, recovery keys or invitation codes. The expected SHA-256 of a strong random operator token is stored in the runtime secret RECORD_OPERATIONS_TOKEN_SHA256; the token itself is kept in a private0600 file, never committed, printed or put in a URL. Missing/wrong authorization fails before database access.

POST /api/operations/capacity/initialize requires the operator token, exact same-origin header and explicit X-Record-Operation: initialize-64MiB. The bounded baseline uses one atomic SQLite INSERT...SELECT over a single snapshot, not a multi-request backfill. It refuses more than2000 rows in any payload table and refuses to reset an existing baseline. This provides the race-free initialization planned in the proposal without an extended multi-page maintenance scan. Saving is temporarily paused before initialization; existing reads continue. Other already-running writes are serialized by SQLite, and installed triggers meter subsequent mutations. If an existing service exceeds the bounded inventory size, initialization stops without editing/deleting data; a separately reviewed maintenance approach is then needed.

The readout compares the counter and bounded inventory in one SQLite snapshot to avoid false drift reports during concurrent writes. Larger inventories are explicitly marked incomplete; no full reconciliation is claimed. Raw hosted usage remains private; public evidence records pass/fail states and the reviewed budget only.

## Verification and live evidence

- All53 Node/build checks pass; check.txt includes ten new capacity tests, plus existing workspace/withdrawal/storage regressions. No contract source changed, so no new contract deployment, paid audit or chain transaction was required.
- Real isolated SQLite tests cover exact-fit and multibyte UTF-8, overflow rollback with retained revisions, preserved reads at capacity, snapshot/feedback metering, Trash/restore/owner-transfer neutrality, deletion and dependent-deletion rollback, existing over-budget initialization, competing growth writes, operator authorization/privacy, bounded inventory refusal, drift detection and counter-scope saturation/expiry cleanup. These are tests, not live cryptographic proof.
- Site47 deployed successfully, source ca5e632eb4e4f078cc67cb6cf785e55f7460b18a, saved version appgprj_6af8daf3a96c81918026a69ec89cfb47~appgver_ed542e293ba08191ab03cfa76d7764a9, deployment appgdep_6afe40c24290819197aa692b19c8861e, environment revision3. Exact Worker/new migration/journal package hashes are in deployment.json.
- The actual hosted bounded inventory was exhaustive and fit64MiB. One atomic initialization succeeded and reconciled; no records deleted/reset. live-initialization.json. This is real aggregate application usage evidence, not provider disk/billing data.
- Hosted unauthenticated and wrong-token requests returned401; hosted-auth.json. Authorized readout worked. A temporary bootstrap operator credential was used privately; owner-local credential handover is still required.
- Ten hosted requests in a fresh non-sensitive workspace passed create/revise/both revisions/share/review/Trash/revoked-review/read-Trash and invalid-route/origin refusal. One harmless draft remains in recoverable Trash, key stored privately under ignored .record-local. hosted-workspace.json. No live saturation or permanent deletion test performed.
- After that controlled lifecycle the live meter reconciled again, reported normal status and observed positive usage growth. hosted-reconciliation.json. Totals and secrets are deliberately omitted from public evidence.

## Exact next owner step: operator ownership

In Ubuntu, pull the working branch and create your own local operator credential:

```bash
cd ~/TheRecord-window-test
git pull --ff-only origin withdrawal-amendments
node scripts/capacity-operator.mjs init
```

Share only the printed publicTokenSha256 output. Never share operator.secret. The file lives at ~/.local/share/the-record-operations/operator.secret. This creates a separate operations credential; it is not a wallet or workspace recovery code. After setting that public hash in runtime secrets and applying the environment revision, the bootstrap credential will stop working. The owner can then run:

```bash
node scripts/capacity-operator.mjs status
```

Do NOT run initialize again: the hosted baseline is already established. The command refuses resets, but ordinary operation only needs status. If init reports an existing file, retain it and inspect locally rather than deleting it; no replacement secret is generated automatically.

## Blunt review and remaining A06 gates

Application-text containment and private aggregate inspection are live and tested. This is meaningful protection against unlimited retained text, but exhaustion remains a denial-of-service risk and request counters are not identity proof. Monitoring here is a manual private readout with warning states; no automatic alert schedule or provider billing monitor is running.

Still missing: owner operator handover, a real production challenge widget/sitekey/secret for the actual domain, server-side challenge verification/admission binding and replay handling, actual desktop/QoreX compatibility acceptance before enforcement, and confirmed provider metrics/alert access. No mock/test challenge key or disabled UI is claimed as live admission protection. No mandatory sign-in, hosting migration, paid plan, custom domain or new vendor account was introduced. Do not close A06 or the whole backend milestone yet. Other audit corrections A11/A15/A17 and independent user acceptance remain queued/open.

Event scope: engineering reliability only; existing Diana/pqcVerify/withdrawal/scoped-window evidence is separate. Ship Weeks four owner-reported completions, fresh portal Check unobserved; Q-Day past/no entry claimed. No new official score or audit finding closure claimed.

## My space update — READY, NOT POSTED

I added an application storage budget and a private usage readout to The Record. Saves that exceed the retained-text budget roll back completely; existing drafts remain readable. All53 automated checks pass, and hosted checks confirm normal saves, revision history, review invitations and Trash still work with reconciled usage accounting. Anti-bot admission and provider billing alerts remain separate open checkpoints. These controls do not change the QoreChain contracts or replace the existing Diana receipts.

### Owner operator credential configured —19November

Owner created their operator file on Ubuntu and supplied only publicTokenSha256. The reviewed public hash was configured in the runtime secret and Site47 redeployed at environment revision4, deployment appgdep_6afe4276bc6c81918b78c8d315f024a6. Source and counters were not changed/reset. A real request using the temporary bootstrap credential now returns401. Positive owner access still needs the owner-local `node scripts/capacity-operator.mjs status` result; the agent does not possess or request that private token. operator-handover.json records the configuration/revocation check. Do not run initialize again. Anti-bot integration/provider alerts remain open.
