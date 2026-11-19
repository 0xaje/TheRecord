import { deploymentArgument, proofDeployment } from './scoped-window-target.mjs';
import { generateMnemonic, deriveUnifiedAccount, derivePqcCanonical, openEvmWindowMsg, buildRegisterPqcKeyMsg, signProofOfPossession, EthNativeSigner, fetchPqcStatus, isRegisteredPqcKey } from '@qorechain/sdk';
import { readFileSync, writeFileSync, mkdirSync, lstatSync, existsSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { WINDOW_CHAIN, WINDOW_POLICY, verifyWindowReceipt, verifyWindowReadback } from '../web/scoped-window-data.js';
const REST = 'https://api-testnet.qore.host';
const EVM = 'https://evm-testnet.qore.host';
export const defaultSecret = join(homedir(), '.local/share/the-record-window-test/account.secret');
const KIND = 'the-record-disposable-window/v1';
const fees = { register: { amount: [{ denom: 'uqor', amount: '120000' }], gas: '600000' }, open: { amount: [{ denom: 'uqor', amount: '80000' }], gas: '400000' } };
const timedFetch = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) });

export function initAccount(filename = defaultSecret) {
  mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  writeFileSync(filename, JSON.stringify({ kind: KIND, chainId: WINDOW_CHAIN, createdAt: new Date().toISOString(), mnemonic: generateMnemonic(256) }) + '\n', { flag: 'wx', mode: 0o600 });
}
export async function loadAccount(filename = defaultSecret) {
  let saved;
  try {
    const info = lstatSync(filename);
    if (!info.isFile() || info.isSymbolicLink() || (info.mode & 0o077)) throw new Error();
    saved = JSON.parse(readFileSync(filename, 'utf8'));
  } catch { throw new Error('Cannot read the private disposable account file, or its permissions are not 0600. Never paste its contents in chat.'); }
  if (saved.kind !== KIND || saved.chainId !== WINDOW_CHAIN || typeof saved.mnemonic !== 'string') throw new Error('This is not a disposable account created by this tool.');
  let account;
  try { account = await deriveUnifiedAccount(saved.mnemonic); account.pqc = derivePqcCanonical(account.cosmos, saved.mnemonic); }
  catch { throw new Error('The local disposable account file is invalid. No transaction was sent.'); }
  return account;
}
export function publicPlan(account, deployment = proofDeployment()) {
  return { chainId: WINDOW_CHAIN, nativeAddress: account.cosmos, evmAddress: account.evm,
    deployment: deployment.id, onlyAllowedContract: deployment.address, blocks: WINDOW_POLICY.blocks, maxTransactions: WINDOW_POLICY.maxTxs,
    windowAllowanceUqor: WINDOW_POLICY.maxValue, fees, extraRegistrationChargePossible: 'The chain may charge its registration price in addition to the explicit transaction fee.',
    note: 'Testnet-only disposable account. Native registration/opening are separate paid transactions. This plan does not sign or broadcast. No agreement approval is performed.' };
}
export function registrationMessage(account) {
  return buildRegisterPqcKeyMsg(account.cosmos, { pqcKeypair: account.pqc,
    ecdsaPubkey: Uint8Array.from(Buffer.from(account.publicKey.slice(2), 'hex')), keyType: 'hybrid',
    proofOfPossession: signProofOfPossession({ chainId: WINDOW_CHAIN, account: account.cosmos, keypair: account.pqc }) });
}
async function json(path, missingOK = false) {
  const response = await timedFetch(REST + path);
  if (missingOK && response.status === 404) return null;
  if (!response.ok) throw new Error('Diana read failed: HTTP ' + response.status);
  return response.json();
}
async function checkNetwork() {
  const [node, evm] = await Promise.all([json('/cosmos/base/tendermint/v1beta1/node_info'), timedFetch(EVM, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }) }).then(r => r.json())]);
  if (node.default_node_info?.network !== WINDOW_CHAIN || evm.result !== '0x2648') throw new Error('Expected Diana native network and EVM chain 9800. Stopped.');
}
async function chainStatus(account) {
  await checkNetwork();
  const [balance, pqc, window] = await Promise.all([
    json('/cosmos/bank/v1beta1/balances/' + account.cosmos + '/by_denom?denom=uqor'),
    fetchPqcStatus({ rest: REST, address: account.cosmos, fetch: timedFetch }),
    json('/qorechain/pqc/v1/evm_window/' + account.cosmos),
  ]);
  return { balanceUqor: balance.balance?.amount ?? '0', pqcRegistered: pqc.registered,
    possessionProven: pqc.possessionProven === true, pqcKeyMatches: pqc.registered ? isRegisteredPqcKey(pqc, account.pqc.publicKey) : false, window };
}
const pendingPath = filename => join(dirname(filename), 'pending-transaction.json');
async function resolvePending(filename, account) {
  const path = pendingPath(filename);
  if (!existsSync(path)) return null;
  const pending = JSON.parse(readFileSync(path, 'utf8'));
  const data = await json('/cosmos/tx/v1beta1/txs/' + pending.hash, true);
  if (!data?.tx_response?.height) return { ...pending, committed: false, instruction: 'Outcome not confirmed. Do not broadcast again; retain this hash and check later.' };
  const r = data.tx_response;
  if (String(r.txhash).toUpperCase() !== pending.hash) throw new Error('Pending receipt hash mismatch.');
  const summary = { ...pending, committed: true, code: Number(r.code), height: String(r.height) };
  if (Number(r.code) === 0) {
    if (pending.kind === 'open') {
      summary.opening = verifyWindowReceipt(data, account.cosmos, pending.hash, proofDeployment(pending.deployment).address);
      summary.windowLive = verifyWindowReadback(await json('/qorechain/pqc/v1/evm_window/' + account.cosmos), summary.opening, proofDeployment(pending.deployment).address);
    } else if (data.tx?.body?.messages?.length !== 1 || data.tx.body.messages[0]['@type'] !== '/qorechain.pqc.v1.MsgRegisterPQCKeyV2' || data.tx.body.messages[0].sender !== account.cosmos) throw new Error('Registration receipt did not match the expected account.');
  }
  writeFileSync(join(dirname(filename), pending.kind + (pending.deployment && pending.deployment !== 'legacy' ? '-' + proofDeployment(pending.deployment).id : '') + '-receipt.json'), JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 });
  unlinkSync(path);
  return summary;
}
async function broadcast(kind, account, filename, args, deployment) {
  const at = args.indexOf('--confirm-address');
  if (!args.includes('--broadcast') || at < 0 || args[at + 1]?.toLowerCase() !== account.evm.toLowerCase()) throw new Error('No transaction sent. Review plan, then pass --broadcast --confirm-address with this disposable account’s EVM address.');
  if (existsSync(pendingPath(filename))) throw new Error('An earlier transaction is unresolved. Run status; do not submit another.');
  const state = await chainStatus(account);
  if (state.pqcRegistered && !state.pqcKeyMatches) throw new Error('Registered PQC key does not match this local account. Stopped without rotating or replacing anything.');
  if (kind === 'register' && state.pqcRegistered) {
    if (!state.possessionProven) throw new Error('Existing key lacks proof of possession. No repeated registration will be sent.');
    return { alreadyRegistered: true, possessionProven: true, transactionSent: false };
  }
  if (kind === 'open' && (!state.pqcRegistered || !state.possessionProven)) throw new Error('Register this disposable account’s key and verify proof of possession first.');
  if (BigInt(state.balanceUqor) < 1000000n) throw new Error('Fund this disposable test account with at least 1 test QOR before this step.');
  const raw = await json('/cosmos/auth/v1beta1/accounts/' + account.cosmos);
  const base = raw.account?.base_account ?? raw.account;
  if (base?.address !== account.cosmos || base.account_number == null || base.sequence == null) throw new Error('Could not read the funded account sequence.');
  const signer = new EthNativeSigner(account, { signMode: kind === 'register' ? 'classical' : 'hybrid', rest: REST, fetch: timedFetch });
  const signed = signer.sign({ chainId: WINDOW_CHAIN, accountNumber: BigInt(base.account_number), sequence: BigInt(base.sequence),
    messages: [kind === 'register' ? registrationMessage(account) : openEvmWindowMsg({ sender: account.cosmos, ...WINDOW_POLICY, allowedTargets: [deployment.address] })],
    fee: fees[kind], memo: 'The Record disposable scoped-window test',
    ...(kind === 'open' ? { signBytesVersion: await signer.resolveSignBytesVersion(WINDOW_CHAIN) } : {}),
  });
  const hash = createHash('sha256').update(signed.txRawBytes).digest('hex').toUpperCase();
  writeFileSync(pendingPath(filename), JSON.stringify({ kind, hash, deployment: deployment.id, sender: account.cosmos, createdAt: new Date().toISOString() }) + '\n', { flag: 'wx', mode: 0o600 });
  let data;
  try {
    const response = await timedFetch(REST + '/cosmos/tx/v1beta1/txs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tx_bytes: Buffer.from(signed.txRawBytes).toString('base64'), mode: 'BROADCAST_MODE_SYNC' }) });
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch { throw new Error('Broadcast outcome unknown. Run status before retrying. Pending hash: ' + hash); }
  if (String(data.tx_response?.txhash).toUpperCase() !== hash || data.tx_response?.code == null) throw new Error('Broadcast acceptance is unconfirmed. Run status; pending hash: ' + hash);
  if (Number(data.tx_response.code) !== 0) throw new Error('Diana refused broadcast. Keep the pending hash for diagnosis: ' + hash);
  return { hash, broadcastAccepted: true, committed: false, instruction: 'Run status to check the actual committed receipt before any next transaction.' };
}
export async function main(args = process.argv.slice(2), filename = defaultSecret) {
  const command = args[0];
  const deployment = deploymentArgument(args);
  if (!['init','plan','status','register','open'].includes(command)) throw new Error('Commands: init, plan, status, register, open. Writes require separate --broadcast --confirm-address flags.');
  if (command === 'init') initAccount(filename);
  const account = await loadAccount(filename);
  if (command === 'init' || command === 'plan') return { ...publicPlan(account, deployment), secretFile: filename, transactionSent: false, reminder: 'Keep account.secret private. Share only the public addresses, never this file.' };
  if (command === 'status') { await checkNetwork(); const pending = await resolvePending(filename, account); return { ...publicPlan(account, deployment), ...(await chainStatus(account)), pending, transactionSent: false }; }
  return broadcast(command, account, filename, args, deployment);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
