import { test } from 'node:test';
import assert from 'node:assert/strict';
import { qorechainRegistry, openEvmWindowMsg } from '@qorechain/sdk';
import { scopedWindowMessage, WINDOW_CONTRACT, verifyWindowReceipt, verifyWindowReadback } from '../web/scoped-window-data.js';
const sender = 'qor1ap9phrpqk83nlswkm4r9pt6n0qljjy0dvatfll';
const hash = 'a'.repeat(64);
const message = { '@type': '/qorechain.pqc.v1.MsgOpenEVMWindow', sender, blocks: '600', max_txs: '5', max_value: '1000000', native_only: false, allowed_targets: [WINDOW_CONTRACT], validators: [], staking_validators: [], ibc_receivers: [] };
const receipt = () => ({ tx_response: { txhash: hash, code: 0, height: '100' }, tx: { body: { messages: [{ ...message }], extension_options: [{ '@type': '/qorechain.pqc.v1.PQCHybridSignature' }] } } });

test('scoped request bytes exactly match official SDK, with no key derivation or signing', () => {
  const actual = scopedWindowMessage(sender);
  const registry = qorechainRegistry();
  const expected = openEvmWindowMsg({ sender, blocks: 600, maxTxs: 5, maxValue: '1000000', allowedTargets: [WINDOW_CONTRACT] });
  assert.deepEqual(actual.value, registry.encode(expected));
  const decoded = registry.decode(actual);
  assert.equal(decoded.sender, sender); assert.equal(decoded.blocks, '600');
  assert.deepEqual(decoded.allowedTargets, [WINDOW_CONTRACT]);
  assert.equal(decoded.nativeOnly, false); assert.deepEqual(decoded.validators, []);
  assert.throws(() => scopedWindowMessage('invalid'));
});
test('receipt validation refuses unscoped, failed, mismatched and non-hybrid fixtures', () => {
  assert.equal(verifyWindowReceipt(receipt(), sender, hash).height, '100');
  for (const alter of [d => d.tx.body.messages[0].allowed_targets = [], d => d.tx.body.messages[0].sender = 'other', d => d.tx.body.messages[0].max_value = '999999', d => d.tx.body.messages[0].validators = [WINDOW_CONTRACT], d => d.tx_response.code = 1, d => d.tx_response.txhash = 'b'.repeat(64), d => d.tx.body.extension_options = []]) {
    const d = receipt(); alter(d); assert.throws(() => verifyWindowReceipt(d, sender, hash));
  }
});
test('read-back distinguishes live restriction from expired or replaced window fixtures', () => {
  const proof = verifyWindowReceipt(receipt(), sender, hash);
  const state = { found: true, live: true, opened_height: '100', expiry_height: '700', max_txs: '5', max_value: '1000000', native_only: false, allowed_targets: [WINDOW_CONTRACT], remaining_blocks: '500', remaining_txs: '5', remaining_value: '1000000' };
  assert.equal(verifyWindowReadback(state, proof), true);
  assert.equal(verifyWindowReadback({ ...state, live: false, remaining_blocks: '0' }, proof), false);
  assert.throws(() => verifyWindowReadback({ ...state, allowed_targets: [] }, proof));
  assert.throws(() => verifyWindowReadback({ ...state, opened_height: '101' }, proof));
});
