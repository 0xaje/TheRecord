# The Record

The Record lets two parties review an agreement, approve the same version on QoreChain Diana testnet, and verify a copy against its finalized fingerprint. The full text stays off-chain.

## Try the workflow

1. Sign in to save a private draft. Create an invitation and share its link and access code with the reviewer.
2. Open the invitation with the code and download the reviewed revision.
3. Use the exported file to create a Diana record with two registered signer addresses. Each signer approves the same version.
4. Verify the exported file against the finalized version. An amendment needs two fresh approvals.

[Live testnet app](https://the-record-diana-verifier.flutteringpeach8.chatgpt.site/) · [Judge walkthrough](docs/judge-walkthrough.md) · [Diana evidence](docs/diana-evidence.md)

## Build

From the `milestone-1` branch, using Node.js:

```sh
npm ci
npm run build:site
```

The browser build is in `dist/` and the Worker entry point is `dist/server/index.js`. The hosted draft workspace needs a D1 binding named `DB`, the SQL migrations in `migrations/`, and Sites sign-in for creator actions. The reviewer uses the invitation link and code.

## Diana deployment

- Network: QoreChain Diana testnet, EVM chain ID 9800
- Contract: `0x25721b3Be0F24438DA7DAEd4C800B073ef9BB802`
- [Deployment receipt](https://dashboard.qorechain.io/explorer/tx/0x0cee4b8ec137fa45d2b765ddf2eaff928cd7571a02a9369eb5bff0b7ad9bfbfd)
- [Contract source](contracts/TheRecord.sol)

Signer key registration and approvals use `@qorechain/qoresign` 0.2.0. The app also uses viem for EVM operations, cosmjs-types for native transaction encoding, and esbuild for bundling.

The hosted workflow has been tested with two distinct wallets operated by one tester. Independent co-signer testing is deferred.

## License

[MIT](LICENSE)
