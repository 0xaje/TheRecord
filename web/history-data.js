import { decodeEventLog, parseAbi } from 'viem';

export const RECORD_CONTRACT = '0x25721b3be0f24438da7daed4c800b073ef9bb802';
export const DEPLOYMENT_BLOCK = 10092612n;
export const historyAbi = parseAbi([
  'event Proposed(bytes32 indexed id,uint256 indexed version,bytes32 fingerprint)',
  'event Approved(bytes32 indexed id,uint256 indexed version,address indexed signer)',
  'event Finalized(bytes32 indexed id,uint256 indexed version,bytes32 fingerprint)',
  'function getVersion(bytes32,uint256) view returns (bytes32,uint8,bool)',
]);

// Scan bounded ranges backwards; finding version 1 establishes the beginning.
// The caller retains one snapshot and can resume without mixing chain heights.
export async function scanHistory(client, id, { snapshot, cursor = snapshot, maxChunks = 10, onProgress = () => {} } = {}) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(id)) throw new Error('Enter a valid agreement ID.');
  if (await client.getChainId() !== 9800) throw new Error('Expected Diana Testnet.');
  const events = [];
  let complete = false;
  for (let n = 0; n < maxChunks && cursor >= DEPLOYMENT_BLOCK; n++) {
    const from = cursor - 9999n < DEPLOYMENT_BLOCK ? DEPLOYMENT_BLOCK : cursor - 9999n;
    const logs = await client.request({ method: 'eth_getLogs', params: [{
      address: RECORD_CONTRACT, fromBlock: '0x' + from.toString(16), toBlock: '0x' + cursor.toString(16),
      topics: [null, id.toLowerCase()],
    }] });
    for (const log of logs) {
      if (log.removed || log.address.toLowerCase() !== RECORD_CONTRACT) continue;
      const decoded = decodeEventLog({ abi: historyAbi, data: log.data, topics: log.topics, strict: true });
      if (decoded.args.id.toLowerCase() !== id.toLowerCase()) throw new Error('Unexpected agreement in history.');
      events.push({ ...decoded, blockNumber: BigInt(log.blockNumber), logIndex: Number(BigInt(log.logIndex)), transactionHash: log.transactionHash });
    }
    cursor = from - 1n;
    complete = events.some(e => e.eventName === 'Proposed' && e.args.version === 1n) || cursor < DEPLOYMENT_BLOCK;
    onProgress({ cursor, complete, events: [...events] });
    if (complete) break;
  }
  return { snapshot, cursor, complete, events };
}

export async function readHistoryVersions(client, id, events, snapshot) {
  events = [...events].sort((a, b) => a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : a.logIndex - b.logIndex);
  const proposed = events.filter(e => e.eventName === 'Proposed');
  const versions = [];
  for (const event of proposed) {
    const version = event.args.version;
    const [fingerprint, mask, finalized] = await client.readContract({
      address: RECORD_CONTRACT, abi: historyAbi, functionName: 'getVersion', args: [id, version], blockNumber: snapshot,
    });
    if (fingerprint.toLowerCase() !== event.args.fingerprint.toLowerCase() || mask > 3 || finalized !== (mask === 3)) {
      throw new Error('History does not match Diana state. Refresh and try again.');
    }
    const approvals = events.filter(e => e.eventName === 'Approved' && e.args.version === version);
    const signers = new Set(approvals.map(e => e.args.signer.toLowerCase()));
    if (signers.size !== approvals.length || approvals.length !== (mask === 3 ? 2 : mask === 0 ? 0 : 1)) {
      throw new Error('Approval history is incomplete. Refresh and try again.');
    }
    const finalization = events.find(e => e.eventName === 'Finalized' && e.args.version === version);
    if (finalized !== Boolean(finalization) || (finalization && finalization.args.fingerprint !== fingerprint)) {
      throw new Error('Finalization history is incomplete. Refresh and try again.');
    }
    versions.push({ version, fingerprint, finalized, approvals, proposal: event, finalization });
  }
  versions.sort((a, b) => a.version > b.version ? -1 : 1);
  for (let i = 0; i < versions.length; i++) {
    if (versions[i].version !== BigInt(versions.length - i)) throw new Error('Version history has gaps. Refresh and try again.');
  }
  const [nextFingerprint] = await client.readContract({ address: RECORD_CONTRACT, abi: historyAbi,
    functionName: 'getVersion', args: [id, BigInt(versions.length + 1)], blockNumber: snapshot });
  if (nextFingerprint !== '0x' + '0'.repeat(64)) throw new Error('Version history is incomplete. Refresh and try again.');
  return versions;
}
