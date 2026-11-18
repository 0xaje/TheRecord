# Walkthrough and Blog review — 18 November 2026

Scope: preserve the existing design, licensed illustrations, scrolling chapters and real match/mismatch screenshots. Explain general two-party document use. No political tracker, wallet transaction, contract change or backend policy change.

## Changes

The Walkthrough now has ten chapters:

1. Save private revisions.
2. Review the same terms.
3. Record the file on QoreChain Diana.
4. Collect both designated approvals.
5. Check the original file.
6. Reject a changed copy.
7. Approve an amendment with fresh consent.
8. Read public agreement history.
9. Manage Trash, restore and deletion.
10. Keep files and workspace recovery access.

Step numbering, including the mobile menu label, derives from `chapters.length`. Illustrations explain controls; they are not new transaction evidence.

The Blog adds brief sourced UK, Canadian and Nigerian examples; QoreChain, QoreX, ML-DSA and scoped-access roles; private versus public history; recovery/deletion limits; audit and regression links. Build, legacy identity trust and service-limit details stay in an expandable technical section. Credits remain available.

## Verification

- `npm run check`: 29 passed, 0 failed.
- New isolated navigation tests check chapter/menu alignment and Blog anchors avoiding application-screen collisions. These are interface tests, not chain proof.
- Desktop cloud-browser preview at 1348 × 926 rendered all ten chapters. Clicking chapter 10 reached its content and active highlight.
- The Blog rendered all eight sections. Its history anchor remained inside the Blog. A source-level collision with the app's History route was fixed by naming the anchor `version-history`.
- Screenshots were inspected in tool output; no saved screenshot artifact is claimed here.
- The preview used built HTML, JavaScript and assets. No wallet or Draft API action was performed.
- Mobile styles remain responsive in source, but a mobile viewport and real-phone visual acceptance were not exercised. That check remains OPEN.

Version 42 deployed successfully. Published HTML and browser JavaScript match this build byte for byte; see `walkthrough-blog-publication.json` and `walkthrough-blog-published-bytes.json`. The existing six Solidity and four historical Diana checks are linked evidence; they were not rerun for this content-only change. Independent participant testing remains pending.

## Judge review

The educational pages now describe the current working features and their limits. They distinguish draft storage, on-chain approval and local verification. Mobile visual acceptance remains the main unfinished check for this milestone; there is no full-product sign-off.

The current Post-Quantum dApp evidence requirements still apply. All four Ship Weeks tasks are owner-confirmed complete; a fresh portal Check was not observed. Q-Day Drill registration expired without confirmed participation.

## My space update — draft, not posted

Updated The Record's Walkthrough and Blog with saved revisions, real Diana history, Trash and recovery, brief sourced examples, and QoreChain integration details. Navigation and existing regressions pass 29 checks. Phone visual acceptance is still pending.
