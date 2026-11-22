# V2 QCAIA report: source binding and finding response

**Project audit status: COMPLETE — owner confirmed 20 November 2026.**

> **Current-status note — 22 November 2026:** The dated My Space “READY, NOT POSTED” draft below is historical. The owner subsequently confirmed progress updates and Ship Weeks checks completed. The separate [QCAIA payment-validation bug report](../audit/2026-11-22/QCAIA_OWNER_EXPERIENCE.md) does not reopen the completed project audit. Independent two-person testing remains pending.
 The [completed project assessment](../audit/2026-11-19/ai-audit-assessment/ASSESSMENT.md) records all five finding dispositions and supporting evidence. We recommend QoreChain review the repeated bot findings against the submitted source/tests. The report below is preserved as issued; it is not a current unfinished audit task or a clean external certification.

Reviewed19November2026 WAT. Report [QCAIA-1795043785188-4A004387](https://qorechain-audit-reports-362958365954.s3.amazonaws.com/audits/QCAIA-1795043785188-4A004387/report.html). Unchanged local [HTML](QCAIA-1795043785188-4A004387.html) and owner-exported [PDF](QCAIA-1795043785188-4A004387.pdf) retained. Report prints audit date18November; PDF generated timestamp prints19November00:17. Do not infer a source discrepancy from those displayed dates.

## Source and report status

The HTML's code hash **688545ad745ece328b60f61d6348e1744b093359bd0eb2d7e02a306df3193980** exactly matches raw contracts/TheRecordV2.sol, audit-source.sol and the source-bound deployment artifact. Prior independent deployment checking matched creation input and runtime at0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f. The owner submitted the correct new source.

Report score **65/100**, risk **HIGH**, quantum readiness **not scored for this setting**. Five findings:1High,2Medium,1Low,1Info; all **Open** in the auditor's HTML. Our analysis below does not change those statuses or certify security. The PDF is an abbreviated export; HTML includes the source hash and detailed descriptions. Neither is an independent human certification.

The executive summary mentions critical issues, but the enumerated findings include no Critical item. Several reported line references do not point to the named function in the actual hash-matched source. Treat descriptions as claims to investigate, not proof of a reproducible exploit.

## Finding ledger

| ID / auditor severity | Assessment | Evidence / action |
| --- | --- | --- |
| ETH-001 High: withdrawal authorization | **Disputed: contradicted by the reviewed source and tested path.** withdraw at lines82–89 checks msg.sender equals this agreement's proposer, validates the explicit latest pending amendment and requires its own PQ signature. Historical fingerprint/approval data is retained when marked withdrawn. | Line84 sender guard; lines73–87 pending guard/domain/PQ verification; lines126–132 registration/possession/key/verify guards. Actual Diana positive withdrawal plus rejection of the other designated signer, altered signature, cross-domain signature, repeated/stale/finalized withdrawal. Do not add a second admin or token ownership rule merely to satisfy this wording. Ask for a concrete bypass if further review insists the guard is ineffective. |
| ETH-002 Medium: counter overflow | **Disputed as an unchecked-overflow defect.** Solidity0.8.28 checks ++latest; there is no unchecked block. A deliberate product version limit would be a separate policy. | Added testVersionOverflowRevertsWithCheckedArithmetic seeds uint256 maximum and confirms arithmetic Panic0x11, rather than wraparound. New full Foundry run24/24 passes. No arbitrary limit or SafeMath dependency added. |
| ETH-003 Medium: approval front-running | **Valid relay/duplicate-fee consideration; unauthorized signer/outcome claim not demonstrated.** An observer can relay a valid signed approval. The signed account, version, fingerprint and action remain bound. | Actual historical Diana control accepts a relayed valid approval; substituting the other signer fails InvalidApproval. Duplicate and version2-to-version3 signature reuse fail. Original submitter can still lose gas on a duplicate after someone else relays it. Approval versus withdrawal races follow chain order; commit-reveal/time locks would add complexity without an established forged-approval case. |
| ETH-004 Low: mapping growth | **Real intentional retention; claimed iteration/retrieval gas failure not demonstrated here.** Contract functions access individual entries and contain no history loop. Storage grows with transactions. | Retaining finalized and withdrawn versions is necessary for history. Browser history uses bounded log ranges; independent backend storage/abuse findings remain separate. Do not delete finalized records to increase the AI score. |
| ETH-005 Info: missing ERC standards | **Not applicable as a token-interface requirement.** This is an agreement registry, not an ERC20/ERC721 asset. Custom ABI calls already work with QoreX/viem. | ERC20 specifies a token interface, not a universal requirement for arbitrary EVM dApps. No token/NFT layer added without product need. Future integrations may define an appropriate interface separately. |

Source references are line numbers in the unchanged hash-matched source. Underlying official references: https://docs.soliditylang.org/en/v0.8.28/control-structures.html#checked-or-unchecked-arithmetic and https://eips.ethereum.org/EIPS/eip-20 . The dispositions are engineering assessments; the original report retains its as-issued labels, while our finding review is complete.

## Additional verification prompted by this report

- Full Foundry regression **24 passed,0failed**: original6(including historical Diana fork) plus18V2 state-rule tests, including explicit maximum-counter overflow. Raw [output](audit-response-solidity.txt).
- Real historical Diana regression expanded from14to**16 checks**, with positive controls, invalid withdrawal/approval cases and explicit relay/substituted-signer behavior. [Script](../../scripts/check-withdrawal-security.mjs), [raw output](audit-response-diana.txt), [structured results](security-regression.json). Results must be read from the retained run, not assumed from a script definition.
- No production contract changes or redeployment. Only tests/evidence/docs changed, so this report still binds the deployed source. No signing key, wallet operation, transaction broadcast or additional audit payment by the agent.

The Solidity tests that seed lifecycle storage isolate guards and state transitions. They do not execute Diana PQ precompiles locally. Historical Diana calls actually execute the deployed contract at recorded state; they are read-only, not newly committed failed transactions. Neither test set is exhaustive or formal verification.

## Honest remaining risks

A cooperative proposer can now correct a mistaken pending amendment. A malicious/unavailable proposer, or one who lost the required PQ key, can still refuse withdrawal and block further changes under that ID. There is no arbitrator/admin recovery path. Finalized versions cannot be rolled back; whichever valid approval/withdrawal executes first determines the resulting state. Existing approval relaying can incur duplicate gas costs. Chain/RPC/key custody/file availability and long-term archival access remain trust dependencies.

## Completion record — 20 November 2026

Source-matched report retention, finding review and supporting tests are COMPLETE. Original and V2 reports remain linked to their respective sources. The report's historical65/HIGH rating and original labels are retained without alteration. No clean reissued audit or independent certification is asserted.

The owner confirms the audit work requested for submission and the final submission/link/listing checks are complete. Earlier action lists are superseded by this completion record and CURRENT_STATUS.md. V2-targeted scope evidence is retained in [SCOPED_WINDOW_LIVE.md](SCOPED_WINDOW_LIVE.md); deployment history was merged into main.

Recommendation: QoreChain should review the repeated bot findings in context, using the exact source, guard references and retained regression results. A shared score across reports alone does not demonstrate a bot fault. This is a documented recommendation, not a claim that organizers have already received or accepted it.

My space draft — READY, NOT POSTED: I completed The Record's audit runs and source-bound review, documented every V2 finding and retained the supporting Solidity/Diana evidence. I recommend reviewing repeated bot findings against those sources and results. The original reports remain available for transparency, and the project submission is complete as confirmed by its owner.
