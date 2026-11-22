# QCAIA audit experience — owner review

**Recorded:** 22 November 2026  
**TheRecord project audit task:** COMPLETE (previously closed 20 November 2026)  
**QCAIA platform concern:** Reported for organizer investigation; not independently confirmed as a platform defect.

## My experience

I ran QCAIA audits during development of TheRecord, including on the original contract and the separately deployed withdrawal-enabled V2 contract.

The initial audit cost me **150 QOR** and returned a **65/100 score, HIGH risk and five findings**. I reviewed the results and ran a further audit on the earlier version. During that repeat attempt, the interface generated an audit result without deducting the expected 150 QOR. At the time, my wallet did not hold enough QOR to cover that amount. I did not receive an insufficient-balance warning or a request to fund the wallet. This is my observed experience; the underlying platform payment records and fee rules have not been independently inspected, so I cannot conclude why a result was returned without a charge.

I subsequently made changes, deployed **TheRecordV2** and **paid another 150 QOR** for its audit. That audit also returned **65/100 with five findings**. I ran and reviewed additional audits during the investigation. My recollection is that I attempted approximately five audits overall; the project assessment independently compared three retained HTML reports. I am not presenting uninspected attempts as verified report artifacts.

Seeing the same numerical score after material contract changes raised concerns for me about whether the auditing system was consistently analyzing the submitted source. The findings were **not all identical** across the retained reports: the V2 report addressed withdrawal authorization and added a missing-ERC-interface item, whereas the earlier reports covered different access/PQC topics. Therefore, identical scores alone do not prove cached results, a broken model or a billing defect.

## What we checked

We matched the V2 report to the submitted V2 source and reviewed each of its five findings individually. We preserved the original reports unchanged. The engineering response documents source-code guards, a 24/24 Foundry regression and 16 historical read-only Diana checks, while distinguishing real limitations from disputed or inapplicable claims.

Some audit descriptions and source references appear inconsistent with the exact reviewed source. The V2 summary refers to critical issues while its enumerated findings include no Critical severity. These specific discrepancies warrant review, but they do not establish that all findings are false or that the contract is independently security-certified.

## What I did not test

I did **not** repeat the audit through a new user account or a fresh independent browser/account context. I do not believe such a test is necessary to close our project audit work. It remains a limit on diagnosing whether session, account, report reuse, or payment-flow behavior contributed to what I observed.

## My recommendation to QoreChain

Please review the QCAIA report-generation and fee-validation experience, especially why an audit result appeared when my wallet balance was below the expected fee without an insufficient-funds prompt. Please also compare the source-bound audit reports and their findings against the actual contract versions and supporting evidence, including repeated 65/100 scores and inaccurate or inconsistent report descriptions.

I am **not claiming QCAIA is definitively faulty** or asking that the original report be silently changed. I am documenting the experience so the team can investigate and improve the tool if necessary.

## Closure and evidence

**TheRecord audit work remains COMPLETE.** The original QCAIA reports and their original HIGH/65/100 labels remain unchanged. Our finding-by-finding review is complete, with acknowledged residual risks. This owner review is separate from the auditor's as-issued report status and from independent security certification.

- [Completed engineering assessment](../2026-11-19/ai-audit-assessment/ASSESSMENT.md)
- [V2 finding-by-finding response](../../withdrawal/AUDIT_RESPONSE.md)
- [Project status](../../CURRENT_STATUS.md)

**Evidence limitation:** The 150 QOR payment and no-charge observations above are owner-reported. Wallet transaction receipts, balance snapshots, and backend fee records were not independently inspected for this review.
