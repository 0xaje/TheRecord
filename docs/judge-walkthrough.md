# Milestone 1 judge walkthrough

The Record anchors agreement fingerprints on Diana. Two designated signer addresses approve each version. The browser hashes the selected file locally.

## Reproduce the verification results

The hosted preview requires access. Reviewers with access can run these checks without signing a transaction.

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

One tester operated both wallets. Independent participant testing is deferred. The wallet warning is unresolved and the Ship Weeks PQC contract badge remains unearned. See [the Diana evidence log](diana-evidence.md).
