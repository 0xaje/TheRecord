# Pending amendment withdrawal — candidate, not yet deployed

Original contract/source remain unchanged. No existing agreement is moved or rewritten. The new source is contracts/TheRecordV2.sol. Legacy links without a deployment parameter remain pinned to 0x25721b3be0f24438da7daed4c800b073ef9bb802. No placeholder V2 address is registered. The new UI remains inactive until a genuine deployment is verified and added to web/deployments.js.

## Agreed rules

Only the original proposer can withdraw an amendment that is still the latest pending version. Version1 cannot be withdrawn. A finalized version cannot be withdrawn. Version numbers never rewind or get reused. Withdrawn fingerprints and existing approval bits remain available as historical facts, with a Withdrawn event; those approvals never count toward another version. Corrections start at zero and require both designated signers to approve afresh. A correction cannot duplicate the most recent finalized file.

Withdrawal needs both the original proposer's transaction sender and an ML-DSA-87 signature from their registered possession-proven key. Its domain differs from approval; it binds chain, contract, ID, explicit version, fingerprint and proposer. This guards against approval-signature reuse, classical-key-only withdrawal and delayed requests targeting a later proposal. If the proposer has lost the PQ key, this feature does not bypass recovery or create a new administrator.

The contract accepts the first valid transaction in chain order: if final approval executes first, withdrawal reverts; if withdrawal executes first, approval reverts. It does not promise to reverse a finalized update. Existing pending records on the ORIGINAL contract cannot acquire this feature retroactively.

## Verification and honest limits

Foundry1.5.1/Solidity0.8.28:23/23 passed (17new state-rule tests plus original6, including historical Diana fork). New tests explicitly seed lifecycle storage to isolate guards/state transitions; they do not mock PQ precompiles or establish successful on-chain V2 withdrawal. 36 JavaScript checks pass, including tests for legacy routing, withdrawn verification, historical receipt consistency and offline deployment plan. Their reader fixtures are not Diana evidence.

Pinned compiler output in deploy/withdrawal-v2-artifact.json includes ABI, creation/runtime bytes and source SHA256. Rebuild with `forge build` followed by `node scripts/build-withdrawal-artifact.mjs`. The owner deployment script checks source binding, network, registered matching possession-proven disposable key, confirmed opening and final runtime byte equality. It journals hashes before broadcast and refuses repeat runs with an existing journal. No wallet secret is printed/stored in deployment evidence.

GitHub Actions adds local Solidity tests separately from npm checks. Historical network-dependent fork testing is deliberately separate from CI's local job. A workflow definition is not itself a passing hosted run; inspect the actual run.

## Owner's next checkpoint: offline plan only

Use the Ubuntu checkout that already contains access to the disposable account created by scoped-window-cli. Never paste account.secret, a phrase or private key.

```sh
cd ~/TheRecord-window-test
git fetch origin
git switch withdrawal-amendments
git pull --ff-only origin withdrawal-amendments
npm ci --include=dev
node scripts/withdrawal-deploy.mjs plan
```

Expected public account from the earlier test: 0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f. Stop if a different account appears; share public plan for diagnosis, not secret contents. This plan sends nothing and needs no Foundry installation because the source-bound compiled artifact is included.

## Deployment step after checking the public plan

```sh
node scripts/withdrawal-deploy.mjs run --broadcast --confirm-address 0x4B1666D805A7879Aa8599DDD58606c0FCc303A1f
```

This is a paid TESTNET operation using only the disposable account. It replaces that account's previous EVM window with a60-block, ONE-transaction,1QOR maximum allowance window without targets, required for contract creation. Native opening fee0.08QOR is separate; maximum deployment fee1QOR; minimum starting balance2testQOR. The sole admitted EVM transaction creates the new contract; no agreement is approved or changed. Never use the regular wallet or mainnet money.

If interrupted/unknown, do not rerun or delete journals:

```sh
node scripts/withdrawal-deploy.mjs status
```

The evidence file is next to the disposable account file, named withdrawal-deployment.json. It contains public addresses/hashes only. A successful status must show committed deployment, actual address/block and runtimeMatches true. Do not interpret broadcast acceptance as deployment confirmation. Window creation and runtime checks have not yet been exercised on Diana by this candidate.

## Activation and real acceptance still required

After checking the actual deployment and runtime, add that exact address/block to the allowlisted registry with withdrawals true and ID withdrawal-v2. Generate all new links with deployment=withdrawal-v2, including create/history/verify/amend. Legacy links keep their original contract. The advanced scoped SDK helper still targets the legacy contract: a scoped test/window for V2 must explicitly use the new verified address; never silently treat the old scoped proof as proof for V2.

Publish the matching frontend only after build/regression checks and visual acceptance. Test on Diana using a NEW non-sensitive agreement:

1. Two distinct signer accounts finalize version1; retain receipts/file.
2. Propose version2, record one approval, withdraw from the original proposer using QoreX. Keep the withdrawal receipt.
3. Confirm version2 is withdrawn, cannot be approved, and its old signature cannot approve a correction.
4. Propose corrected version3; it starts0/2. Both signers approve it freshly; retain receipts.
5. Reverify original file against finalized version1 and corrected file against finalized version3; changed file against wrong version fails.
6. History displays version1, withdrawn version2 and finalized version3 with genuine receipts. Test withdrawal refusal by outsider/afterfinalization and stale version.

This remains an OPEN milestone until those results, phone acceptance and audit review of the new exact source are captured. Prior reports bind the old source, not this new contract. Existing ShipWeeks owner-confirmed4complete/freshportalCheck-unobserved remains unchanged; no Q-Day entry or new award claimed. The official Post-Quantum dApp requirement includes scoped EVM window,pqcVerify,two-stageQCAI audit,Foundry/Hardhat tests; do not claim new-source audit completion before it exists. No automatic audit payment.

Judge review: implementation is concrete and state-rule tests pass; live PQ withdrawal, website activation and new-source audit acceptance remain unverified. Do not call this feature live yet.

My space draft — READY, NOT POSTED: I implemented a separately versioned pending-amendment withdrawal design that preserves existing Diana records, requires the proposer's post-quantum signature and fresh approvals for corrections. Local contract/interface checks pass. Deployment and real Diana withdrawal/correction evidence are next; this is not yet a live-feature claim.

## Deployment checkpoint — 18 November 2026

Owner deployed V2 at **0xf2dba66fcb0e4e1aa619a2cea981935f5b38fd0f**, block10339744, receipt0xf6b25c6c56ff940c854596c3a9284606d34f1c092379ac5ec09df90fd30d22ce. Native opening9BBFC64EC9D6C500A97B355FA41D49F47191D1CDD38286F434AEB64FBF16A9F8 committed block10339741. The owner reports the one-transaction window is exhausted after creation. Independent script scripts/check-withdrawal-deployment.mjs verified chain9800, successful receipt, deployer/nonce/address, exact creation input, runtime equality and opening limits. Public evidence: deployment-verified.json.

This supersedes the earlier deployment-pending status above; it does NOT close actual withdrawal/correction acceptance. The verified V2 entry is now allowlisted only for explicit `deployment=withdrawal-v2` links. Legacy default remains unchanged. 37 JavaScript checks pass. No approval/withdrawal transaction has been submitted by the agent. Source branch remains a draft while live lifecycle and new-source audit acceptance are pending.

Next owner checkpoint after website publication: open the V2 Record link in QoreX with wallet0xe84A1B8C20b1E33Fc1D6dD4650Af53783F2911eD selected on Diana. Create one NEW non-sensitive agreement with that first signer and second signer0xebfd0C31BC2Ac2529c5C51aE7Bc2c3337F79B44A. This makes the first wallet the original proposer for later withdrawal. Use the unchanged original public sample file. Do not reuse an existing agreement ID. Save its creation receipt and newly generated V2 verification link; bring those public results before the approval step. The wallet may need a fresh EVM window; the disposable deployer's exhausted window does not authorize either signer account.

My space draft — NOT POSTED: The withdrawal-enabled contract is deployed on Diana and its runtime matches the source-bound build. Existing records remain on their original contract. Actual withdrawal and two-signer correction acceptance are next; deployment is not a claim that the full new workflow has passed.
