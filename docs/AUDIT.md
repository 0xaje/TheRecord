# The Record — QCAI audit response

Stage 1 was run on 16 November 2026 against `contracts/TheRecord.sol` using the auditor’s Ethereum setting. It returned 65/100, Medium risk, and five findings. Quantum readiness was unscored in that setting.

| Stage 1 finding | Disposition |
| --- | --- |
| High: amendment access control | `amend` permits only the original proposer and requires the current version to be finalized. A proposal starts without approvals and needs both signers to finalize. Requiring mutual authorization to open a proposal would change the workflow. |
| Medium: version overflow | Solidity 0.8.28 checks the `uint256` increment and reverts on overflow. |
| Medium: unchecked PQC results | The contract checks registration, algorithm, proof of possession, and key length before requiring a true result from `pqcVerify`. |
| Low: approval front-running | A third party can submit the same signed approval first. Attribution remains with the signer and the approval payload binds chain, contract, agreement, version, fingerprint, and signer. The later duplicate can revert, costing the original submitter gas. |
| Info: growing storage | Each amendment adds a version. Earlier versions remain verifiable, and lookup uses a mapping without iteration over version history. |

Run the Solidity guards and the historical Diana state check with:

```sh
DIANA_RPC_URL=https://evm-testnet.qore.host forge test -vv
```

Latest run on 16 November 2026 with Solidity 0.8.28 and Diana block 10163721: **6 passed, 0 failed, 0 skipped**.

The fork test checks finalization and fingerprints from the real Diana deployment. It does not execute Diana’s custom PQC precompiles locally. See [Diana evidence](diana-evidence.md) for the successful approval and amendment receipts.

## Diana approval regression checks

Run `node scripts/check-diana-approvals.mjs` after `npm ci`. The script
uses read-only calls to Diana and public approval transaction data.

| Check | Diana block | Result |
| --- | --- | --- |
| Valid version 2 signature before the first approval | 10135459 | Accepted |
| Same approval after it was recorded | 10135460 | Rejected with `InvalidApproval` |
| Version 1 signature submitted for version 2 | 10135459 | Rejected with `InvalidApproval` |
| Altered signature of the same length | 10135459 | Rejected with `InvalidApproval` |

The valid signature at the same pre-approval block provides a positive
control for the altered-signature check. The original version 2 approval
was included in [this successful Diana transaction](https://dashboard.qorechain.io/explorer/tx/0x5a4b0020a0a0d8980e63d7045b23594d24b6eb648fb7d8c3c6f23649096bf8b2).

## Stage 2 comparison

The second QCAI run on 16 November 2026 used the same Ethereum setting
and contract source. It again scored **65/100 (Medium)** and listed five
findings. Amendment access, counter overflow and PQC return handling
retained their ratings. Mapping growth moved from Info to Low and the
approval submission concern moved from Low to Info.

The mapping finding describes a possible unbounded loop. Version
creation and lookup access individual mapping entries and do not loop
over history. Storage still grows by one entry per proposed version.
The proposer-only amendment rule, two-approval finalization rule and
documented third-party submission behavior remain as described above.
No contract change followed this review. The two exported reports
document the two runs. The organizer confirmed that the second run qualifies as Stage 2.

## Reports and finding-level evidence

- [Stage 1 — 16 November 2026](audit/2026-11-16-stage-1.pdf)
- [Stage 2 — 16 November 2026](audit/2026-11-16-stage-2.pdf)

| Finding | Evidence |
| --- | --- |
| Amendment access | Foundry: `testOutsiderCannotProposeAmendment`, `testProposerCannotAmendPendingVersion`, and `testDianaFinalizedAmendmentPreservesOriginal`. |
| Version overflow | Source review of the checked Solidity 0.8.28 increment. |
| PQC return handling | Diana check: `altered signature of valid length`, with a valid signature as the positive control. |
| Approval submission | Foundry: `testApprovalPayloadBindsSigner`. Diana checks: `duplicate approval` and `version 1 signature reused for version 2`. Third-party submission of a valid approval remains possible as described above. |
| Storage growth | Source review confirms direct mapping access. Foundry: `testDianaFinalizedAmendmentPreservesOriginal` verifies why historical versions are retained. |
