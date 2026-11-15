# Diana milestone 1

- Network: QoreChain Diana (9800)
- Contract: `0x25721b3Be0F24438DA7DAEd4C800B073ef9BB802`
- Agreement: `0xe44d6037597db50ebada96fc37606bfcab58d75c0ed593aaf7ce7a17af2ecace`

| Step | Transaction |
| --- | --- |
| Deploy | `0x0cee4b8ec137fa45d2b765ddf2eaff928cd7571a02a9369eb5bff0b7ad9bfbfd` |
| Propose version 1 | `0x935c510ec0c6f7d6224a9f7210f6be323bfabe35b56e559963ad989cb379af21` |
| Approve version 1 as A | `0xf629c9d329bce7f61eefd0e8fb45411cdd58a296af6d7bcd6c70b324c5cb6e55` |
| Finalize version 1 as B | `0x1d9b3c2b865342966b33c8e83d62a47da710109d0aa5d303a218378bf6581f98` |
| Propose version 2 | `0xc7ede5238f238a56fbf068bdb0061d16a88a290fde7fb7315613972f336e3748` |
| Approve version 2 as A | `0x4a9a66566a17cfc6b008cccab14585a97c4461c00ba7ed09d1cc0adcfcaf6232` |
| Finalize version 2 as B | `0xf507edada4cfdb80df5e907d287f820481d6efea61b53eda069bb428482da019` |

Both versions read back as finalized. A local SHA-256 check matched each
version to its own test file and rejected the edited file against version 1.
A read-only contract call rejected reuse of Signer A's version 1 signature
for version 2 with InvalidApproval.

My space amendment update drafted. Publication unconfirmed. GitHub feed and
PQC contract badge unverified. Hosted creation and independent signing remain open.

## Hosted verification checkpoint

- Preview: https://the-record-diana-verifier.flutteringpeach8.chatgpt.site
- Browser confirmed by the project owner: the Monday amendment fails against
  version 1 and matches finalized version 2.
- Live RPC test harness: both matching pairs passed and both cross-version
  pairs failed. The original-file match still needs confirmation in the hosted UI.
- No hosted transaction or independent browser approval has been demonstrated.
- Next: confirm version 1 in the hosted UI and decide the user-controlled
  signing flow before implementing key handling.

The owner subsequently confirmed the original file matches finalized version 1
in the hosted browser. The owner approved exploring device-local signing for
dedicated Diana accounts. Browser creation is implemented locally. A live
browser creation receipt and independent signing remain unverified.

## Hosted creation checkpoint

The hosted form created agreement
`0xe5cdfb7a3c2812851efcc212cc1804f172719cdd06311251a0844996bc9305bb`
on Diana. Receipt:
https://dashboard.qorechain.io/explorer/tx/0xcd03d90e67609e33d9633afb9060f8b767389c401db1269f3cef7e1a40d99f60

The owner reported a MetaMask warning while submitting. Exact wording is
unconfirmed. The My space creation update is drafted. Hosted signing and
independent use by two participants are pending.

The hosted review showed a matching file and zero of two approvals for the
website-created agreement. Browser approval now builds locally with QoreSign.
It uses an existing dedicated test signer file in memory and the user's
wallet for submission. Browser key generation, registration, recovery,
live approval receipts, and the MetaMask warning review are still open.

## First hosted approval

Diana returned receipt status `0x1` at block `0x9a1f29` and emitted an approval
for Signer A on version 1 of the hosted-created agreement.
https://dashboard.qorechain.io/explorer/tx/0x973d6dd52848df24a398e56f836ebfd599583458588a1837e106d85e22b4c88e

The recording shows MetaMask displaying “Malicious site” and “High-risk
request.” The initial broadcast failed while the mobile EVM authorization
window was closed, per the tester. The successful retry verifies the approval
only. The wallet warning remains a release blocker. Next action is to capture
the warning details and investigate the deployed origin before another hosted
wallet transaction. The second independent approval and browser onboarding
remain open. My space update drafted, awaiting owner review.

## Wallet warning investigation

The support reply supplied by the owner gave no classification reason.
GitHub issue search returned no matching report for the preview hostname.
In the local browser bundle, the approval handler reads the test mnemonic
locally and sends MetaMask an approve call with a zero value and the derived
PQC signature. The live bundle returned HTTP 401 to an unauthenticated
request, so deployed byte parity is unverified. Next: obtain manual review
and compare the deployed bundle from an authorized session. No report filed
by this review and no second approval submitted.

The approval form now gives a QoreX-specific instruction when the wallet
reports an EVM authorization-window error. The local browser build passed.
Deployment and a browser check of the error message are pending. Next,
verify the public Diana approval count without signing, then validate
independent signer setup before the second browser approval.

## Browser signer setup

The local browser build can generate and download a dedicated Diana test
signing file and display its public addresses. Build and generation check
passed. Hosted deployment, browser funding and key registration, and a
second independent Diana approval receipt remain pending. Existing approval
submission remains available. Next action: implement signer registration
and verify it on Diana. My space update drafted for owner review.

Browser registration implemented locally using the same native Diana message
as the terminal registration. Build and diff checks passed. Next: deploy
the browser build, fund a fresh browser-generated account, register it,
and save the successful Diana receipt and key status. Browser REST access
and actual registration remain unverified. No new on-chain evidence yet.

Hosted registration blocker: the Diana REST broadcast endpoint returned
HTTP 501 (Not Implemented) to the browser CORS preflight from the existing
preview origin on two checks. Registration was not deployed or broadcast.
No live receipt or key status is available for browser registration.
Next: obtain browser CORS support from QoreChain or get owner approval
for a same-origin relay that forwards only signed testnet transactions.

The owner approved the same-origin relay. The local Worker forwards only
Diana registration and its required lookups. Browser and Worker builds
passed. Local checks rejected unsupported paths, missing origin, malformed
requests and oversized bodies. A real node-info lookup through the relay
returned qorechain-diana. The existing hosted preview still needs a Worker
deployment. No browser registration receipt or independent approval yet.

The Worker deployment succeeded on the existing owner-only preview.
Source commit: 0bd6da98806f3d560ef65235107f8484e266149a
Preview: https://the-record-diana-verifier.flutteringpeach8.chatgpt.site
The packaged Worker was checked locally for exact browser bundle output.
Next: from the signed-in preview, generate a disposable signer, fund it,
register its key, and capture the Diana receipt and key status. The
existing agreement already names a different Signer B, so independent
onboarding with a newly generated account needs a new agreement.

Hosted HTTP 502 root cause: the Worker rejected fetch redirect mode "error"
before contacting Diana. Fixed using manual redirect handling and explicit
3xx rejection. Deployed source 38687593755287bb93b55b9756853ac1bdd2b605.
Authenticated live checks returned HTTP 200 for Diana node info and the
tester's account lookup. Registration submission and receipt remain pending.

Hosted registration verified on Diana at block 10102007, code 0.
https://dashboard.qorechain.io/explorer/tx/7DD5E88939722ACB767367A415CD81CA8FC52CC927315EA2A5B38DBAD4DE31CA
Signer 0xe850dd992f72c76c53c0dfefef0215e0480fdf7f has registered=true,
algorithm=1, possessionProven=true. My space update drafted. Next: create
a new agreement naming this signer and a distinct second participant,
then capture both browser approvals and finalized verification.

New hosted agreement `0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e`: Diana version 1 matches agreement-v1.txt, approval mask 0, finalized false. Next: first browser approval with newly registered signer.

Browser-generated signer 0xe850dd992f72c76c53c0dfefef0215e0480fdf7f approved
the new agreement version 1 at Diana block 10102613.
https://dashboard.qorechain.io/explorer/tx/0xa3de0b1dd9eb6607d39cce393b48cfc2478e9a7c4a22efcb75531d78d3cb9f3f
Readback: one of two approvals, finalized false. Next: named co-signer
approves from their own device, then verify finalized file. My space draft ready.

New hosted agreement version 1 finalized on Diana at block 10134396.
Second approval: https://dashboard.qorechain.io/explorer/tx/0xb8b3895071b1ef1f9afbf665b52482b277ee312dfac5f090117ac50479927487
Readback: approval mask 3, finalized true, original fingerprint unchanged.
Co-signer key registered with proof of possession. Browser recheck of original
and changed files pending. Independent device use not yet confirmed.

Hosted browser checks passed for the new finalized agreement version 1.
The original agreement-v1 (1).txt matched and agreement-v2.txt was rejected
against version 1. Both screenshots showed finalized and two approvals.
Screenshot references: image(20261115-124700).png and image(20261115-124743).png.
Next: propose version 2 from the original proposer, verify zero approvals,
collect two fresh approvals, and recheck original version 1.

The amendment form built and deployed to the existing private preview.
It hashes the changed file locally, submits from the proposer wallet,
and links to the version emitted by Diana. Live amendment receipt and
fresh approvals remain pending.

Hosted amendment confirmed at Diana block 10135024.
https://dashboard.qorechain.io/explorer/tx/0xaffbce6e2ba2a1957c42d8bfff1d829fa92948c49081416e27dc1491c2b68341
Version 2 fingerprint 0x66007b246f8885ac7bb25c54757d6ee20d619ca148ef85fea64d0f091d713ee0,
approval mask 0 and finalized false. Version 1 retains its original
fingerprint, approval mask 3 and finalized true. Next: collect two fresh
browser approvals for version 2. My space draft ready for review.

Version 2 first approval verified at block 10135460, mask 1, finalized false. Next: co-signer approves version 2.
https://dashboard.qorechain.io/explorer/tx/0x5a4b0020a0a0d8980e63d7045b23594d24b6eb648fb7d8c3c6f23649096bf8b2

The distinct co-signer approved version 2 at Diana block 10135591.
https://dashboard.qorechain.io/explorer/tx/0xd59158244fd94d9b2a83d9d7d1693fe56887704409538f9c396cb99c3230af70
The receipt emitted Approved and Finalized for version 2. Both versions
read back finalized with approval mask 3 and their respective fingerprints.
Next: capture browser rechecks of both files after amendment finalization.
My space update drafted for review.

Post-amendment browser rechecks passed: agreement-v2.txt matched finalized
version 2 and agreement-v1 (1).txt still matched finalized version 1.
Both screenshots show two of two approvals. Evidence: image(20261115-131137).png
and image(20261115-131225).png.

Milestone 1 review: the hosted Diana workflow passed the original-file,
changed-file, and fresh-amendment-approval checks. Distinct wallets are
verified on-chain. Independent participant/device use remains unconfirmed.
The MetaMask alert, walkthrough for judges on the private preview, and
Ship Weeks and Developer Fest feed confirmation remain open. My space
closeout draft ready for owner review. Next: confirm independent device use
and review event evidence before calling the milestone closed.

The tester confirmed that they submitted both signer approvals themselves.
This verifies the two-wallet workflow. Independent participant use is still
pending. Next: grant a participant access to the private preview, have them
register and control their own signer, and capture their approval on a new
Diana agreement.

Owner deferred the independent participant test. Continue Milestone 1
evidence and event checks in parallel with that open item. Two distinct
wallets were exercised by one operator. A later separate participant
test is needed to claim independent use. Next: check the event timeline
for the GitHub milestone commit and confirm Ship Weeks eligibility with
the real deployment receipt.

Ship Weeks PQC contract check rejected the verified deployment hash with
“The contract does not call the PQC precompiles.” Diana runtime bytecode
contains PUSH2 references to 0x0A01 and 0x0A02 plus both ABI selectors
(0xf52bde0a and 0x850dfe51). Badge remains unearned. Next: ask the
organizer how its checker recognizes PQC calls and provide both receipts.
