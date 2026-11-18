import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const hash = 'B1D0858D43C9B5DA7C40D1B085DB7F7D11427E95B3B52F5BDA3C41002C632BC4';
const endpoint = 'https://api-testnet.qore.host/cosmos/tx/v1beta1/txs/' + hash;
const response = await fetch(endpoint, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error('Opening receipt lookup failed: HTTP ' + response.status);
const data = await response.json();
if (Number(data.tx_response?.code) !== 0 || !data.tx_response?.height) throw new Error('Successful receipt missing');
const message = data.tx?.body?.messages?.find(x => x['@type'] === '/qorechain.pqc.v1.MsgOpenEVMWindow');
if (!message || !Array.isArray(message.allowed_targets)) throw new Error('Window scope could not be decoded');
const expected = '0x25721b3be0f24438da7daed4c800b073ef9bb802';
const targets = message.allowed_targets.map(x => x.toLowerCase());
const reports = ['2026-11-16-stage-1.pdf', '2026-11-16-stage-2.pdf'].map(name => ({ name,
  sha256: createHash('sha256').update(readFileSync('docs/audit/' + name)).digest('hex') }));
const evidence = { checkedAt: new Date().toISOString(), openingReceipt: { hash, endpoint,
  height: data.tx_response.height, code: data.tx_response.code, sender: message.sender,
  blocks: message.blocks, maxTxs: message.max_txs, maxValueUqor: message.max_value,
  nativeOnly: message.native_only, allowedTargets: message.allowed_targets,
  hybridExtensionPresent: data.tx.body.extension_options?.some(x => x['@type'] === '/qorechain.pqc.v1.PQCHybridSignature') ?? false },
  expectedContract: expected, contractRestricted: targets.length > 0 && targets.every(t => t === expected),
  conclusion: targets.length ? 'Inspect target restriction and paired permitted/rejected calls before claiming scope compliance.' : 'This historical window was unscoped. It does not close the contract-restricted-window evidence gate.',
  availableAuditReports: reports, stage2Accepted: null,
  limits: 'A hybrid extension is present; this script does not independently verify its cryptography. PDF hashes do not establish payment or organizer acceptance. No new transaction submitted.' };
writeFileSync('docs/compliance/window-audit-check.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
