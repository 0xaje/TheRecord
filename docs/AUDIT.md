# The Record — QCAI audit response

**Project review completed:** [AI audit comparison and dispositions](audit/2026-11-19/ai-audit-assessment/ASSESSMENT.md). Original auditor statuses and scores are preserved. Project assessment closure is separate from auditor clearance and event acceptance.

For current deployment, verification and open release gates, start with [CURRENT_STATUS.md](CURRENT_STATUS.md). Dated sections below preserve historical results; the V2 finding response is [here](withdrawal/AUDIT_RESPONSE.md).

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

## Earlier second run — 16 November (historical)

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
document the two runs. The organizer confirmed that a second run on the same contract can qualify as Stage 2. Confirmation of this specific run is pending after the payment issue was reported.

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

## Public report links and latest Stage 2 re-audit

These are the owner-supplied auditor-hosted verification links, with repository copies for retention:

| Run | Date | Auditor-hosted report | Saved HTML | Score / risk |
| --- | --- | --- | --- | --- |
| First audit | 16 November 2026 | [QCAIA-1794848833603-D57F7095](https://qorechain-audit-reports-362958365954.s3.amazonaws.com/audits/QCAIA-1794848833603-D57F7095/report.html) | [First report](audit/2026-11-16-stage-1.html) | 65 / Medium |
| Latest Stage 2 re-audit | 18 November 2026 | [QCAIA-1794963565431-6D3EAE14](https://qorechain-audit-reports-362958365954.s3.amazonaws.com/audits/QCAIA-1794963565431-6D3EAE14/report.html) | [Latest report](audit/2026-11-18/QCAIA-1794963565431-6D3EAE14.html) | 65 / High |

Both HTML reports identify Ethereum / Solidity and SHA256 b681ec487f2254dabb3d9ba61da4c93ef73a82e69c44b99fce05937c9b0bf05e. This exactly matches contracts/TheRecord.sol after removing only its final newline. The repository file's unmodified SHA256 is 78fe9ca23d4ae051a5db1d21dfa2122714b43596921c75920d775c812d3f6dc7. Source text is therefore bound to both reports; the rating change is not evidence of a contract change. The latest report has two High, two Medium and one Low finding; all remain Open in the auditor's report. Our dispositions below do not alter the auditor's statuses or certify safety.

### Latest finding dispositions and remaining checks

| Finding | Current source assessment | Evidence / remaining limitation |
| --- | --- | --- |
| ETH-001 amendment authorization | Proposer-only amendment, finalized-current-version gate, new version begins unapproved; old records retained. | Existing access-control tests and genuine two-wallet amendment evidence. A malicious/compromised proposer can still create an unwanted pending version, with no cancel/reject path. Latest-only approvals then prevent further amendments until that pending version finalizes. This is a real liveness/design tradeoff, not authority to forge final approval. Changing that policy needs separate scope review. |
| ETH-002 counter overflow | Solidity 0.8.28 checked arithmetic rejects overflow; no unchecked increment. | Compiler/source review. No fresh overflow execution test claimed. |
| ETH-003 PQC results | Registration, algorithm, possession, key length and verify boolean explicitly checked. | Source plus historical real Diana valid/altered-signature regression evidence above. Custom precompiles are not implemented by a standard local EVM. |
| ETH-004 front-running | Current source has no block.timestamp. Signed payload binds chain/contract/id/version/fingerprint/signer. | Valid signatures can be relayed by another sender. Duplicate-submission gas loss remains; signer attribution cannot be changed by relaying. Existing duplicate/stale/altered-signature checks above. |
| ETH-005 mappings | No loop over historical mapping entries in create/amend/approve/getVersion. Historical storage grows intentionally. | Direct source inspection and historical version lookup. Pagination is relevant to off-chain history retrieval; deleting finalized on-chain versions would break historical verification. |

No deployed contract policy was changed merely to improve the AI score. The historical six-test result above has now been repeated by the owner on 18 November; see the retained fresh logs below. Forge remains unavailable in the agent environment. Current JavaScript checks do not replace Solidity/PQC regression evidence. Latest report retrieval and source binding are complete; specific-run event acceptance remains unverified, and independent user testing remains pending. No additional audit payment is requested.

My space update draft — READY, NOT POSTED: The Record now retains direct links and source-matched copies of its first QCAIA audit and latest Stage 2 re-audit. Each finding has an explicit disposition, evidence reference and remaining limitation. Both reports cover the same source; real Diana scoped-window admission evidence is documented separately.

## Fresh owner regression evidence — 18 November 2026

Owner supplied the full terminal logs, preserved unchanged:

- [Solidity regression: 6 passed, 0 failed, 0 skipped](audit/2026-11-18/solidity-regression.txt), compiled with Solidity 0.8.28. Owner used $HOME/.foundry/bin/forge (Foundry0.2.0); PATH's other forge executable belongs to Atlassian.
- [Diana approval regression: 4 passed](audit/2026-11-18/diana-approval-regression.txt): valid recorded version2 approval accepted before inclusion at block10135459; duplicate rejected at10135460; version1signature reused forversion2 rejected at10135459; altered signature of valid length rejected at10135459.

The second log comes from read-only calls against historical Diana state, not four newly committed transactions. The Foundry fork reads finalized historical records; it does not execute custom PQC precompiles locally. These are owner-executed results with uploaded raw logs, not a fresh independent rerun by the agent. No contract code changed in this evidence update. This strengthens finding-level regression evidence without changing QCAIA's Open finding statuses or claiming organizer acceptance.


## Withdrawal-enabled V2 report — 19 November 2026 WAT

The new report QCAIA-1795043785188-4A004387 binds the deployed V2 raw source exactly (688545ad...3193980). It reports65/100High,1High2Medium1Low1Info,allOpen. [HTML/PDF, source verification, finding dispositions and additional tests](withdrawal/AUDIT_RESPONSE.md) are preserved separately from legacy reports. No clean audit or event acceptance claim is made.
