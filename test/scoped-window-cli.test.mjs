import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, statSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { qorechainRegistry, verifyProofOfPossession, EthNativeSigner } from '@qorechain/sdk';
import { initAccount, loadAccount, publicPlan, registrationMessage, main } from '../scripts/scoped-window-cli.mjs';

test('disposable CLI creates a private file without printing secrets or replacing an account', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'record-cli-')); const file = join(folder, 'account.secret');
  try {
    initAccount(file); assert.equal(statSync(file).mode & 0o777, 0o600);
    const account = await loadAccount(file);
    const plan = publicPlan(account); const text = JSON.stringify(plan);
    assert.ok(plan.nativeAddress.startsWith('qor1')); assert.match(plan.evmAddress, /^0x[0-9a-fA-F]{40}$/);
    assert.ok(!text.includes(account.mnemonic)); assert.ok(!text.includes(account.privateKey));
    assert.ok(!text.includes(Buffer.from(account.pqc.secretKey).toString('hex')));
    const before = readFileSync(file); assert.throws(() => initAccount(file)); assert.deepEqual(readFileSync(file), before);
    await assert.rejects(main(['open'], file), /No transaction sent/);
    await assert.rejects(main(['register', '--broadcast', '--confirm-address', 'wrong'], file), /No transaction sent/);
    chmodSync(file, 0o644); await assert.rejects(loadAccount(file), /permissions/);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
test('registration includes a valid address-bound possession proof and signs offline only', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'record-cli-pop-')); const file = join(folder, 'account.secret');
  try {
    initAccount(file); const account = await loadAccount(file);
    const message = registrationMessage(account); const registry = qorechainRegistry();
    const decoded = registry.decode({ typeUrl: message.typeUrl, value: registry.encode(message) });
    assert.equal(decoded.sender, account.cosmos); assert.equal(decoded.algorithmId, 1);
    assert.equal(verifyProofOfPossession({ chainId: 'qorechain-diana', account: account.cosmos, publicKey: account.pqc.publicKey, proof: decoded.proofOfPossession }), true);
    const tx = new EthNativeSigner(account, { signMode: 'classical' }).sign({ chainId: 'qorechain-diana', accountNumber: 0n, sequence: 0n, messages: [message], fee: { amount: [{ denom: 'uqor', amount: '120000' }], gas: '600000' } });
    assert.ok(tx.txRawBytes.length > 7000);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
