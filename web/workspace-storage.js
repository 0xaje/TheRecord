const storageKey = 'the-record-workspace';
const keyPattern = /^[a-f0-9]{64}$/;
const unavailable = 'This browser cannot save your workspace recovery code. No new workspace was opened. Allow site storage or use another browser. File verification still works without it.';

// Accessing localStorage itself can throw, even before getItem is called.
export function readWorkspaceKey(storage = () => globalThis.localStorage) {
  try {
    const key = storage().getItem(storageKey);
    if (key === null) return { key: null, warning: '' };
    if (!keyPattern.test(key)) return { key: null, warning: 'The saved workspace code is invalid. Open Workspace recovery and enter your saved recovery code. File verification still works.' };
    return { key, warning: '' };
  } catch {
    return { key: null, warning: unavailable };
  }
}

export function saveWorkspaceKey(key, storage = () => globalThis.localStorage) {
  if (typeof key !== 'string' || !keyPattern.test(key)) throw new Error('Invalid workspace recovery code.');
  let target;
  let previous;
  let attempted = false;
  try {
    target = storage();
    previous = target.getItem(storageKey);
    attempted = true;
    target.setItem(storageKey, key);
    // Some embedded browsers silently ignore writes. Never proceed on that basis.
    if (target.getItem(storageKey) !== key) throw new Error('Storage did not retain the code.');
  } catch {
    // Best effort: a failed read-back must not replace an existing stored identity.
    if (attempted) {
      try {
        if (previous === null) target.removeItem(storageKey);
        else target.setItem(storageKey, previous);
      } catch { /* Storage is unavailable; keep the current in-memory identity. */ }
    }
    throw new Error(unavailable);
  }
  return key;
}
