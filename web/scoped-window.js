import { createPublicClient, http } from 'viem';
import { checkSignerReadiness } from './approve.js';
import { WINDOW_CHAIN, WINDOW_CONTRACT, WINDOW_POLICY, scopedWindowMessage, qorToEvm, verifyWindowReceipt, verifyWindowReadback } from './scoped-window-data.js';
const panel = document.querySelector('#scoped-window');
const status = document.querySelector('#window-status');
const preview = document.querySelector('#window-preview');
const open = document.querySelector('#window-open');
const check = document.querySelector('#window-check');
const consent = document.querySelector('#window-consent');
const link = document.querySelector('#window-receipt');
const download = document.querySelector('#window-evidence');
const client = createPublicClient({ transport: http('https://evm-testnet.qore.host', { timeout: 15000 }) });
let account;
let submitted;
let busy = false;
async function read(path) {
  const r = await fetch('/api/diana' + path, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('Diana receipt/read-back unavailable. Check the saved transaction before retrying.');
  return r.json();
}
async function connected() {
  const native = window.qorex?.native;
  const evm = window.qorex?.evm ?? window.ethereum;
  if (!native?.capabilities?.includes('signAndBroadcast') || typeof native.signAndBroadcast !== 'function' || !evm?.request) throw new Error('Open this page inside QoreX Browse with native signAndBroadcast support.');
  await native.enable(WINDOW_CHAIN);
  const key = await native.getKey(WINDOW_CHAIN);
  const [addresses, chain, network] = await Promise.all([
    evm.request({ method: 'eth_requestAccounts' }), evm.request({ method: 'eth_chainId' }),
    read('/cosmos/base/tendermint/v1beta1/node_info'),
  ]);
  const sender = key.bech32Address;
  const address = qorToEvm(sender).toLowerCase();
  if (BigInt(chain) !== 9800n || network.default_node_info?.network !== WINDOW_CHAIN || await client.getChainId() !== 9800) throw new Error('Select Diana Testnet in QoreX.');
  if (addresses?.[0]?.toLowerCase() !== address) throw new Error('QoreX native and EVM accounts differ. Select the same test account on both lanes.');
  await checkSignerReadiness(client, address);
  return { native, sender, address };
}
async function run(action) {
  if (busy) return;
  busy = true;
  const buttons = [...panel.querySelectorAll('button')]; buttons.forEach(b => { b.disabled = true; });
  try { await action(); }
  catch (error) { status.textContent = error.shortMessage ?? error.message; }
  finally { busy = false; buttons.forEach(b => { b.disabled = false; }); open.disabled = !account || !!submitted; check.hidden = !submitted; }
}
async function verify() {
  if (!submitted) throw new Error('No opening transaction to check yet.');
  const proof = verifyWindowReceipt(await read('/cosmos/tx/v1beta1/txs/' + submitted.hash), submitted.sender, submitted.hash);
  const state = await read('/qorechain/pqc/v1/evm_window/' + submitted.sender);
  const live = verifyWindowReadback(state, proof);
  if (download.hasAttribute('href')) URL.revokeObjectURL(download.href);
  download.href = URL.createObjectURL(new Blob([JSON.stringify({ checkedAt: new Date().toISOString(), opening: proof, readback: state }, null, 2)], { type: 'application/json' }));
  download.download = 'the-record-scoped-window-evidence.json'; download.hidden = false;
  status.textContent = live ? 'Diana receipt and read-back match: access is restricted to The Record. Download the evidence. A permitted call and outside-scope rejection still need testing.' : 'The restricted opening is verified, but its window is no longer live. Keep this receipt; a new opening is needed before a permitted-call test.';
}
document.querySelector('#window-connect').addEventListener('click', () => run(async () => {
  if (submitted) { status.textContent = 'Check the submitted transaction before starting another request. Reload only after reviewing its result.'; return; }
  status.textContent = 'Checking Diana account and registered signing key…';
  account = null; account = await connected(); consent.checked = false;
  preview.textContent = 'Native account: ' + account.sender + '\nEVM account: ' + account.address + '\nOnly allowed contract: ' + WINDOW_CONTRACT + '\n600 blocks · 5 transactions · 1 QOR total allowance (value plus maximum EVM fees).\nOpening also pays a separate native transaction fee shown by QoreX. This replaces the account’s previous window. Contract functions are not individually restricted.';
  preview.hidden = false; status.textContent = 'Account checked. Review the restriction and confirm below. No window transaction has been requested.';
}));
open.addEventListener('click', () => run(async () => {
  if (!account || !consent.checked) throw new Error('Inspect the account and tick the review box first.');
  const current = await connected();
  if (current.sender !== account.sender) { account = null; throw new Error('Account changed. Inspect it again before signing.'); }
  const message = scopedWindowMessage(current.sender);
  status.textContent = 'Review the exact contract and limits in QoreX. If the wallet cannot display the restriction, reject the request.';
  // Never automatically repeat a wallet request after an unknown broadcast outcome.
  submitted = { sender: current.sender, hash: null };
  let result;
  try { result = await current.native.signAndBroadcast({ chainId: WINDOW_CHAIN, messages: [message], memo: 'The Record restricted EVM window', gasLimit: 400000 }); }
  catch (error) { throw new Error((error.message ?? 'Wallet request failed.') + ' Check QoreX activity before retrying; this page will not automatically submit again.'); }
  if (!/^[a-fA-F0-9]{64}$/.test(result?.txHash ?? '')) throw new Error('Wallet returned no recognized transaction hash. Check QoreX activity before another request.');
  submitted.hash = result.txHash.toUpperCase(); link.href = 'https://dashboard.qorechain.io/explorer/tx/' + submitted.hash; link.hidden = false;
  if (Number(result.code) !== 0) throw new Error('Wallet reports a failed transaction. Review its receipt.');
  status.textContent = 'Submitted ' + submitted.hash + '. Checking the committed receipt and scope…';
  await verify();
}));
check.addEventListener('click', () => run(async () => {
  if (!submitted?.hash) throw new Error('No hash returned. Find the opening transaction in QoreX activity before retrying.');
  await verify();
}));
