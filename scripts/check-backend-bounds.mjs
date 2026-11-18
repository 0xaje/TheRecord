import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
if (!process.argv.includes('--live-limit-check')) throw new Error('Run with --live-limit-check to send at most 63 bounded requests against one dedicated random test workspace. No draft or transaction is created.');
const base = process.env.RECORD_TEST_ORIGIN ?? 'https://the-record-diana-verifier.flutteringpeach8.chatgpt.site';
const key = randomBytes(32).toString('hex');
const statuses = [];
let limited;
try {
  // Concurrent requests exercise the atomic counter without a slow sequential
  // client spreading the sample across many minute windows.
  for (let batch = 0; batch < 2 && !limited; batch++) {
    const results = await Promise.allSettled(Array.from({ length: 31 }, async () => {
      const response = await fetch(base + '/api/drafts', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', 'X-Record-Workspace': key }, body: JSON.stringify({ title: '', terms: 'Non-sensitive invalid limit check.' }), signal: AbortSignal.timeout(15000) });
      const result = { status: response.status, retryAfter: response.headers.get('Retry-After') };
      await response.text(); return result;
    }));
    for (const result of results) {
      if (result.status === 'rejected') throw result.reason;
      statuses.push(result.value.status);
      assert.ok([400, 429].includes(result.value.status));
      if (result.value.status === 429) limited = result.value;
    }
  }
  assert.ok(limited, 'No 429 observed within bounded sample.');
  assert.ok(Number(limited.retryAfter) > 0);
  const read = await fetch(base + '/api/drafts', { headers: { 'X-Record-Workspace': key }, signal: AbortSignal.timeout(15000) });
  assert.equal(read.status, 200); assert.deepEqual(await read.json(), []);
  console.log(JSON.stringify({ testedAt: new Date().toISOString(), origin: base, result: 'PASS', requests: statuses.length, limitResponses: statuses.filter(s => s === 429).length, retryAfter: limited.retryAfter, readsStillWork: true, note: 'Dedicated random workspace. No documents created, no wallet operation, no credentials retained.' }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ testedAt: new Date().toISOString(), origin: base, result: 'BLOCKED_OR_FAILED', completedRequests: statuses.length, errorType: error.name, note: 'Live enforcement not confirmed. No bypass or alternate network used. See terminal evidence for the network/test failure.' }, null, 2));
  process.exitCode = 1;
}
