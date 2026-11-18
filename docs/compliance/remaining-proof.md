# Current status — 18 November 2026

The preparation log below is historical and superseded by these results:

- Scoped SDK opening, permitted contract creation and outside-recipient refusal: owner live evidence reviewed PASS. See [Ubuntu proof record](UBUNTU_SCOPED_WINDOW.md#live-owner-result-and-read-only-review--18-november-2026). QoreX website native-window requests remain unsupported.
- First audit and latest Stage2 re-audit retrieved and source-matched after removing only the final newline; [both links and finding dispositions](../AUDIT.md).
- Fresh owner Solidity6/6 and Diana historical signature4/4 logs preserved [in the audit record](../AUDIT.md#fresh-owner-regression-evidence--18-november-2026).
- Exact event acceptance of this same-source Stage2 run remains unverified. Current rules state two-stage audit; the workshop describes fixing findings with tests and auditing the final version. Our findings are disputed with evidence, not marked resolved by the auditor. No additional payment requested.
- Independent participant acceptance, final video/listing fields and current complete rubric remain open. [Submission readiness](SUBMISSION_READINESS.md) is the current checklist.

## Historical preparation log — not the current status

# Remaining window and audit proof — 18 November 2026

Status: **OPEN**. This check reads real receipts and existing reports; it submits
no transaction and changes neither contract nor wallet permissions.

## Official references and rule boundary

The category wording previously supplied by the owner requires “Scoped EVM
window, pqcVerify, two-stage QCAI audit, Foundry or Hardhat tests.” The fest rules
page could not be retrieved during this check, so this is retained as supplied
wording, not falsely described as a fresh portal verification. The official
[fest overview](https://docs.qorechain.io/build-before-qday/overview/)
points to the fest Rules page for definitive judging/eligibility rules.

The official [window reference](https://docs.qorechain.io/developer-guide/evm-window-reference/)
explains `allowed_targets`: a nonempty list restricts recipient contracts and
refuses contract creation. For post-deployment sessions it recommends limiting
the window to the deployed contract. Contract creation itself needs an unscoped
window. Do not incorrectly mark the original deployment window as a bug merely
because it was unscoped.

The official [Workshop 2 guide](https://docs.qorechain.io/build-before-qday/workshop-2/)
describes draft audit, finding fixes with tests, final audit and keeping both
reports. It does not establish acceptance of The Record's particular paid run.
Solidity's unscored quantum-readiness field is expected in that guide; do not
misrepresent a 65/100 AI report as certification or proof of PQC execution.

## Read-only result

`node scripts/check-window-evidence.mjs` saves `window-audit-check.json`.
Historical opening receipt B1D0858D43C9B5DA7C40D1B085DB7F7D11427E95B3B52F5BDA3C41002C632BC4
succeeded at Diana height 10221360. It specified:

| Field | Recorded value |
| --- | --- |
| Blocks | 300 |
| Maximum transactions | 5 |
| Maximum value including fee allowance | 1,000,000 uqor |
| Native-only | false |
| Allowed targets | empty |
| Hybrid signature extension | present; not independently verified by this script |

This one receipt is an **unscoped** window. It is not proof that every window
used by the project was unscoped. Successful agreement receipts remain valid
workflow evidence; this opening receipt does not close the narrower-target gate.
The earlier 7DD5E889… transaction was a key registration, not a window opening.

## Next window checkpoint — owner wallet interaction required

1. In QoreX on Diana, inspect the EVM authorization-window settings for a
   disposable account with a possession-proven ML-DSA-87 key. Do not import or
   share phrases in chat. The exact wallet menu/control availability has not
   been verified here; inspect it before assuming target scoping is supported.
2. The required allowed target for The Record is:
   `0x25721b3be0f24438da7daed4c800b073ef9bb802`.
3. Record the proposed blocks/transaction/value limits and allowed targets
   **before signing**. If the wallet cannot set targets, stop and report which
   controls it actually offers. Do not silently substitute an unrestricted
   window or collect secret key material as a workaround.
4. After opening, retain the real opening transaction hash and decoded message,
   then its REST read-back. Pair it with a genuine permitted The Record action
   inside that window. Read-only `eth_call` does not prove broadcast admission.
5. A negative scope check must use a disposable account and a zero-value,
   harmless target outside the list. Capture the chain's actual rejection;
   a wallet preflight label is not evidence. Do not sign arbitrary or valuable
   transactions for this check. Record any expiry/reopening between tests.

A window change is a wallet action for the owner, not something this read-only
script performs. This report does not claim the above steps have happened.

## Audit evidence checkpoint

Available exported PDFs: Stage1 generated 16 November 18:08:55; Stage2 generated
16 November 18:30:16 (report-local display times). Both say Ethereum, 65/100,
Medium, five findings and quantum readiness unscored. Their SHA-256 values are
in the JSON evidence. Library copies were also read; no later paid report was
resolved in the focused search. This is not proof that no later report exists.

Existing `docs/AUDIT.md` records the payment/duplicate-output issue and pending
acceptance. To close it, obtain the latest already-paid report or audit run ID,
dashboard completion/Stage2 status and available payment receipt, linked to the
reviewed contract source commit. If the dashboard cannot establish acceptance,
use the organizer's reply for this specific run. **Do not pay for another run
merely to resolve missing evidence.** Existing report findings need their
source/test dispositions retained; do not change a deliberate contract policy
only to satisfy an inaccurate automated finding.

Current contract source SHA-256:
`78fe9ca23d4ae051a5db1d21dfa2122714b43596921c75920d775c812d3f6dc7`.
This hashes today's file; it does not prove which exact bytes a past audit read.

## Judge review and public update

Blunt review: the agreement flow has real receipts and the build is reproducible,
but neither a UI badge nor two PDF filenames closes these two evidence gates.
Keep this milestone open until the missing scoped call/rejection and audit-run
acceptance are verifiable. Independent two-person acceptance is still separate.

My space update DRAFT (not posted):
I completed a read-only review of The Record's remaining compliance evidence.
One historical authorization window has verified time, transaction and value
bounds but no target restriction. I am collecting a contract-restricted window
and its permitted/rejected-call evidence. The two audit reports are preserved;
acceptance of the latest paid second-stage run is still being verified.

## Prepared wallet route — scoped-window helper

The advanced `/#evm-window` screen now prepares one native
`MsgOpenEVMWindow` through QoreChain's focused `@qorechain/evm/window` 0.14.0
builder. The protobuf bytes use the existing cosmjs writer and are checked byte
for byte against `@qorechain/sdk` 0.14.0's registry encoder in local tests. The
full SDK is a dev dependency; importing it into the browser made a needlessly
large bundle, so it is not shipped in the browser. The scoped policy is fixed:
600 blocks, five transactions, 1,000,000 uqor and only The Record contract.
No validator/delegation/key changes or arbitrary targets are requested.

The screen checks provider capability, Diana chain IDs, native/EVM account
agreement and possession-proven ML-DSA-87 readiness, then displays the proposed
policy. A separate checkbox/button requests QoreX approval. The page holds no
phrase, private key or signing file for this path. QoreX sets and displays the
native fee. The previous window is replaced, not added to. The allowance also
covers maximum EVM fees; it is not a fee quotation or a per-function contract
restriction.

A wallet result alone is not labelled verified. The helper retrieves the
committed native receipt, validates sender, hash, scope, bounds, successful code
and hybrid-extension presence, then checks the current window read-back against
the opening height and limits. It distinguishes an expired window. Downloadable
JSON contains public receipt/read-back fields. It refuses to automatically
resubmit after unknown outcome. A read-back is not a permitted transaction or
negative broadcast proof; those remain open.

Official provider contract: [QoreX integrations](https://docs.qorechain.io/developer-tools/qorex-integrations/),
Sending a transaction on QoreChain. Messages must be protobuf bytes; unsupported
message displays are refused by the wallet. We have not yet verified this
specific message with the owner's real mobile build. If QoreX refuses it or
cannot show the target restriction, reject/stop and retain the error. Do not
fall back to unscoped access or expose recovery phrases.

Owner checkpoint: open the helper in QoreX Browse on Diana and press **Inspect
QoreX test account** first. Check the displayed account and limits before any
opening request. No claim of wallet compatibility or scoped on-chain success
is made until that real interaction and its receipt are verified.


## Real mobile result supersedes prepared website-signing route

Owner's November18 phone test reached the request but QoreX explicitly refused
`MsgOpenEVMWindow`: managed by the wallet, not by a website. No opening hash was
returned. The receipt-check button shown then was a UI state error, not proof of
submission. The new page removes the blocked request altogether and accepts
only public opening hashes for read-only checking. Existing proposals in the
preceding section are historical preparation, not a supported wallet claim.

The reviewed fallback is a fresh disposable SDK account on the owner's Ubuntu
machine; see UBUNTU_SCOPED_WINDOW.md. No old account phrase or key rotation is
needed. Registration/opening require explicit owner-run commands. Preparation
and offline tests do not close the scoped-opening or permitted/rejected-call
evidence gate. The exact next owner action is `init` and review of public addresses.
