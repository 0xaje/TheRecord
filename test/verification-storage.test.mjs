import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';

// Isolated module-startup harness, not browser acceptance or chain workflow proof.
// No wallet and no simulated chain responses. Any network request is rejected.
function element() {
  const children = new Map();
  const node = {
    value: '', hidden: true, dataset: {}, children: [], listeners: new Map(),
    addEventListener(name, handler) { this.listeners.set(name, handler); },
    querySelector(selector) { if (!children.has(selector)) children.set(selector, element()); return children.get(selector); },
    querySelectorAll() { return []; },
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = items; },
    setAttribute() {}, removeAttribute() {}, hasAttribute() { return false; },
    toggleAttribute() { return false; }, closest() { return this; }, scrollIntoView() {},
  };
  node.elements = new Proxy({}, { get: (_, name) => node.querySelector('field:' + String(name)) });
  return node;
}

test('built verifier initializes its controls when storage access throws', async () => {
  const document = element();
  document.createElement = () => element();
  document.getElementById = () => null;
  const window = { matchMedia: () => ({ addEventListener() {} }), scrollTo() {}, addEventListener() {} };
  let writes = 0;
  const context = {
    document, window, location: { pathname: '/', search: '?version=1', hash: '#verify-title', origin: 'https://record.test' },
    URL, URLSearchParams, TextEncoder, TextDecoder, Uint8Array, AbortSignal, Blob, crypto: webcrypto,
    console, setTimeout, clearTimeout,
    fetch: async (_, options) => { if (options?.method === 'POST') writes++; throw new Error('No network in isolated startup test'); },
    IntersectionObserver: class { observe() {} }, Option: class {},
  };
  Object.defineProperty(context, 'localStorage', { get() { throw new Error('Storage blocked'); } });
  runInNewContext(readFileSync(process.env.RECORD_VERIFIER_BUNDLE || new URL('../dist/verify.js', import.meta.url), 'utf8'), context, { timeout: 5000 });
  const form = document.querySelector('#verify');
  assert.equal(typeof form.listeners.get('submit'), 'function');
  assert.equal(typeof form.listeners.get('input'), 'function');
  const result = document.querySelector('#verification-result');
  result.hidden = false;
  form.listeners.get('input')();
  assert.equal(result.hidden, true);
  assert.match(document.querySelector('#workspace-storage-status').textContent, /File verification still works/);
  await new Promise(resolve => setImmediate(resolve));
  const draft = document.querySelector('#draft');
  draft.elements.title.value = 'Non-sensitive startup test';
  draft.elements.terms.value = 'No server write expected';
  draft.listeners.get('submit')({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes, 0);
  assert.match(draft.querySelector('output').textContent, /cannot save your workspace recovery code/);
});
