# Withdrawal lifecycle: owner-run acceptance

Recorded 19 November 2026 WAT; transactions occurred 18 November UTC. Owner operated both distinct signer wallets. This is not independent two-person usability testing.

Contract: `0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f`, Diana9800.
Agreement: `0x2152af51be0fa909eb937df619ee19e62f7ad49f4e8ea84f92a7273d9977cd7b`.
Source SHA256: `688545ad745ece328b60f61d6348e1744b093359bd0eb2d7e02a306df3193980`.

| Version | Evidence and observed outcome |
| --- | --- |
| 1 | Creation block10340116; first approval10340424; second approval/finalization10340599. Owner capture confirms original agreement-v1 file still matches finalized version1 after the withdrawal and correction. |
| 2 | Proposed10340772; one approval10340968; Withdrawn10341213. Owner capture shows matching file is withdrawn and cannot be approved. Historical approval remains visible and does not count toward the correction. |
| 3 | Proposed10341402 with zero approvals, despite reusing the same changed file as version2; fresh first approval10341667; second approval/finalization10341772. Owner capture confirms changed sample matches finalized version3. |

The same agreement ID was retained, but version numbers were not reused. This exercised withdrawal and re-proposal of the SAME changed file; do not describe it as a third distinct document edit.

## Receipts

EVM hashes below are independently retrieved event transactions. Owner native hashes are saved in the matching JSON records; correspondence was checked by receipt block and event/state, not a separately established cross-lane hash mapping.

- [Version1 proposal](https://dashboard.qorechain.io/explorer/tx/0x15bce8b18a7753426f5d6637ff742046f9ed0740ed732c75dfd6cc1167865924)
- [Version1 finalization](https://dashboard.qorechain.io/explorer/tx/0xc9d91701e992c49a951c0a82057623d9cf105a8c8256fcfe8da464e9f52078b1)
- [Version2 proposal](https://dashboard.qorechain.io/explorer/tx/0x54d47c78bfb3e13e80ece88f3a180b260fe6793517b1dd99c0460787e0637579)
- [Version2 approval](https://dashboard.qorechain.io/explorer/tx/0xc9ba6c589f633389b2beed378833726b5b432eb7ec5d8be0a7448aaa6225a581)
- [Withdrawal](https://dashboard.qorechain.io/explorer/tx/0x7b41df12ed1e2dee4ddc680b13cc35cbece6c48d3af7102074838b3f2f2b465e)
- [Version3 proposal](https://dashboard.qorechain.io/explorer/tx/0x0051ef529b077ac550c22b6b57ea30ac197f5ecd017527c4eda70b72fecea257)
- [Version3 first approval](https://dashboard.qorechain.io/explorer/tx/0x372faa2a576cfd57dc06d272139254b5e8d52e50e2e942ff3e1db7013b383d7d)
- [Version3 finalization](https://dashboard.qorechain.io/explorer/tx/0xab11d9e3409fd974af93039a7d30abee1f409027c183cdbb1e61ad8c32086960)

## Owner-supplied UI captures

- [Original remains verifiable](original-v1-still-matches.png)
- [Withdrawn version cannot be approved](withdrawn-v2-cannot-approve.png)
- [Correction finalized match](correction-v3-finalized-match.png)
- [History capture](history-230154.png)
- [History capture continued](history-230244.png)

History UI reports three versions checked against Diana snapshot10342046. Captures show V3 finalized with two distinct approvers, V2 withdrawn with its approval and withdrawal receipt, V1 finalized with its original receipts. These are owner-provided browser captures, not independent physical-device inspection by the agent.

## Judge review and remaining gates

PASS: owner-run positive withdrawal/re-proposal lifecycle, two fresh approvals, preserved original, accurate withdrawn state and all three versions in the UI history. Local37JavaScript checks and23Solidity tests are separate evidence; state-seeded tests are not successful native PQ execution proof.

OPEN: replay of version2's signature against version3 using a read-only actual Diana call; extra hostile-case checks; scoped admission/refusal targeting this NEW contract (old scoped proof targets old contract); audit of this exact changed source and specific event acceptance; independent participants. Do not declare the whole product or contract security certified. PR1 remains draft; default legacy links remain pinned to the original deployment.

Official requirement retained: scoped EVM window, pqcVerify, two-stage QCAI audit, Foundry/Hardhat tests. New source cannot inherit the old source's audit reports. ShipWeeks four owner-confirmed complete/fresh portal Check not observed; no Q-Day entry claimed.

Next engineering action: save real historical negative-signature/read-only regression for V2, then prepare exact new-source audit input while leaving unrelated audit fixes queued. No further positive-flow transaction needs repeating.

## My space update — READY, NOT POSTED

I tested The Record's pending-update withdrawal on QoreChain Diana. An update with one approval was withdrawn, then re-proposed as a new version requiring two fresh approvals. The original finalized file remains verifiable, and History shows all three versions with receipts. Public evidence is retained in the repository. New-contract audit and additional security checks remain open.


## Read-only security checkpoint — 19 November 2026 WAT

All14historicalDiana checks passed:3positivecontrols and11negativecases. See [raw output](security-regression.txt), [structured results](security-regression.json) and [repeatable script](../../scripts/check-withdrawal-security.mjs). The old version2 signature was rejected for version3 even though the fingerprints were identical. Withdrawal/approval signatures were not interchangeable; altered, unauthorized, duplicate, withdrawn and finalized-version cases failed with the expected contract errors. These are actual historical eth_call responses using public recorded signatures, not newly broadcast failed transactions.

The earlier replay-check gate above is now resolved for these tested cases. New-source auditor report/event acceptance, V2-targeted scope proof and independent users remain open. Exact input and remaining limits: [audit handoff](AUDIT_HANDOFF.md).
