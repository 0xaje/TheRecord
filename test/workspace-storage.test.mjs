import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readWorkspaceKey, saveWorkspaceKey } from '../web/workspace-storage.js';
const key = 'a'.repeat(64);
const previous = 'b'.repeat(64);
const denied = () => { throw new Error('SecurityError'); };

test('blocked storage access and reads do not throw during module setup', () => {
  assert.equal(readWorkspaceKey(denied).key, null);
  assert.match(readWorkspaceKey(denied).warning, /File verification still works/);
  assert.equal(readWorkspaceKey(() => ({ getItem: denied })).key, null);
});
test('empty, invalid and valid persisted workspace codes are distinguished', () => {
  assert.deepEqual(readWorkspaceKey(() => ({ getItem: () => null })), { key: null, warning: '' });
  assert.equal(readWorkspaceKey(() => ({ getItem: () => 'damaged' })).key, null);
  assert.match(readWorkspaceKey(() => ({ getItem: () => 'damaged' })).warning, /invalid/);
  assert.deepEqual(readWorkspaceKey(() => ({ getItem: () => key })), { key, warning: '' });
});
test('denied and silently dropped writes cannot replace an in-memory identity', () => {
  let active = previous;
  for (const storage of [denied, () => ({ setItem: denied }), () => ({ setItem() {}, getItem: () => null })]) {
    assert.throws(() => { active = saveWorkspaceKey(key, storage); }, /cannot save/);
    assert.equal(active, previous);
  }
});
test('successful persistence reads back the exact recovery code before returning', () => {
  const data = new Map();
  const storage = () => ({ setItem: (name, value) => data.set(name, value), getItem: name => data.get(name) ?? null });
  assert.equal(saveWorkspaceKey(key, storage), key);
  assert.equal(readWorkspaceKey(storage).key, key);
  assert.throws(() => saveWorkspaceKey('invalid', storage), /Invalid/);
  assert.equal(readWorkspaceKey(storage).key, key);
});


test('failed read-back attempts to restore the previously saved identity', () => {
  let stored = previous;
  let reads = 0;
  const storage = () => ({
    getItem() { if (++reads === 2) throw new Error('Read denied after write'); return stored; },
    setItem(_, value) { stored = value; }, removeItem() { stored = null; },
  });
  assert.throws(() => saveWorkspaceKey(key, storage), /cannot save/);
  assert.equal(stored, previous);
});
