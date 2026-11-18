import { createPublicClient, http } from 'viem';
import { scanHistory, readHistoryVersions } from './history-data.js';
const form = document.querySelector('#history-form');
const status = document.querySelector('#history-status');
const list = document.querySelector('#history-results');
const more = document.querySelector('#history-more');
const next = document.querySelector('#history-next');
let run = 0;
let state;
let page = 0;
const params = new URLSearchParams(location.search);
form.elements.id.value = params.get('id') ?? '';

function node(tag, text, className) {
  const e = document.createElement(tag); if (text !== undefined) e.textContent = text;
  if (className) e.className = className; return e;
}
function receipt(label, event) {
  const a = node('a', label); a.href = 'https://dashboard.qorechain.io/explorer/tx/' + event.transactionHash;
  return a;
}
function render() {
  list.replaceChildren();
  for (const v of state.versions.slice(page * 10, page * 10 + 10)) {
    const card = node('article', undefined, 'surface history-version');
    card.append(node('h2', 'Version ' + v.version), node('p', v.finalized ? 'Finalized · 2 of 2 approvals' : 'Awaiting approval · ' + v.approvals.length + ' of 2 approvals'));
    card.append(node('p', 'SHA-256 fingerprint'), node('code', v.fingerprint));
    const timeline = node('ol');
    const proposal = node('li'); proposal.append(node('span', 'Proposed at block ' + v.proposal.blockNumber + ' · '), receipt('Proposal receipt', v.proposal)); timeline.append(proposal);
    for (const approval of v.approvals) {
      const item = node('li'); item.append(node('span', 'Approved by ' + approval.args.signer + ' at block ' + approval.blockNumber + ' · '), receipt('Approval receipt', approval)); timeline.append(item);
    }
    if (v.finalization) { const item = node('li'); item.append(node('span', 'Finalized at block ' + v.finalization.blockNumber + ' · '), receipt('Finalization receipt', v.finalization)); timeline.append(item); }
    card.append(timeline);
    const verify = node('a', 'Verify a file against version ' + v.version);
    verify.href = '/?' + new URLSearchParams({ id: state.id, version: String(v.version) }) + '#verify-title'; card.append(verify); list.append(card);
  }
  next.hidden = state.versions.length <= 10;
  next.textContent = page * 10 + 10 < state.versions.length ? 'Next 10 versions' : 'Back to newest versions';
}
next.addEventListener('click', () => { page = page * 10 + 10 < state.versions.length ? page + 1 : 0; render(); list.scrollIntoView({ behavior: 'instant' }); });
async function load(resume) {
  const generation = ++run;
  form.querySelector('button').disabled = true; more.hidden = true; next.hidden = true;
  const id = form.elements.id.value.trim().toLowerCase();
  try {
    if (!resume) { list.replaceChildren(); state = undefined; page = 0; }
    status.textContent = 'Reading Diana history. No wallet connection needed…';
    const client = createPublicClient({ transport: http('https://evm-testnet.qore.host', { timeout: 15000, retryCount: 0 }) });
    const snapshot = state?.snapshot ?? await client.getBlockNumber();
    const batch = await scanHistory(client, id, { snapshot, cursor: state?.cursor ?? snapshot, onProgress: ({ cursor }) => {
      if (generation === run) status.textContent = 'Checking older blocks… through ' + (cursor + 1n) + '. History is not complete yet.';
    } });
    if (generation !== run) return;
    state = { id, snapshot, cursor: batch.cursor, complete: batch.complete, events: [...(state?.events ?? []), ...batch.events] };
    if (!batch.complete) {
      status.textContent = 'Scan paused after 100,000 blocks. Select Continue to check older blocks. No complete result is available yet.';
      more.hidden = false; return;
    }
    state.versions = await readHistoryVersions(client, id, state.events, snapshot);
    if (generation !== run) return;
    status.textContent = state.versions.length ? state.versions.length + ' version(s) checked against Diana at block ' + snapshot + '. Refresh to include newer activity.' : 'No agreement found through Diana block ' + snapshot + '.';
    render();
  } catch (error) {
    if (generation !== run) return;
    list.replaceChildren(); state = undefined;
    status.textContent = 'Could not load complete history. No result is being claimed. ' + (error.shortMessage ?? error.message);
  } finally { if (generation === run) form.querySelector('button').disabled = false; }
}
form.addEventListener('submit', event => { event.preventDefault(); load(false); });
more.addEventListener('click', () => load(true));
form.elements.id.addEventListener('input', () => { run++; state = undefined; list.replaceChildren(); more.hidden = true; next.hidden = true; status.textContent = ''; form.querySelector('button').disabled = false; });
