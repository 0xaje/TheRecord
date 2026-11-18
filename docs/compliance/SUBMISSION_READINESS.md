# Submission readiness — 18 November 2026

Milestone: align the public evidence and submission materials with current official requirements. Completion requires verified listing fields, source/evidence links, current rules/rubric, and a final video; missing items keep the milestone OPEN. No wallet or chain transaction is needed for this review.

## Official sources checked

- https://build.qorechain.io/rules — retrieved HTTP200 directly,18November2026. Rules expressly remain subject to change.
- https://build.qorechain.io/prizes — retrieved HTTP200 directly. Post-Quantum dApp objective: “Build an EVM dApp whose sensitive actions receive post-quantum protection.” Main requirements: “Scoped EVM window, pqcVerify, two-stage QCAI audit, Foundry or Hardhat tests.”
- https://build.qorechain.io/start — retrieved HTTP200 directly. States there is no separate submit button; the project becomes read-only at the deadline. Recheck before the deadline, rather than rely on a generic submit-button instruction.
- https://docs.qorechain.io/build-before-qday/overview/ — public repository, video up to3minutes,testnet address; deadline2December2026 at23:59UTC (3December00:59WAT).
- https://docs.qorechain.io/build-before-qday/workshop-2/ — two-stage flow described as auditing draft, fixing findings with tests, auditing final contract and retaining both reports. A workshop is not proof of acceptance of a particular audit.

The complete numerical category scoring rubric was not present in the retrieved Rules/Prizes page text. No score weights invented. Nigeria is not excluded in the retrieved eligibility section; NG appears in this project's public regional selection. Prize/payment restrictions may apply independently, so this is not a guarantee of payout eligibility.

## Requirement and evidence matrix

| Item | Verified status | Evidence / next action |
| --- | --- | --- |
| Public GitHub + README + licence file | PASS | GitHub API: privatefalse,MIT detected,README and rootLICENSE present. |
| Built during event and credits | PARTIAL | Repository created12November, dated event commits visible. Existing libraries credited inREADME; full originality/history review not repeated in this checkpoint. |
| Category/team | OBSERVED | Public listing Post-Quantum dApp,one member0xaje; permitted1–3. Every-member registration/connected accounts not visible in this public view. |
| Featured image | PASS | Public cover https://d1wkq5kpysgkyb.cloudfront.net/project/38fdc926dcf0b59f.png; PNG1920x1080,1282303bytes,16:9. Current start page permits JPG/PNG/WebP,minimum1200x675,up to5MB. |
| Final video up to3minutes | OPEN | No final public video link/player identified on listing or README. Need exact videoURL and duration plus truthful walkthrough. |
| Testnet address fields | OPEN | Contract and wallet receipts in repo; actual saved listing address fields not exposed in fetched public page. Owner should inspect My space. |
| About / How it’s made | NEEDS OWNER UPDATE | Listing still says planning and future workflow. Replacement copy prepared separately. |
| Scoped EVM window | PASS owner evidence | Opening AEC0DA9D1B75BB795CA4A16781E74580DA991F6B2803115CF6E048F6DBFD60DB,permitted create0x389c084db6f9b64d3c97413f6f94b2c0851ec16ed4e33519b2b2740ae1403f01;outside-target RPC rejection while live. SDK route; no website-opening support claimed. |
| pqcVerify | PASS tested paths | Contract checks + real two-wallet approvals; owner historical valid/altered/duplicate/wrong-version calls4/4. |
| Foundry/Hardhat tests | PASS | Fresh owner Foundry6/6 compiledSolc0.8.28,rawlog retained. |
| Two-stage audit | REPORTS PRESENT; acceptance OPEN | Source-matched16Novfirst and18Novre-audit,findings/tests documented. Same-source reports stillOpen; do not invent acceptance or require another payment. |
| Independent participants | OPEN | Two signer wallets operated by one tester; friends not yet completed workflow. Product acceptance target, not invented additional contest rule. |
| Live app availability | UNVERIFIED THIS CHECK | Agent HTTP request returned403. Prior published source-match and owner mobile tests remain valid; not current visual acceptance or proof app down. Owner should open public URL on phone+desktop. |
| Public feed/GitHub App | PASS observed | Listing timeline shows recent commits ad7ef23,9a13941,ed9d292 and owner-posted regression/scoped updates. No GitHub App repair needed. |
| Ship Weeks | OWNER COMPLETE / freshCheckOPEN | Four tasks owner-confirmed; per-task current portal Check not observed. Optional challenges not a substitute for submission fields. |
| Q-Day Drill | NOT CLAIMED | Registration deadline17November23:59UTC passed without confirmed registration;18November scoped test does not retroactively enter drill. |
| Regional/Campus | SELECTED / eligibility not certified | Public listing shows NG/MiddleEast&Africa andQuantumCampus. Campus requires allmembers actively enrolled and proof if requested. Do not publish private enrolment documents. |

## Judge review

Technical proof is materially stronger: genuine agreement lifecycle, scoped admission/refusal, six Solidity and four historical chain checks, source-matched audits. The public listing currently undersells it as planning; a missing final video and unverified saved address fields could fail submission checks. Unwanted pending amendments, bearer workspace codes, non-E2EE server drafts and unverified backup erasure remain honest product limitations. Backend quotas/retention controls do not establish production readiness.

GitHub About metadata currently has no description/homepage/topics per API. Improve discoverability when that edit is available; it is not stated as a contest blocker. No automatic UI/contract redesign was made.

## Exact next owner action

Open My space → The Record → edit project details. Replace About/How it’s made using PROJECT_LISTING_COPY.md, verify saved demo/testnet addresses and current cover, and save. Final video link remains a separate gate; then inspect current rubric/ShipWeeks Check without assuming badge detection proves workflows. Before deadline re-read official rules.

## Progress update

Earlier regression and scoped-window updates were observed published on the public listing. New readiness update DRAFT, NOT POSTED: Reviewed The Record against the current official requirements, preserved audit and test evidence, confirmed publicMIT repository and valid cover image, and identified final video/listing verification as the remaining packaging work.
