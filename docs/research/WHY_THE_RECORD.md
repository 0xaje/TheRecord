# Why The Record exists — evidence review

Research date: 18 November 2026. Purpose: support the product explanation with verifiable evidence, not promise that software prevents every dispute. Research review is complete; customer demand, willingness to pay and measured dispute reduction remain unvalidated. No application or contract policy changed in this milestone.

## Main conclusion

The strongest defensible problem is **uncertainty about the exact version two parties approved**. Informal conversations, document exchanges and later revisions can leave people reconstructing agreement terms and acceptance after work has started.

The Record provides one narrow answer: for a specified agreement ID and version, do both designated wallet keys have verified approvals, and does this file match the recorded fingerprint? This is technical evidence of key-based approval and byte integrity. Legal identity, authority, informed consent, performance, payment and enforceability are separate questions.

## Evidence and what it supports

### 1. United Kingdom: work started before final execution

**Documented fact:** In RTS Flexible Systems v Müller, [2010] UKSC 14, parties began work before completing their intended formal contract. The dispute reached the Supreme Court over whether a contract existed and its terms. The judgment records an agreed price of £1,682,000; this was the contract price, not measured loss or legal fees. [S1]

**Our inference:** recording explicit approval of an identified version before work begins could reduce uncertainty about the document approved. It would not decide every question about later conduct, variations or contractual meaning. This case is not evidence of document forgery or blockchain necessity.

### 2. Canada: an informal acknowledgement became disputed acceptance

**Documented fact:** The Supreme Court of Canada's file 41671 summarizes Achter Land & Cattle v South West Terminal. A photographed contract was sent by text and answered with a thumbs-up. Whether that response bound the sender became disputed. The trial judgment awarded C$82,200.21; the appeal was dismissed, and leave to appeal was denied 24 July 2025. The refusal of leave was not a fresh Supreme Court merits judgment. [S2]

**Our inference:** explicit wallet approval linked to a full file/version could provide clearer technical evidence than an ambiguous chat response. It cannot guarantee a court's interpretation or identify the human behind a wallet. The outcome depended on circumstances and prior dealings; not every emoji creates a contract.

### 3. United States: payment disputes affect small engagements too

**Documented fact:** NYC's five-year report records 2,542 freelancer complaints in FY 2019–2023: 2,184 alleged payment-practice violations and 264 alleged failure to provide a written contract. Categories can overlap. At least 773 freelancers self-reported recovered payments totaling about US$2.9 million. Approximately 51% of reported contract values were US$5,000 or less. This is a local administrative dataset, not a random global sample. [S3]

**Our inference:** freelancers and small client engagements are a plausible first user group. These complaints do not establish that disputed document versions caused nonpayment, or that The Record would recover the money.

### 4. United States: evidence alone does not enforce payment

**Documented fact:** On 5 June 2025, NYC DCWP announced a BuzzFeed settlement providing over US$45,000 in relief for 16 freelancers who complained about late payments. [S4]

**Our inference:** this demonstrates financial consequences and the continuing need for enforcement. The Record could preserve terms and approvals, but has no escrow, collection, adjudication or payment-enforcement function. We must not claim this settlement would have been unnecessary had the parties used our app.

### 5. Global industry research: broader contract-management friction

**Documented fact:** A 22 September 2025 WorldCC announcement describes a cross-industry study of nearly 200 businesses, conducted with the Commerce and Contract Management Institute and Icertis. It reports 70% acknowledging a disconnect between contracts and financial oversight. This is an industry-reported survey with vendor participation; the announcement does not establish a representative global prevalence estimate. [S5]

**Our inference:** contract governance merits attention, but this broad evidence is weaker support for our specific file-version problem than the documented cases. Do not convert contract-management value erosion into The Record's addressable savings or market size.

## What a counterfactual demonstration can honestly show

Use an explicitly hypothetical client/freelancer scenario, not a reconstruction claiming to change the outcome of a real case:

1. Both approve a file saying delivery is Friday. Show the finalized version and its two signer approvals.
2. Someone supplies a file saying Monday against that version. Verification must show a mismatch. It establishes different bytes, not who altered them or whether the alteration was fraudulent.
3. Both genuinely accept the new terms. Propose version 2; approvals start fresh.
4. Finalize version 2 and recheck the original file against version 1. Earlier evidence remains available.

Say: **“This would make the approved file version independently checkable.”** Do not say: “This would have prevented that lawsuit,” or “The client must pay because the chain says so.” No study reviewed here measures The Record's effect on dispute frequency, costs or recovery.

## Why QoreChain matters

NIST standardized ML-DSA in FIPS 204 on 13 August 2024. Its stated functions include signature verification and detection of unauthorized data changes; NIST describes ML-DSA as believed secure against large-scale quantum adversaries. This supports a standards-based direction, not a certification of The Record or a prediction that current disputes involve quantum attacks. [S6]

QoreChain documents hybrid native signing and PQ-authorized EVM windows, including contract-target restrictions. [S7,S8] The Record additionally verifies agreement-approval signatures through pqcVerify with registered possession-proven ML-DSA-87 keys. Actual project evidence is linked below. The EVM transaction itself has an ordinary classical signature; its admission window and the agreement's PQ signature check are distinct protections.

Our inference: agreements may need to be checked long after signing, so post-quantum verification is a useful design consideration. We have not proven lifetime security of every dependency, future key recovery, legal admissibility, or indefinite independent offline verification. Trust in the chain, original file availability, software and key custody remains.

Blockchain adds a shared public approval/version record that neither party can edit through this application alone. It is not the only way to create reliable evidence. A trusted signing service or correctly implemented signed audit record can also address integrity and approval needs. The tradeoff is public metadata, transaction fees, wallet friction and infrastructure dependence.

## Existing solutions and affordability

| Approach | Existing capability | The Record's distinction and tradeoff |
| --- | --- | --- |
| Docusign | Its own documentation describes tamper-evident documents, event data and Certificates of Completion. [S9] | Do not claim conventional signatures lack audit trails. Our difference is public chain approval history and on-chain ML-DSA verification; we have not established universal superiority or equivalent legal/identity features. |
| Documenso Community Edition | Official docs describe core document signing and self-hosting under AGPL-3.0. [S10] | Open-source signing already exists. We cannot claim The Record invented affordable or self-hosted signing. Deployment, maintenance, recovery and certificates have operational costs. |
| Exchanged files / basic file hashes | A hash comparison can reveal byte differences when a trusted reference is available. | A hash by itself does not establish agreement by both designated keys. The Record links approvals to contract, chain, agreement, version and fingerprint. |

**Affordability is a hypothesis, not a verified advantage.** Testnet faucet tokens have no demonstrated relationship to production user cost. Measure registration, window-opening and all agreement transactions, hosting/storage, wallet setup time and support burden. Compare equivalent workflows, currency/date/region, free tiers, self-hosting costs and signature limits. Do not equate test-QOR usage to dollars or advertise “cheaper than Docusign” without a current comparison.

Public fingerprints do not encrypt a document: if an attacker can guess its exact contents, they can test candidate hashes. Public approval addresses and version metadata are visible. Browser verification need not upload the selected file, but using private drafts stores text on the server; those drafts are not end-to-end encrypted. Losing the original file cannot be repaired from its fingerprint.

## Initial customer hypothesis and validation plan

Proposed first audience: independent developers, designers and small agencies already comfortable with wallets, working with repeat clients on deliverables that change. This is a testable focus recommendation, not a scope change or validated customer segment. We have no representative Nigeria/Africa-specific prevalence estimate for version disputes from this review; do not label US/UK/Canada cases as Nigerian incidence data.

Suggested next interviews: 5 freelancers/small agencies and 5 clients. Ask about their most recent actual scope/approval dispute, the existing tool used, time spent finding evidence, any financial consequence, and what still would not be solved by an exact signed version. Ask before showing the product. Obtain permission before retaining anonymized notes; never request private contracts or wallet phrases.

Then independently observe at least two participants complete the real workflow without coaching. Record completion, time, confusion, errors, recovery and whether they would choose it over their current tool. Repeated use on a genuine non-sensitive engagement is stronger evidence than saying the idea sounds good. Define any numerical success target before testing and label it as our chosen target, not an established industry benchmark.

## Project evidence: technical proof, separate from market evidence

- [Real two-wallet agreement lifecycle and amendments](../diana-evidence.md).
- [Judge's original/mismatch/version 2 reproduction](../judge-walkthrough.md).
- [Scoped opening, permitted contract call and outside-recipient rejection](../compliance/UBUNTU_SCOPED_WINDOW.md#live-owner-result-and-read-only-review--18-november-2026).
- [Source-matched audits, dispositions, six Solidity checks and four historical Diana signature checks](../AUDIT.md).

These establish tested technical behavior, not customer demand, reduced legal costs, a legal identity system or a production security guarantee. Friends' independent acceptance remains pending.

## Statements to avoid

- A global percentage of freelancers with version disputes: not established here.
- A claim of billions saved by The Record: not measured.
- Using WorldCC's often-repeated 9%/9.2% estimate as universal annual lost revenue caused by altered files: wrong scope and denominator; one WorldCC paper itself discusses scientific-validation limits. [S11]
- Saying every unpaid freelancer lacked a written contract: contradicted by the distinction between complaint categories.
- Saying legal signatures or tamper-evident evidence did not exist before blockchain: false.
- Calling our testnet signature flow proof of identity, consent, delivery, payment or court acceptance: beyond what was tested.

## Judge review and next action

The problem case is credible and supported across jurisdictions; the product's strongest fit is exact-version approval evidence. The claim that users will switch tools, handle keys or pay for this remains unproven. Quantum protection strengthens the security story but should not obscure the ordinary user problem. Next: use the short pitch, then collect independent usability evidence and interviews before expanding claims. No contract redesign or automatic website copy publication is authorized by these research findings alone.

## Sources

All accessed 18 November 2026. Court documents are illustrative case evidence, not legal advice or worldwide rules. Publication dates and geographic scope are stated above. Findings labeled “our inference” are not source conclusions about The Record.

- S1 — UK Supreme Court, RTS case page: https://www.supremecourt.uk/cases/uksc-2009-0048 ; official judgment, paragraphs1–4 and related terms: https://caselaw.nationalarchives.gov.uk/uksc/2010/14
- S2 — Supreme Court of Canada, file 41671, Registrar's summary, lower court rulings and leave docket: https://www.scc-csc.ca/cases-dossiers/search-recherche/41671/ . Registrar summaries are informational, not reasons of the Supreme Court.
- S3 — NYC DCWP, 5-Year Report, 1 November 2023, PDF pages 3 and 6–9: https://www.nyc.gov/assets/dca/downloads/pdf/workers/DCWP-Freelance-Isnt-Free-Act-Five-YearReport-2023.pdf
- S4 — NYC DCWP, BuzzFeed settlement, 5 June 2025: https://www.nyc.gov/site/dca/news/017-25/dcwp-settlement-buzzfeed-late-payments-freelancers
- S5 — WorldCC, 22 September 2025 survey announcement: https://news.worldcc.com/news-from-worldcc/stop-the-leakage-worldcc-report-provides-blueprint-for-recovering-5.4-of-contract-value?hs_amp=true
- S6 — NIST FIPS 204, 13 August 2024: https://csrc.nist.gov/pubs/fips/204/final
- S7 — QoreChain post-quantum signing: https://docs.qorechain.io/developer-guide/post-quantum-signing/
- S8 — QoreChain EVM window reference: https://docs.qorechain.io/developer-guide/evm-window-reference/
- S9 — Docusign, Use of Transaction Data: https://www.docusign.com/trust/security/transaction-data-use
- S10 — Documenso Community Edition: https://docs.documenso.com/docs/policies/community-edition
- S11 — WorldCC Foundation, Contract value erosion: the story so far (context/caution, not headline evidence): https://www.worldcc.foundation/Portals/IACCM/Resources/10655_0_Overcoming-the-10-pitfalls.pdf
