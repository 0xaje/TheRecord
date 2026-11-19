# A11 registration relay abuse protection

19 November 2026. Implemented and deployed as Site59, hosting source d6b21e08644460ff8343ca48dc917a73de90b4e7, environment revision9. Public audience preserved. Only this checkpoint is addressed; no contract, signature, paid service, wallet transaction or existing private agreement was changed.

## Acceptance and behavior

All allowlisted Diana relay reads and registration broadcasts require a short-lived browser credential backed by server-verified Turnstile proof. The existing widget/provider configuration is reused. No ChatGPT sign-in or assumed trusted IP header is introduced. The browser uses a random 256-bit credential in Authorization; only its SHA256 binding and the proof hash reach the relay-session table. The credential remains in browser memory and expires after15minutes. The challenge binds hostname, dedicated diana-relay action, credential fingerprint and a five-minute proof age. A unique proof hash rejects concurrent token replay even before provider reuse detection converges. The action cannot reuse a new-workspace challenge.

| Boundary | Enforced allowance |
| --- | --- |
| Verified browser session reads | 120/minute |
| Verified browser session registration attempts | 3/minute and12/session |
| Service relay reads | 600/minute |
| Service registration attempts | 30/minute |
| Service provider validations | 30/minute |
| Retained relay-session rows | 4096; expiry cleanup bounded to100rows per admission |

Minute budgets use fixed timestamp windows and atomic SQLite statements. Concurrent requests cannot exceed a session's allowance. Invalid broadcasts consume their session attempt budget before body parsing; the existing type/origin/envelope/size/deadline checks still apply. Requests refused by access/quota checks never reach Diana and explicitly report broadcastSubmitted:false. Requests already forwarded retain uncertain-outcome receipt guidance. No automatic broadcast retry is introduced. Reaching the broadcast limit does not consume the separate read budget needed to inspect receipts.

The service and session limits are different controls. A challenge-backed session is a verified capability, not a permanent person/wallet identity or an IP. A person or automated client able to obtain multiple valid proofs can obtain multiple sessions; the shared ceiling still bounds upstream work. Public policy/malformed requests still consume hosting resources. This is application abuse containment, not provider-level volumetric DDoS protection or guaranteed fairness under every attack. An attacker exhausting a shared ceiling can temporarily deny service. Provider monitoring/alerts remain a separate gate.

## Data and deployment

Migration0012 is additive/schema-only and preserves all earlier SQL/journal entries. Session storage contains no IPs, raw challenge tokens, signing files, mnemonic phrases or draft text. The operator inventory now includes the bounded relay-session row count; the64MiB retained-text budget still excludes physical database storage/metadata. Existing records/counters are never reset. Runtime secret values and audience are unchanged. Expired rows may remain until bounded cleanup; no immediate physical erasure guarantee is made.

The browser completes access before reading a private signing file. Concurrent requests share one pending challenge/session issuance. The new **Check browser access** button in advanced signer setup only reads node_info and requires neither a signing file nor a wallet operation. Scoped-window account/receipt reads also use this access path. Ordinary EVM file verification does not use this REST relay.

## Verification

- **88 build/Node checks pass**, [raw output](check.txt). Tests cover missing/expired credentials, forged source headers, host/action/binding/age mismatch, provider errors, replay, parallel requests, session/service ceilings, session capacity/expiry cleanup, migration compatibility and shared browser challenge/no automatic rebroadcast. Provider/DOM/envelope fixtures are explicitly local; they are not chain or live anti-bot evidence.
- [Bounded hosted checks](hosted.json) cover unverified reads/broadcasts, spoofed identity, invalid provider proof, forbidden route/origin, correct public policy, published bundle parity and continued public landing/demo download. A spoofed platform-identity header is refused by hosting403; this is not misreported as the app's401. No public load/saturation test was performed.
- Actual cloud Chrome UI: opened advanced signer setup, clicked **Check browser access**, observed **Browser access confirmed for Diana Testnet. No signing file was read and no transaction was submitted.** The provider check completed without an agent click inside the challenge. This is live positive session issuance plus an authorized read, not just a rendered widget. [Observation](browser.json). No browser secrets/tokens, raw logs or screenshot files retained.
- Real signing-file registration was not rebroadcast to test a proxy guard. Existing transaction evidence stays historical. Physical QoreX acceptance of this new browser-check flow remains OPEN.

Primary provider contract used: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ and https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/ . The proof is validated server-side; optional remoteip is not fabricated. Single-use enforcement is strengthened locally with the unique stored proof hash.

## Judge review and next checkpoint

The prior unauthenticated relay is now guarded with a provider-verified, expiring capability, atomic session limits and shared upstream budgets. Local negative/race tests and live desktop positive/refusal evidence pass. Do not claim IP fairness, DDoS elimination, an independently audited implementation, or new registration receipts. A11 implementation/desktop acceptance passes; phone/QoreX compatibility remains pending before milestone sign-off. No unrelated operational gate is closed.

Next owner action: hard-refresh the live app in QoreX, open #signer-setup, tap **Check browser access**, complete the browser check if shown, and confirm the Diana Testnet success message. Do not generate/upload a signing file or press Register signing key to perform this check.

My space update — READY, NOT POSTED: I added temporary, human-checked access and atomic request limits to The Record's Diana registration relay. All88 build/Node checks pass; live desktop access and unverified-request refusals are recorded. No signing file or transaction was needed for the access check. Phone compatibility is the remaining acceptance step; the contract and original audit reports are unchanged.

Ship Weeks: fresh official Check remains unobserved; no new challenge completion claimed. Q-Day entry remains unconfirmed. GitHub push and hackathon timeline display are tracked separately.
