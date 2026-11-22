# TheRecord — judge walkthrough (original and V2 evidence)

The Record anchors agreement fingerprints on Diana. Two designated signer addresses approve each version. The browser hashes the selected file locally.

## Reproduce the verification results

The public verifier is available without signing a transaction.

| Record | File | Expected result |
| --- | --- | --- |
| [Version 1](https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/?id=0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e&version=1) | Original agreement | Matches finalized version, 2 of 2 approvals |
| [Version 1](https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/?id=0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e&version=1) | Amended agreement | File does not match this version |
| [Version 2](https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/?id=0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e&version=2) | Amended agreement | Matches finalized version, 2 of 2 approvals |

Select the indicated file and click **Verify file** each time. Use the exact demo bytes below. Each file ends in one LF newline.

```sh
printf '%s\n' 'The Record test agreement: deliver one draft by Friday.' > agreement-v1.txt
printf '%s\n' 'The Record test agreement: deliver one draft by Monday.' > agreement-v2.txt
sha256sum agreement-v1.txt agreement-v2.txt
```

- Version 1 SHA-256: `265716da974845a4efb3cac9471865969f22878da81b99e81a8aaa7349e480fd`
- Version 2 SHA-256: `66007b246f8885ac7bb25c54757d6ee20d619ca148ef85fea64d0f091d713ee0`

## Diana evidence

The same two signer addresses approved each version. The amendment started at zero approvals and finalized after two fresh approvals. Version 1 remained finalized and verifiable.

- [Contract deployment](https://dashboard.qorechain.io/explorer/tx/0x0cee4b8ec137fa45d2b765ddf2eaff928cd7571a02a9369eb5bff0b7ad9bfbfd)
- [Version 1 finalization](https://dashboard.qorechain.io/explorer/tx/0xb8b3895071b1ef1f9afbf665b52482b277ee312dfac5f090117ac50479927487)
- [Amendment proposal](https://dashboard.qorechain.io/explorer/tx/0xaffbce6e2ba2a1957c42d8bfff1d829fa92948c49081416e27dc1491c2b68341)
- [Version 2 first approval](https://dashboard.qorechain.io/explorer/tx/0x5a4b0020a0a0d8980e63d7045b23594d24b6eb648fb7d8c3c6f23649096bf8b2)
- [Version 2 finalization](https://dashboard.qorechain.io/explorer/tx/0xd59158244fd94d9b2a83d9d7d1693fe56887704409538f9c396cb99c3230af70)

## V2 withdrawal-enabled agreement lifecycle

The original contract above remains available for the wallet-free original-versus-changed-file demo. A **separate deployed V2 contract** demonstrates an additional correction workflow: V1 finalized, V2 amendment proposed and approved once, V2 withdrawn, and V3 proposed with two fresh approvals and finalized. The withdrawn version number is not reused, and finalized V1 remains verifiable. This is a different agreement/deployment from the original demo; do not combine their version numbers.

- [V2 lifecycle, receipts and acceptance evidence](withdrawal/LIVE_ACCEPTANCE.md)
- [V2 deployment/source verification](withdrawal/deployment-verified.json)
- [V2 finalization receipt](https://dashboard.qorechain.io/explorer/tx/0xab11d9e3409fd974af93039a7d30abee1f409027c183cdbb1e61ad8c32086960)
- [Current project evidence and completed audit](CURRENT_STATUS.md)

## Acceptance status — 22 November 2026

The owner reconfirmed on 23 November 2026 that drafts, file verification and walkthrough work on the current public site when tested on phone. This is owner-reported phone acceptance, distinct from independent two-person participant acceptance. The recorded two-wallet workflows were operated by the project owner. **Independent two-person participant testing is pending**, not currently verified or already completed. The owner confirms final submission, My Space updates and Ship Weeks checks complete. These are owner confirmations, not independent portal read-backs. The QCAIA project audit task is complete; the original reports remain preserved. See [audit response](AUDIT.md).
