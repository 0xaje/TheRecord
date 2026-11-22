# Ubuntu scoped-window test: disposable account

> **Current status — 22 November 2026:** This is a dated procedure and execution diary. Its opening “live proof still open” and later “PENDING” statements reflect earlier checkpoints and are superseded by the completed [V2 scoped-window live proof](../withdrawal/SCOPED_WINDOW_LIVE.md) and [current status](../CURRENT_STATUS.md). The original and V2 proofs target **different contract addresses** and must not be conflated. Owner confirms My Space/Ship Weeks checks complete; independent two-person participant testing is pending. Do not rerun historical signing/broadcast commands merely to satisfy outdated checkpoints.


Status: tool preparation tested locally; **live registration and scoped-window
proof are still open**. QoreX mobile refused the website's
`MsgOpenEVMWindow` request with “managed by the wallet itself, not by a website.”
This is an enforced wallet boundary. The web page is now inspect/check-only.
We do not bypass that wallet or request either existing wallet's phrase.

## First checkpoint — generate public addresses only

Use Ubuntu/WSL with Node24.22.3, the supported repository environment. From
PowerShell, enter Ubuntu if needed:

```powershell
wsl -d Ubuntu-22.04
```

Use a separate checkout so the existing application folder is untouched:

```sh
git clone https://github.com/0xaje/TheRecord.git ~/TheRecord-window-test
cd ~/TheRecord-window-test
node --version
npm ci --include=dev
node scripts/scoped-window-cli.mjs init
```

If the directory already exists, stop rather than deleting or resetting it.
If dependencies report an unsupported Node version, install/use Node24.22.3
before continuing (the repository's `.nvmrc` pins it). No transaction occurs in
`init`. It writes a new 24-word recovery phrase to a private file on **your own
computer**, with mode0600, outside the repository:
`~/.local/share/the-record-window-test/account.secret`.
It prints public native/EVM addresses and the plan, never the phrase or key.
The file is unencrypted: keep it private, use this account only for this Diana
test and keep only test tokens on it. Do not upload/paste/open its contents in
chat. The tool refuses to overwrite an existing account or load a world/group
readable file. Re-running `plan` reopens the same local account:

```sh
node scripts/scoped-window-cli.mjs plan
```

Share only the printed `nativeAddress` and `evmAddress` at this checkpoint.
The account uses the SDK's unified coin60 identity and canonical PQC derivation,
so its native/EVM forms refer to the same account. No existing QoreX account is
modified, rotated or imported. Do not assume it is one of the agreement's two
existing signers.

## Funding and read-only status — next checkpoint

After the public addresses have been reviewed, fund the new account with test
QOR (2 test QOR or a faucet grant is sufficient for the planned small native
transactions; fees/registration still must be checked). No mainnet funds.

```sh
node scripts/scoped-window-cli.mjs status
```

`status` makes only read requests to fixed Diana endpoints, verifies the native
chain and EVM9800, and prints balance, key match/proof status and window state.
It can also reconcile an already submitted pending hash and save a public
receipt locally. A zero balance/unregistered key is expected before funding
and registration. Do not infer a successful transaction from local status alone.

## Reviewed registration — only after funding/status

`register` requires both flags below and the **new disposable** public EVM
address. Replace `YOUR_DISPOSABLE_EVM_ADDRESS` with the exact printed address:

```sh
node scripts/scoped-window-cli.mjs register --broadcast --confirm-address YOUR_DISPOSABLE_EVM_ADDRESS
node scripts/scoped-window-cli.mjs status
```

This sends one classically signed bootstrap registration with a locally generated
ML-DSA-87 proof of possession. It is not an agreement approval. The proposed
native transaction fee is120000uqor with600000gas; the chain's registration
charge is additional. The tool checks Diana and requires at least1testQOR before
this step. It refuses mismatched registered keys and never rotates keys.
Wait for committed success and `possessionProven:true`, `pqcKeyMatches:true`.
A broadcast acknowledgement is not a committed success receipt.

The tool journals a signed transaction's hash before broadcasting. Unknown
outcomes stop further broadcasts. Run `status`, retain the public hash and
resolve it before repeating any command. Rejected CheckTx/persistently unknown
outcomes may require diagnosis; do not delete the journal or retry blindly.

## Scoped opening — prepare the paired call test first

Do not open a window until the permitted-call and outside-scope test are ready;
otherwise the window can expire while we prepare the next command. The prepared
command, only after the preceding review/checkpoint, is:

```sh
node scripts/scoped-window-cli.mjs open --broadcast --confirm-address YOUR_DISPOSABLE_EVM_ADDRESS
node scripts/scoped-window-cli.mjs status
```

This sends one hybrid-signed native message with fixed policy:600blocks,
5transactions,1000000uqor allowance and **only**
`0x25721b3be0f24438da7daed4c800b073ef9bb802` allowed. Native fee80000uqor,
400000gas, separate from the allowance. The allowance covers EVM value plus
maximum EVM fees, not the opening fee. No delegation, validator scope or arbitrary
contract target is set. Opening replaces the account's previous window.

Only `register`/`open` with explicit broadcast flags may sign/send; `init`, `plan`
and `status` cannot. Endpoints are fixed to Diana. Private signing material is
not printed or sent: only ordinary public transaction bytes go to the chain.
After a committed opening, `status` validates the decoded receipt and read-back.
Public receipt summaries are saved next to the secret file, without key material.
Copy only those public JSON files/hashes for evidence, never `account.secret`.
The web helper can check a pasted native opening hash without signing.

## Acceptance and limits

Local tests cover private-file permissions/non-overwrite, secret-free public
output, refusal without broadcast/address confirmation, locally valid PoP and
offline SDK signing. These are **not live-chain proof**. Existing scoped message
codec/receipt checks and all earlier regressions also run through `npm run check`.

Still required: real committed registration with possession proof; scoped opening
receipt plus live read-back; a genuine permitted The Record call and an actual
outside-scope rejection. No wallet/chain success is claimed until those are
captured. Independent two-person agreement testing and accepted second-stage
QCAI audit remain separate requirements.

Official API references: [SDK window reference](https://docs.qorechain.io/developer-guide/evm-window-reference/),
[post-quantum registration](https://docs.qorechain.io/developer-guide/post-quantum-signing/).

## Paired admission test (after committed registration)

Owner supplied registration A890AEFB5AA163B952134504E2B92C4D5855145384A1655FFEEBDC9E2349AF78: code 0 at height 10325363; registered, possession-proven and key-match checks true. Native account qor1fvtxdkq957re42zenhw4scrvplxrqwslf6lt4v; EVM 0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f. Owner also ran all 24 earlier checks successfully on Ubuntu. These are owner-supplied outputs, not a fresh independent chain lookup.

Review the offline plan first:

```bash
node scripts/scoped-window-proof.mjs plan
```

The paired run (only after plan review) opens the fixed 600-block/5-transaction/1-QOR window scoped only to The Record; waits for its committed receipt and live read-back; creates a separate public test record with the script's exact test text and the existing first signer plus the disposable account; verifies its Proposed event; then submits a signed zero-value transfer to the disposable account itself, outside allowed_targets. It does not approve agreements or change existing records. Each EVM attempt has a maximum fee cap of 0.1 test QOR, plus the separate 0.08 test QOR native opening fee. The window expires automatically.

```bash
node scripts/scoped-window-proof.mjs run --broadcast --confirm-address YOUR_DISPOSABLE_EVM_ADDRESS
```

Public evidence is stored in ~/.local/share/the-record-window-test/scoped-proof.json, separately from account.secret. A started marker prevents automatic repetition. Unknown outcomes stop the run. Do not delete the marker or rerun blindly. Raw signed bytes and secret keys are not written to evidence or printed. Only share the public proof JSON, never account.secret. A generic gas/nonce/window-expiry error is not target-scope proof. Target-specific rejection text is conservatively classified; otherwise retain the response for manual diagnosis.

Local preparation: npm run check passes 25 tests, including exact proposal-event validation and rejection of wrong IDs/fingerprints/status/targets. No live paired run has been performed by the agent. The scoped-window milestone stays OPEN until actual evidence is reviewed. My space update draft READY, NOT POSTED: Fresh disposable Diana account registered with possession proof; Ubuntu checks pass; paired scoped-admission test prepared. Live allowed-call/outside-target evidence still pending.

## Live owner result and read-only review — 18 November 2026

Owner supplied successful scoped opening AEC0DA9D1B75BB795CA4A16781E74580DA991F6B2803115CF6E048F6DBFD60DB, code 0 at block 10325763, one allowed target (The Record), 600 blocks/5 transactions/1000000 uqor. Permitted creation 0x389c084db6f9b64d3c97413f6f94b2c0851ec16ed4e33519b2b2740ae1403f01 succeeded at block 10325767 with matching Proposed event. Agreement ID 0xf6d7e510ed5b847540d256c607d264bbf49bbac10a16bd7e5ac16bdb372aea74; fingerprint 0x64d36259f6bff15f3fde0af30c0507c668de39284d952dbf81a893251641177c.

The outside self-recipient attempt (locally calculated hash 0x7ded98d016e2bdec559be21c1d8450321bfd7d8891e2b76d87546e54fb7e5a95, not a committed receipt) was refused by eth_sendRawTransaction, code -32000, specifically: the window does not list 0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f as an allowed recipient. Before/after snapshots remained live with 4 remaining transactions and 966250 uqor; used count stayed 1 and used value 33750. The suffix "window exhausted" is generic wrapping, not evidence of depleted bounds here.

The initial checker missed the chain's specific text and incorrectly left complete false. The outside.submitted false field also meant no successful acknowledgement, not that the RPC attempt was never made. Fixed classifier now recognizes the exact recipient-specific wording. Preserve the original owner JSON and run the read-only review (no signing, no broadcasting):

```bash
node scripts/scoped-window-proof.mjs review
```

It writes scoped-proof-reviewed.json alongside the original, checks matching live snapshots, unchanged usage and target-specific refusal, and never repeats the live run. These results are owner-supplied, not an independent fresh endpoint retrieval. Judge review: scoped admission behavior demonstrated in supplied evidence; no claim that this test finalized an agreement or proves mobile provider support. Earlier two-wallet agreement evidence is separate. Stage 2 audit acceptance and independent friend testing remain open.

My space update draft READY, NOT POSTED: The Record passed a real Diana scoped-window test: its allowed contract call succeeded, while a signed zero-value transaction outside the allowed recipient list was rejected. The opening and permitted transaction receipts are listed above. The checker wording bug was corrected without repeating transactions.

## V2-specific scoped-window checkpoint — 19 November 2026

The earlier successful proof targets the original contract. It is retained unchanged and is not a proof for V2. This checkpoint addresses the category requirement “Scoped EVM window”; it does not establish event acceptance of the separate audit requirements.

Acceptance: open a hybrid-signed window allowing only verified V2 address `0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f`, create one disposable public test record there, then obtain a recipient-specific refusal for a zero-value self-transfer while the window retains time, transaction and value capacity. Save the successful native opening, permitted EVM receipt/Proposed event, exact outside RPC refusal, and live before/after snapshots with unchanged usage. No agreement approval or existing agreement edit is involved. This replaces any previous window for the disposable account. It does not restrict individual functions on the allowed contract.

Start with the offline plan only:

```bash
cd ~/TheRecord-window-test
git pull --ff-only origin withdrawal-amendments
node scripts/scoped-window-proof.mjs plan --deployment withdrawal-v2
```

Expected account: `0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f`; native `qor1fvtxdkq957re42zenhw4scrvplxrqwslf6lt4v`. Expected bounds: 600 blocks, 5 transactions, 1 test QOR allowance, separate 0.08 test QOR opening fee and maximum 0.1 test QOR EVM fee per attempt. Review the public plan before broadcasting. Do not initialize a replacement account or paste the secret file.

After confirming that plan, the owner-run command is:

```bash
node scripts/scoped-window-proof.mjs run --deployment withdrawal-v2 --broadcast --confirm-address 0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f
```

The new evidence files are `scoped-proof-withdrawal-v2.json`, `scoped-proof-started-withdrawal-v2.json`, and (if reviewed) `scoped-proof-reviewed-withdrawal-v2.json`, in the same private account directory. The native pending-transaction lock remains shared, preventing overlapping submissions. Opening receipt is separately named `open-withdrawal-v2-receipt.json`. Existing legacy proof/marker/review/open-receipt names stay unchanged. Missing deployment flags still select legacy; unknown deployment IDs are refused. Never delete markers to repeat an uncertain run.

Local verification: build and 39 automated tests pass, including V2/legacy receipt separation, wrong-target refusal, unchanged old evidence, and offline plan/no-broadcast checks. Contract source is unchanged. Live V2 run is PENDING; do not count local fixtures as Diana proof.

Judge review: tooling is ready, but this checkpoint stays OPEN until the owner supplies the V2-specific live result. Independent participant testing and audit/event acceptance also remain open. Ship Weeks: four completions were previously reported by owner; a fresh event Check has not been observed, and no new challenge completion is claimed here. Q-Day registration is past; no entry claimed.

My space draft — READY, NOT POSTED: Prepared a separate scoped-window proof for TheRecordV2, preserving the original-contract evidence. The build and all 39 automated checks pass. Live V2 allowed-call and outside-recipient evidence is the next checkpoint; no live success claimed yet. Attach the preparation commit when publishing.
