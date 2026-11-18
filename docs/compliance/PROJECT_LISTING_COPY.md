# Project listing copy — ready for owner review, not published

Listing: https://build.qorechain.io/p/the-record

## About

The Record helps two parties prove which version of an agreement they approved. Built on QoreChain Diana testnet, it records a file fingerprint and requires approval from two designated wallets for each version. Anyone can check a copy locally in their browser: the original matches, and a changed file fails. Amendments require two fresh approvals while earlier finalized versions remain verifiable. The full agreement file stays off-chain.

## How it’s made

The Record uses a Solidity contract on QoreChain Diana (EVM chain ID 9800), QoreSign, the QoreChain SDK, viem and QoreX. Agreement approvals are checked on-chain through pqcVerify using registered ML-DSA-87 keys with proof of possession. A separate live SDK test opened a contract-restricted EVM window: The Record’s transaction succeeded, while a signed transaction outside the allowed recipient list was rejected. QoreX mobile does not support opening that scoped window from our website; the documented Ubuntu test uses a disposable account.

The browser computes the selected file’s SHA-256 fingerprint locally. A Worker and D1 database provide private draft workspaces, invitations, saved revisions, Trash and permanent deletion. Drafts are access-controlled but are not end-to-end encrypted. QoreChain stores fingerprints and approval records, not full documents.

The public repository contains real Diana receipts, two-wallet finalization and amendment evidence, both source-matched QCAIA audit reports and finding responses, six passing Solidity tests and four passing historical Diana signature checks. One tester operated both signer wallets; independent participant testing is pending. No third-party security certification is claimed.

Source and evidence: https://github.com/0xaje/TheRecord
Audit reports and tests: https://github.com/0xaje/TheRecord/blob/main/docs/AUDIT.md
Live application: https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/

## Addresses

Contract: 0x25721b3Be0F24438DA7DAEd4C800B073ef9BB802
Network: QoreChain Diana testnet; EVM chain ID 9800

Use the owner’s registered QoreX testnet address in the wallet field, not automatically the disposable SDK account. Confirm the form's expected address format and existing connected wallet before replacing a value. Do not enter a recovery phrase or private key.

## Remaining listing fields

Keep the existing cover image: fetched public PNG is1920x1080 and1282303bytes, satisfying current size/shape rules. Final video URL remains unverified; do not paste a placeholder. Demo field should link to the live application, after the owner confirms it opens. Current public About/How it’s made text still says planning; this document is a draft replacement, not a claim it was published.
