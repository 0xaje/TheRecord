import { openEvmWindowMessage, toEvmAddress as qorToEvm } from '@qorechain/evm/window';
import { BinaryWriter } from 'cosmjs-types/binary';
export const WINDOW_CHAIN = 'qorechain-diana';
export const WINDOW_CONTRACT = '0x25721b3be0f24438da7daed4c800b073ef9bb802';
export const WINDOW_POLICY = Object.freeze({ blocks: 600, maxTxs: 5, maxValue: '1000000' });
export function scopedWindowMessage(sender) {
  qorToEvm(sender); // Official checksum/address validation, no key derivation.
  const message = openEvmWindowMessage({ sender, ...WINDOW_POLICY, allowedTargets: [WINDOW_CONTRACT] });
  const v = message.value;
  // MsgOpenEVMWindow fields 1,2,3,4,6; false nativeOnly/empty extra scopes omit defaults.
  // Round-trip and exact bytes are checked against the official SDK codec in tests.
  const writer = BinaryWriter.create();
  writer.uint32(10).string(v.sender).uint32(16).uint64(BigInt(v.blocks))
    .uint32(24).uint64(BigInt(v.maxTxs)).uint32(34).string(v.maxValue);
  for (const target of v.allowedTargets) writer.uint32(50).string(target);
  return { typeUrl: message.typeUrl, value: writer.finish() };
}
export { qorToEvm };
const targetsMatch = (values, target) => Array.isArray(values) && values.length === 1 && values[0].toLowerCase() === target.toLowerCase();
export function verifyWindowReceipt(data, sender, expectedHash, target = WINDOW_CONTRACT) {
  const receipt = data.tx_response;
  const messages = data.tx?.body?.messages;
  if (!receipt || String(receipt.txhash).toUpperCase() !== expectedHash.toUpperCase() || Number(receipt.code) !== 0 || !receipt.height) throw new Error('Diana did not return a successful matching receipt.');
  const m = messages?.[0];
  if (messages?.length !== 1 || m?.['@type'] !== '/qorechain.pqc.v1.MsgOpenEVMWindow'
    || m.sender !== sender || String(m.blocks) !== '600' || String(m.max_txs) !== '5'
    || String(m.max_value) !== '1000000' || m.native_only !== false || !targetsMatch(m.allowed_targets, target)
    || ['validators','staking_validators','ibc_receivers'].some(k => m[k]?.length)) throw new Error('The committed window does not match the reviewed restriction. Do not treat it as verified.');
  if (!data.tx.body.extension_options?.some(x => x['@type'] === '/qorechain.pqc.v1.PQCHybridSignature')) throw new Error('The committed transaction has no hybrid signature extension. Check it before proceeding.');
  return { txHash: receipt.txhash, height: String(receipt.height), sender, allowedTargets: m.allowed_targets,
    blocks: m.blocks, maxTxs: m.max_txs, maxValueUqor: m.max_value, hybridExtensionPresent: true };
}
export function verifyWindowReadback(status, opening, target = WINDOW_CONTRACT) {
  if (status.found !== true || String(status.opened_height) !== opening.height
    || BigInt(status.expiry_height) - BigInt(status.opened_height) !== 600n
    || String(status.max_txs) !== '5' || String(status.max_value) !== '1000000'
    || status.native_only !== false || !targetsMatch(status.allowed_targets, target)) throw new Error('The current window does not match this opening receipt.');
  return status.live === true && BigInt(status.remaining_blocks) > 0n && BigInt(status.remaining_txs) > 0n && BigInt(status.remaining_value) > 0n;
}
