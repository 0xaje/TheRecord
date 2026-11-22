# Project assessment of AI-generated contract audits

> **Current note — 22 November 2026:** Project audit work remains complete. The owner additionally documented a [repeated payment-validation bug report](../2026-11-22/QCAIA_OWNER_EXPERIENCE.md) after observing Pay-and-scan results without sufficient QOR on approximately three or four attempts; the V2 audit was paid (150 QOR). This user-observed platform behavior is distinct from whether identical numeric scores imply identical findings. Historical “READY, NOT POSTED” copy below is superseded by owner-confirmed My Space updates and submission. No clean auditor reissue is claimed.


**Status: COMPLETE — project audit work and finding review.** Reviewed19November; closure confirmed by owner20November2026. Audit runs, source binding, five V2 dispositions and supporting tests are complete. Original reports are retained unchanged as historical artifacts. This is a project engineering assessment, not an independent human security certification or a clean auditor reissue.

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

The project audit task is COMPLETE. Every V2 finding has a recorded disposition and supporting evidence. Disputed claims and intentional design limitations are documented rather than mislabeled as code fixes. No repeated audit payment or speculative code change is required by this closure.

We recommend that QoreChain review the bot's repeated findings against the exact submitted sources, source guards and retained tests. The three inspected reports share a65score but have differing findings; identical scores alone do not prove a defective bot. Specific source contradictions, inaccurate references and summary inconsistencies are documented above for contextual review. This recommendation has been recorded here; no message to the organizers is claimed.

The as-issued reports remain intact for traceability. Their historical labels do not describe the current project task status. This closure does not claim that an external auditor has reissued a clean report or supplied independent certification.

Owner confirms final listing/link/video checks and submission complete20November2026. Independent two-person validation remains separate; future alerts and service-wide backup recovery are roadmap work, not unfinished audit tasks.

## Judge review

Completed source-bound assessment with traceable dispositions, retained reports,24Foundry results and16historicalDiana checks. Detailed test boundaries and residual risks remain disclosed above.

## My space update — READY, NOT POSTED

I compared TheRecord's retained AI audit reports against their exact source versions. The V2 findings differ from the legacy reports despite the same 65 score. I documented each finding as disputed, not applicable or an accepted limitation, linking the retained Solidity and Diana evidence. The original reports remain unchanged; this project assessment does not claim independent security certification or organizer clearance.
