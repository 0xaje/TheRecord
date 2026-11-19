# Project assessment of AI-generated contract audits

19 November 2026. Project engineering review completed for the five V2 findings. This is not an independent human audit, formal verification, auditor-issued clearance or organizer acceptance. The original reports and their Open statuses remain unchanged. Reopen this assessment if a concrete counterexample, source change or new chain behavior invalidates its reasoning.

## What was compared

Three retained HTML reports were inspected, not an assumed four or five. Other historical exported runs are mentioned in AUDIT.md but are not counted as independently inspected HTML here. All three inspected reports score 65; equal scores do not establish identical analysis or a faulty model. The machine-readable [comparison](comparison.json) retains report hashes, source hashes and exact finding titles.

| Topic | Stage 1 / legacy source | 18 November legacy re-audit | V2 report |
| --- | --- | --- | --- |
| Access control | Amendment access | Amendment access | Withdrawal access |
| Counter increment | Overflow | Overflow | Overflow |
| PQC results | Unchecked results | Unchecked results | Not listed |
| Approval submission | Front-running | Front-running | Front-running |
| Storage | Unbounded storage mapping | Unbounded mapping access | Unbounded mapping access |
| Token interfaces | Not listed | Not listed | Missing ERC implementation |

The two legacy reports bind the legacy source after removing its final newline. The V2 report binds the exact raw V2 source SHA256 688545ad745ece328b60f61d6348e1744b093359bd0eb2d7e02a306df3193980. Old findings are not silently transferred to new code. Report-local IDs change meaning between runs.

## V2 finding dispositions

| Finding | Project disposition | Basis and remaining limits |
| --- | --- | --- |
| ETH-001 withdrawal access, High | Assessed — disputed as described; no missing caller guard demonstrated | withdraw requires msg.sender equal the agreement's stored proposer, then checks explicit latest pending amendment and a proposer PQ signature. Retained Diana checks reject the other signer, stale/repeated/finalized withdrawals and altered signatures, with a valid positive control. The proposer intentionally has withdrawal authority. A compromised proposer/key and an unavailable proposer remain risks; mutual withdrawal authorization would change product policy and is not silently introduced. |
| ETH-002 counter overflow, Medium | Assessed — disputed as an unchecked wraparound defect | Solidity 0.8.28 checks ++latest outside unchecked. Retained maximum-counter test confirms Panic0x11. At the maximum, creation reverts rather than wraps; no claim of unlimited version availability. An arbitrary product cap is a separate policy. |
| ETH-003 approval front-running, Medium | Assessed — accepted relay/ordering limitation; forged outcome claim disputed | A relayer can submit an already-valid signature. Payload binds action, chain, contract, agreement, version, fingerprint and signer. Retained Diana checks accept legitimate relay and reject signer substitution/duplicate/version reuse. The original sender can lose gas on a later duplicate. Approval/withdrawal races follow chain order. Neither tests nor this assessment eliminate ordering risks. |
| ETH-004 mapping growth, Low | Assessed — accepted retention cost; iteration-gas claim not demonstrated | No contract function loops through historical mappings. Calls access fixed entries; retained history grows and must be supported by chain/indexer availability. Backend storage quotas are a separate concern. Deleting historical proof would change the purpose of the product. |
| ETH-005 no ERC standard, Info | Assessed — not applicable to a token-interface requirement | TheRecordV2 is an agreement registry, not an ERC20/ERC721 token. Existing custom ABI integration is evidenced. ERC20 defines a token interface; lack of it does not establish universal wallet incompatibility. Future integrations may require other explicit interfaces. |

Legacy missing-PQC-result claim: legacy and V2 verifyApproval both check registration, algorithm, possession proof, public-key length and the pqcVerify boolean. The assertion that these returns are ignored is contradicted by source. This does not independently certify the implementation of Diana's precompiles.

## Evidence and verification boundaries

- [Existing source-bound response and detailed guard references](../../../withdrawal/AUDIT_RESPONSE.md).
- [Retained Foundry output: 24 passed](../../../withdrawal/audit-response-solidity.txt). Lifecycle tests use storage seeding and do not run Diana's custom PQ precompiles locally.
- [Retained Diana regression: 16 checks](../../../withdrawal/audit-response-diana.txt), [structured results](../../../withdrawal/security-regression.json). These are historical read-only calls with publicly recorded signatures, not newly committed failed transactions.
- [Live acceptance and receipts](../../../withdrawal/LIVE_ACCEPTANCE.md), [V2 scoped-window evidence](../../../withdrawal/SCOPED_WINDOW_LIVE.md).
- [Solidity checked arithmetic](https://docs.soliditylang.org/en/v0.8.28/control-structures.html#checked-or-unchecked-arithmetic); [ERC20 scope](https://eips.ethereum.org/EIPS/eip-20). Primary references reread for this review.

This documentation milestone freshly checked source/report hashes, finding-title differences and referenced evidence. It did not rerun Foundry or Diana checks; those outputs remain explicitly dated retained evidence. No contract change, redeployment, signing, broadcast or audit payment occurred. No blanket claim that AI is broken is supported. Some claims are contradicted by code, several references are inaccurate, and the V2 summary mentions critical issues without enumerating a Critical finding; these are specific quality limitations requiring contextual review.

## Closure decision

Close the project's assessment task for these five V2 findings with the dispositions above. Do not mark them Fixed when no remediation was made. Keep residual risks documented. Auditor-issued status remains Open; acceptance of this audit trail by the event remains UNVERIFIED. Do not purchase repeated identical runs solely to seek a different score. Seek targeted review if a concrete bypass is supplied or material code changes require it.

Independent-user acceptance, backend/relay abuse controls, provider monitoring/backups and submission gates remain separate open work. This assessment does not close them. Ship Weeks Check remains unobserved; no challenge completion or new product transaction is claimed.

## Judge review

The response is traceable and stronger than blindly accepting or rejecting an AI score. It is still a project self-assessment with disclosed limitations, not independent security assurance. The main unresolved security assurance gap is external validation of these dispositions and remaining operational risks.

## My space update — READY, NOT POSTED

I compared TheRecord's retained AI audit reports against their exact source versions. The V2 findings differ from the legacy reports despite the same 65 score. I documented each finding as disputed, not applicable or an accepted limitation, linking the retained Solidity and Diana evidence. The original reports remain unchanged; this project assessment does not claim independent security certification or organizer clearance.
