import assert from 'node:assert/strict';
import { createPublicClient, http } from 'viem';
import { scanHistory, readHistoryVersions } from '../web/history-data.js';
const client = createPublicClient({ transport: http(process.env.DIANA_RPC_URL ?? 'https://evm-testnet.qore.host', { timeout: 20000, retryCount: 0 }) });
const id = '0x7579231974eb436db32c687b8d89cc0ddf39434156d7aa99131fb309a03c678e';
const snapshot = 10254760n;
const result = await scanHistory(client, id, { snapshot });
assert.equal(result.complete, true);
const versions = await readHistoryVersions(client, id, result.events, snapshot);
assert.deepEqual(versions.map(v => String(v.version)), ['2', '1']);
for (const v of versions) {
  assert.equal(v.finalized, true);
  assert.equal(v.approvals.length, 2);
  assert.equal(new Set(v.approvals.map(a => a.args.signer.toLowerCase())).size, 2);
}
assert.equal(versions[0].fingerprint, '0xec60c8c9aef0e0f8e8771a3fcb634936c6bbefd0f1ac7874f392295460a0a6fe');
assert.equal(versions[1].fingerprint, '0x91804a34261a4f7a6b5baf984a211b3aaeace3b8a2996af2dc72e657d490ca74');
// Latest proposal, before either approval: must remain pending.
const pending = await scanHistory(client, id, { snapshot: 10254141n });
const pendingVersions = await readHistoryVersions(client, id, pending.events, 10254141n);
assert.equal(pendingVersions[0].finalized, false);
assert.equal(pendingVersions[0].approvals.length, 0);
// A deliberately bounded scan must report incomplete, not "not found".
const partial = await scanHistory(client, id, { snapshot, maxChunks: 0 });
assert.equal(partial.complete, false);
await assert.rejects(() => scanHistory(client, 'bad-id', { snapshot }), /valid agreement ID/);
console.log(JSON.stringify({ testedAt: new Date().toISOString(), agreementId: id, snapshot: String(snapshot), complete: result.complete, events: result.events.length, checks: ['two finalized versions', 'two distinct approvers per version', 'expected fingerprints', 'pending amendment shows zero approvals', 'bounded incomplete scan', 'invalid ID rejection'], versions: versions.map(v => ({version: String(v.version), fingerprint: v.fingerprint, finalized: v.finalized, signers: v.approvals.map(a => a.args.signer), finalizationTransaction: v.finalization.transactionHash})) }, null, 2));
