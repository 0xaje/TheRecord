# V2 scoped-window live acceptance — 19 November 2026 WAT

Checkpoint: PASS. Owner ran the prepared disposable-account test on Diana. The native opening receipt and permitted EVM receipt/Proposed event were independently retrieved at 2026-11-18T23:31:02.989Z. The outside RPC refusal and historical before/after window snapshots are owner-supplied console evidence, not independently reconstructed historical state.

- Deployment: withdrawal-v2, contract 0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f.
- Account: qor1fvtxdkq957re42zenhw4scrvplxrqwslf6lt4v / 0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f.
- Native opening: 1FDC7960F2F949B3E0B1B995EBB5D99D40AD88CD0A333C560058405C778D9CA2, successful code 0, block 10343291. Hybrid extension verified; only allowed recipient is V2; 600 blocks, 5 transactions, 1000000 uqor allowance.
- Permitted creation: [receipt](https://dashboard.qorechain.io/explorer/tx/0x5401d899bdf544c9f724d16f1334488dcc7baa28521ee12c39ad22748ec855a9), success at block 10343294.
- Matching Proposed event: agreement 0xc7c5bce933b170c4f8a43968cdd1a41a293ee380e7999fe919cffa130783f423, version 1, fingerprint 0x64d36259f6bff15f3fde0af30c0507c668de39284d952dbf81a893251641177c.
- Outside attempt: locally calculated hash 0xe239f8c760a372d9355a6e3a124957c5b9c1db55e1d8cfb2c56cacd8d2b56e7f. RPC code -32000 specifically states “the window does not list 0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f as an allowed recipient”. Rejected before inclusion; this hash is NOT a committed transaction receipt.
- Before/after rejection: window remained live, remaining blocks 597/596, 4 transactions and 966250 uqor remaining. Usage unchanged at 1 transaction and 33750 uqor. Therefore the generic “window exhausted” suffix does not indicate exhausted capacity in this evidence.
- Owner script result complete=true, targetRestrictionConfirmed=true. Original public JSON retained on owner Ubuntu at ~/.local/share/the-record-window-test/scoped-proof-withdrawal-v2.json. Do not delete or repeat the run.

## Judge review

V2 recipient-scoped admission is demonstrated: the allowed call succeeded and the outside recipient was refused while capacity remained. This test creates one disposable pending public agreement; no approvals or existing agreement changes were made. It proves neither per-function restrictions nor mobile QoreX website-opening support. Earlier owner-run two-signer withdrawal/correction evidence is separate; independent participant testing remains open.

Applicable category item: “Scoped EVM window”. This checkpoint is complete; the entire submission is not signed off. Audit findings remain formally Open in the generated report, organizer acceptance of the audit chain is unverified, and previously queued backend/frontend audit corrections still require work. Ship Weeks: four completions owner-reported, fresh portal Check unobserved. Q-Day registration past, no entry claimed.

## My space update — READY, NOT POSTED

TheRecordV2 passed its real Diana scoped-window test. A hybrid-signed window admitted a call to the permitted V2 contract, while a signed zero-value transaction to an outside recipient was rejected with capacity still remaining. The successful creation receipt is linked above. This supplements the separately recorded two-wallet approval, withdrawal and fresh correction evidence. Public evidence has been recorded; no claim of independent user testing or final event acceptance.
