# Ubuntu scoped-window test: disposable account

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
