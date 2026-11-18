# Exact V2 audit input and remediation record

Current update19November: new source-matched report QCAIA-1795043785188-4A004387 has been provided and reviewed. See [finding response and retained reports](AUDIT_RESPONSE.md). Earlier submission instructions below are historical preparation; no automatic rerun/payment is needed. Event acceptance is still unverified.

Prepared19November2026 WAT. No audit was submitted or paid for by the agent.

## Exact input

- Source: contracts/TheRecordV2.sol; identical ready-to-copy file audit-source.sol in this directory.
- Contract name: TheRecordV2 — pending amendment withdrawal.
- Compiler: Solidity0.8.28; network QoreChain Diana EVM9800.
- Address: 0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f.
- Raw source SHA256: 688545ad745ece328b60f61d6348e1744b093359bd0eb2d7e02a306df3193980. audit-input.json also records the hash without final newline, because prior auditor exports normalized it.
- Independent deployed runtime/creation check: deployment-verified.json.
- No mnemonic, private signing file, runtime secret or database belongs in the auditor input.

On the owner's Ubuntu branch checkout, updating source does not change deployed bytecode:

```sh
cd ~/TheRecord-window-test
git pull --ff-only origin withdrawal-amendments
sha256sum contracts/TheRecordV2.sol
cat contracts/TheRecordV2.sol | clip.exe
```

The last command copies public Solidity source to the Windows clipboard. Paste into the source field of the existing QoreChain auditor. Use an EVM/Solidity option if offered, or code auto-detection; do not assume a PQ-specific audit mode or exact UI labels. Name is optional. Do not pay or rerun just to raise an AI score: inspect the planned charge and existing report coverage first. The agent has prepared input only, not an audit result or an instruction that a third paid run is automatically necessary.

## How this relates to earlier reports

The two retained reports bind the ORIGINAL contract source. They remain valid historical reports of that source; they do not bind this changed contract or certify it. Preserve a clear chain: original report/source, justified code remediation, tests, actual new-source report, finding disposition and exact hashes. Depending on the organizer's acceptance policy, that may form the draft/remediation/final trail; do not assume acceptance or insist that two entirely new paid reports are required without evidence. Submission acceptance stays open until verified.

## Change and finding disposition

| Area | Current disposition |
| --- | --- |
| Outsider amendment/withdrawal | Both require original proposer. Withdrawal additionally verifies its own domain-bound ML-DSA signature. |
| Mistaken pending amendment | Cooperative proposer can withdraw it and propose a new numbered version with fresh approvals. Existing records remain. |
| Malicious/unavailable proposer | NOT fully solved. Only proposer can withdraw; a proposer refusing to act, or losing the required PQ key, can still block future changes under that ID. No arbitration/recovery/admin bypass was added. |
| Finalized agreements | Cannot be withdrawn or overwritten through this feature; original verification remains available. |
| Old signatures/replay | Version numbers are never reused; approval and withdrawal use separate domains and include chain/contract/ID/version/fingerprint/signer. Actual historical Diana regression is recorded separately; unit checks are not live proof. |
| Approval/withdrawal race | Chain execution order determines result. If final approval executes first, withdrawal fails; if withdrawal executes first, later approval fails. No promise of undoing finalized terms. |
| PQ return handling | Registration, algorithm1, proof of possession, key/signature lengths and true verification result are required. No unchecked return finding should be accepted without a source path. |
| Overflow/storage | Solidity0.8 checked increment; direct mapping lookups, no iteration over version history. Storage grows by design and gas is still paid. |
| Front-running | Valid approvals can be relayed by another sender; bound signer/meaning cannot be changed. Duplicate-submission gas loss remains possible. A valid withdrawal requires msg.sender to be the proposer as well as its PQ signature. |
| Deployment migration | Separate deployment; default old links remain original. Explicit deployment=withdrawal-v2 selects new contract. Private drafts/database are not migrated by the contract change. |

## Evidence and limitations

LIVE_ACCEPTANCE.md retains real owner-operated two-wallet finalization, version2 one-approval withdrawal, version3 fresh approvals, original re-verification and history screenshots. The same changed file was re-proposed for version3; it was not a third distinct edit. This is not independent two-person testing.

37 JavaScript/local checks and23Solidity tests were recorded at the candidate build. The new state-rule tests seed storage and do not exercise PQ precompiles locally. Deployed-code/source comparison and actual Diana calls are separate evidence. Historic calls in security-regression.json are read-only, not fresh failed broadcasts or adversarial bot testing.

Still open: actual new-source auditor report/dispositions and event acceptance; scoped admission/refusal proof targeting this V2 address rather than the old address; independent user acceptance; other backend/frontend findings in the combined plan. No clean audit certification, production readiness or guaranteed competition result claimed.

## Public update draft — READY, NOT POSTED

The Record's withdrawal-enabled contract now has genuine Diana lifecycle evidence and a source-bound audit handoff. Earlier reports are kept with their original source, and the new source is separately identified. Further security checks and event audit acceptance are documented rather than assumed.
