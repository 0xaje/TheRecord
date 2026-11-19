# The Record — complete project-form update

Prepared 19 November 2026 after reviewing the entire 30.6-second owner video, frames 0–30.5s, current main README/AI disclosure/source/evidence and freshly retrieved official Rules/Prizes/Kits/public project page. **READY TO PASTE; NOT SAVED TO THE PORTAL.** The connected browser editor was unavailable in this conversation. Public read-back still shows planning copy. Plain text fields render line breaks, not Markdown/HTML: follow the README's problem → working flow → implementation → proof structure without pasting badges, Mermaid, HTML or Markdown tables into those fields.

## Field map in video order

| Field | Action |
| --- | --- |
| Name | Keep The Record. |
| Tagline | Keep Proof of the version you agreed to. It is clear and matches the existing listing identity. |
| Category | Keep Post-Quantum dApp. AI-Native is a separate optional award, not a category change. |
| Description | Replace all future/planning language with the Description below. |
| How it's made | Replace all planning copy with the technical narrative below. |
| Cover image | Current image is valid and usable. Recommended replacement: docs/assets/project-cover-v2.png, freshly generated in the README's mint/charcoal/yellow identity (1672×941pixels,1260229bytes; approximately16:9). Upload only a 16:9 cover, minimum 1200×675, up to 5 MB JPG/PNG/WebP. The README banner is2172×724 (3:1): do not upload it directly or stretch it. Brand artwork is not a captured UI or security certification. |
| Public GitHub repository | Keep https://github.com/0xaje/TheRecord — canonical owner0xaje, public main, rootMIT licence. |
| Video | Currently empty in video. Add only the final publicly accessible videoURL, actual duration of no more than 3 minutes. Do not paste this 30.6-second form-inspection recording as the product demo or leave a fakeURL. This remains pending. |
| Demo | Keep https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/ . |
| Testnet addresses | Use the three evidence-backed native qor1addresses below; one per line. Do not paste EVM0xcontract addresses into this field. Contract addresses belong in How it's made/README. |
| Kits and SDKs | Use the exact mapping below; duplicate TypeScript labels refer to different packages. |
| Network features | Tick only the five proven features below. Automatic portal badges are not a reason to declare unrelated product features. |
| Quantum Campus | Already ticked. Retain only if the solo founder is actively enrolled during the fest and can provide proof if requested. The prior mechatronics-study context is not fresh enrolment verification. Do not upload student documents publicly. |
| AI-Native | Tick. The root AI_USAGE.md documents AI-assisted development, generated work and founder contributions; expanded disclosure is prepared alongside this pack. This does not assert an AI agent runs inside the product. |
| Regional | Keep Nigeria; portal maps this to Middle East and Africa. |
| Save changes | Save the current fields, then reopen the public project page and confirm the rendered text/cover/links/declarations. Saving edits is not evidence that an unfinished video exists or every eligibility check passed. |

## Description — paste this field

The Record helps two parties prove exactly which version of an agreement they approved.

A document says Friday. A later copy says Monday. Which file did both people agree to? The Record connects the exact file fingerprint to two designated signing accounts, a version and an inspectable approval history on QoreChain Diana Testnet.

Draft the terms, share a saved revision for review, then record the agreed file and collect both approvals. Anyone can verify a copy locally in the browser: the original matches; a changed file fails. Amendments need fresh approvals, and earlier finalized versions remain verifiable. A pending amendment can be withdrawn by its proposer without erasing its history.

Document bytes stay off-chain. The live demo lets judges check original and changed files without a wallet, payment or document upload.

## How it's made — paste this field

Architecture
I built The Record with a JavaScript browser interface, Solidity contracts on QoreChain Diana Testnet (EVM chain ID 9800), a Worker API and a D1 database. The browser computes the selected file's SHA-256 fingerprint locally and compares it with the on-chain record. Saving a private draft is a separate action that stores its text on the service.

Post-quantum approvals
Each version names two designated signing accounts. QoreX keeps wallet keys inside the wallet and requests the approval signature. Before recording an approval, the contract checks the account's registered ML-DSA-87 key, algorithm and proof of possession through pqcKeyStatus, then requires pqcVerify to accept the signature. The payload binds the action, chain, contract, agreement, version, fingerprint and signer. A version finalizes only after both designated accounts approve it.

Amendments and withdrawal
The withdrawal-enabled V2 contract retains earlier finalized versions. Each amendment starts a new version with fresh approvals. The original proposer can withdraw a pending amendment with a separate post-quantum signature, then re-propose it under a new version number. Withdrawn history remains visible, and its approvals do not carry over.

QoreChain tools and scoped access
I use @qorechain/sdk 0.14.0, @qorechain/evm 0.14.0, @qorechain/qoresign 0.2.0, viem and the injected QoreX provider. A separate disposable-account SDK test opened a hybrid-signed EVM window restricted to the V2 contract. The permitted call succeeded; an outside recipient was refused while capacity remained. QoreX refused website-initiated window changes, so that proof uses the documented Ubuntu SDK route. The website's window screen inspects accounts and receipts.

Private review workflow
The service supports private workspaces, coded review invitations, saved revisions, feedback, Trash and deletion of live-service rows. Recovery codes control workspace access. Server-validated human checks, request limits, timeouts and retained-text quotas protect the hosted flows. Private drafts are access-controlled but not end-to-end encrypted; on-chain metadata is public. Database recovery and automatic operational alerts are not claimed.

Working evidence and challenges
Real Diana receipts demonstrate two distinct signer approvals, original-file verification, changed-file rejection, amendments, withdrawal and fresh approvals for the correction. I operated both test wallets; independent two-person acceptance is still pending. The repository records 89 build/Node checks, 24 Foundry tests and 16 historical Diana signature checks, with local fixtures distinguished from actual chain execution. Handling the unsupported wallet-window operation and preventing stale approvals from authorizing another version were important implementation challenges.

AI-assisted development and audits
I used ChatGPT/Codex for implementation, debugging, tests, documentation and visual direction, while I selected the product and policies, reviewed changes, operated the wallets and tested on QoreX. The root AI_USAGE.md explains the workflow and generated assets. QoreChain AI audit reports and finding-level project responses are retained separately. The latest V2 report is 65/100, HIGH, with auditor findings formally Open; the completed project assessment does not constitute independent security clearance.

Deployments and evidence
Original/demo contract: 0x25721b3be0f24438da7daed4c800b073ef9bb802
Withdrawal-enabled V2: 0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f
Source, walkthrough and evidence index: https://github.com/0xaje/TheRecord
Current evidence: https://github.com/0xaje/TheRecord/blob/main/docs/CURRENT_STATUS.md
AI disclosure: https://github.com/0xaje/TheRecord/blob/main/AI_USAGE.md

## Cover asset

Recommended upload: [project-cover-v2.png](../assets/project-cover-v2.png). Generated brand artwork, not a screenshot. The earlier cover remains unchanged on the portal until you upload/save this one.

## Testnet addresses — paste one per line

```text
qor1ap9phrpqk83nlswkm4r9pt6n0qljjy0dvatfll
qor1a07scvdu9tp998zu2xh8hskrxdlhndz2s4ljre
qor1fvtxdkq957re42zenhw4scrvplxrqwslf6lt4v
```

First two correspond to the public V2 approval-event signer addresses0xe84A1B8C20b1E33Fc1D6dD4650Af53783F2911eD and0xebfd0C31BC2Ac2529c5C51aE7Bc2c3337F79B44A using canonical qor Bech32 encoding. First matches the existing field; the video's other historical address is not silently claimed to be V2's second signer. Third is the documented V2 scoped-window account0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f. See docs/withdrawal/v1-first-approval.json, v1-finalized.json and SCOPED_WINDOW_LIVE.md. Public account identifiers only; never enter signing/recovery/operator secrets. Portal field allows up to 5 addresses.

## Kits and SDKs — exact checkbox mapping

| Portal group / option in visual order | Tick? | Basis |
| --- | --- | --- |
| QoreChain SDK — first TypeScript | YES | @qorechain/sdk 0.14.0 used by live disposable-account scripts. |
| QoreChain SDK — TypeScript (React) | NO | No @qorechain/react integration; browser is plainJS. |
| QoreChain SDK — next TypeScript (third option, EVM package) | YES | @qorechain/evm 0.14.0 and viem. Official Kits maps this option to @qorechain/evm. |
| QoreChain SDK — final TypeScript (fourth option, SVM package) | NO | No @qorechain/svm/Solana integration. |
| QoreChain SDK — Python/Rust/Go/Java | NO | Not the submitted SDK integrations. |
| QoreSign — TypeScript | YES; already selected | @qorechain/qoresign 0.2.0 is imported by browser approval/registration. |
| QoreSign — other languages | NO | Not used. |
| QoreX integrations — all listed package options | NO | Uses injected window.qorex provider directly, not @qorechain/qorex-types/rainbowkit/interchain-kit/cosmos-kit/wallet-mock/synpress packages. Explain real QoreX use in How it's made; do not install unused packages to earn a badge. |
| create-qorechain-dapp | NO | Not the scaffold used. |
| qorechain-pqc | NO | No direct submitted qorechain-pqc kit integration; QoreSign/SDK and chain precompiles cover the actual implementation. |
| QoreSeal | NO | Drafts are not a QoreSeal encryption product. Account registry detection alone does not establish app integration. |
| Wallet adapter | NO | No @qorechain/wallet-adapter integration. |
| RDK | NO | Not a rollup. |
| MCP + qore CLI | NO | Custom Node SDK scripts are not qore CLI/MCP integration. |
| Asset Kit | NO | No Asset Kit implementation. |
| QoreScan | NO | Explorer links do not mean using QoreScan's CLI packages. |
| Custody kit | NO | Not used. |
| Chain bridge | NO | Not used. |
| Handles | NO | Not an app feature/integration. |
| PQ light client | NO | Not running one. |

These are SDK-language labels, not a claim the whole source is TypeScript. The repository browser and scripts use JavaScript modules.

## Network features — every option

| Checkbox | Action | Evidence / reason |
| --- | --- | --- |
| Hybrid ML-DSA-87 transactions | TICK | Successful native window-opening receipt contains hybrid extension; separate from agreement signatures. |
| EVM window (incl. scoped) | TICK | Real V2 permitted call and outside-target refusal while capacity remained. |
| Solidity PQC key status | TICK | Contracts call pqcKeyStatus with registration/algorithm/possession/key checks. |
| PQC key registration with proof of possession | TICK | Registered eligible signing accounts and documented disposable-account registration. |
| Solidity PQC signature check | TICK | Contract pqcVerify guards and genuine approval/withdrawal evidence. |
| Smart accounts and spending rules | LEAVE UNTICKED | Window transaction/value limits do not establish a separate smart-account spending-rule implementation. |
| AMM pools | LEAVE UNTICKED | No product AMM; prior account activity/portal Verified badge is not product evidence. |
| IBC via QORel | LEAVE UNTICKED | No IBC flow. |
| RDK rollup | LEAVE UNTICKED | No rollup. |
| Light node | LEAVE UNTICKED | No light node. |
| Approved Native contracts | LEAVE UNTICKED | Solidity EVM contracts are not the native-contract facility. |
| Asset Kit | LEAVE UNTICKED | Not implemented. |
| QoreSeal and the encryption key registry | LEAVE UNTICKED | No document-encryption/registry workflow in the app. |
| Staking tiers | LEAVE UNTICKED | Not part of this product. |
| Test tokens fUSD, fETH, fBTC | LEAVE UNTICKED | QOR test fees are not those token integrations. |
| Cross-VM, EVM to Native | LEAVE UNTICKED | Native windows plus EVM calls are not proof of the Cross-VM feature. |
| Sidechain or paychain | LEAVE UNTICKED | Not implemented. |
| MCP server or qore CLI | LEAVE UNTICKED | Not implemented. |
| Sign In With QoreChain | LEAVE UNTICKED | Workspace recovery codes/QoreX connection are not this sign-in integration. |
| QoreScan | LEAVE UNTICKED | Public Explorer receipt links alone do not establish QoreScan integration. |

## Special awards

AI-Native: select it. Current official Prizes says to tick the option and provide AI_USAGE.md describing workflow, generated work and human contribution. The repository meets the documentation step; jury selection remains separate. AI-assisted construction does not make the product a Post-Quantum AI Agent.

Quantum Campus: the video shows it already selected. Official Rules/Prizes require every member actively enrolled during the fest and proof if shortlisted. For this solo entry that means the founder's own current enrolment. Retain only if that is true; a completed past degree alone is not sufficient. No eligibility certification or student document collection is performed here.

Regional: Nigeria → Middle East and Africa. Do not change it to another country for strategy.

## Verification and save sequence

1. Paste the two completed fields; keep name/tagline/category.
2. Keep the valid existing cover or upload the prepared 16:9 refresh once approved; never force the 3:1 README asset into16:9.
3. Verify repo/demo, enter the evidence-backed native accounts and make the exact selections above.
4. Tick AI-Native; retain Campus only with current enrolment eligibility.
5. Save current work. The empty final video stays a clearly recorded pending deliverable until the real finishedURL exists.
6. Reopen https://build.qorechain.io/p/the-record and verify text, image, links and declared selections. Do not confuse automatically Verified badges with product claims.
7. Add the completed video of no more than 3 minutes and verify its public playback/duration before the deadline. No placeholder or audit acceptance claim.

Current official pages retrieved directly with HTTP200 on 19 November 2026: https://build.qorechain.io/rules, /prizes, /kits and /p/the-record. They still warn rules/dates may change. Source deadline: 2 December 2026, 23:59 UTC = 3 December 2026, 00:59 Nigeria time. Recheck before deadline. Public listing feed currently shows 9c8bf26, confirming the GitHub connection works independently of this unsaved form edit.

## My space update — draft, not posted

I have updated The Record's public build evidence from a planned concept to a working Diana testnet agreement workflow. The repository includes original/changed-file verification, two-wallet approvals, withdrawal and fresh amendment approvals, scoped-window admission/refusal, tests and finding-level audit responses. The project listing refresh documents the actual tools and AI-assisted development without claiming independent security clearance. Final video and independent-user testing remain separate pending work.
