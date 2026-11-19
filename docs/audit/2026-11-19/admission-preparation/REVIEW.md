# New-workspace anti-bot integration — prepared, enforcement OFF

19 November2026 WAT. The owner confirmed authenticated capacity status at00:30:00.518Z: initialized/reconciled/normal with exhaustive inventory. Raw usage figures and operator token are not republished. This closes operator handover; the broader A06 milestone stays OPEN.

## Implementation

server/admission.js validates a real Turnstile result with Siteverify before a new recovery workspace can create its first draft when mode=enforce. Checks include success, exact configured hostname/action, timestamp age and a SHA-256 workspace binding. Request tokens are capped at2048 characters, upstream waits at10seconds and response bodies at16KiB, with redirects refused. Network/error responses fail closed with safe messages and no automatic retry. No forwarded/IP header is trusted or sent as remoteip.

Schema-only0011 adds workspace_admissions: only hashed owner, hashed token and expiry. The token-hash uniqueness guard protects against cross-workspace replay even if provider redemption visibility converges slowly. Already admitted owners do not need another proof. A proof can admit an owner before their subsequent draft save fails, allowing an explicit later retry without claiming a draft was saved. Admission is not a transaction guarantee or a unique-person identity.

Records are limited to4096. Admissions are valid for7days; expired rows are removed in bounded batches of100 during later successful admission attempts. Expiry does NOT promise physical deletion precisely after7days. Live records are never evicted to make room. Existing saved drafts, including Trash, remain accessible and do not retroactively require a challenge. These grandfathered records are not retrospectively proven human. Current public read-only file checks and QoreChain approval semantics are unchanged.

Feature modes:
- off: no widget load, no Siteverify, no admission record created. This is the live mode now.
- preview: ordinary users continue normally. Opt-in ?admission-test=1 requests a real challenge; even an existing workspace's opt-in proof reaches server validation. This lets QoreX compatibility be tested without clearing storage or risking recovery codes. Choose New draft for the preview save.
- enforce: only genuinely new/unadmitted recovery workspaces require the check before their first draft. Existing workspace paths continue. Missing configuration or a misspelled mode fails closed for new workspace creation; no automatic bypass.

The client shows a cancellable dialog only when the policy requests a widget. It explains that Cloudflare receives browser signals and a workspace-code fingerprint, not the draft text or recovery code. Cancel/load/error/expiry/timeout do not submit the save. No secret key is sent to the client. Public policy exposes only a configured public sitekey, action and the caller's binding. Known dummy keys are rejected as production configuration.

## Tests and evidence

All62 Node/build checks pass, including nine admission-specific tests. Provider results in tests are explicit local adapter fixtures, NOT live anti-bot or real-person proof. Tests cover mode behavior, configuration failure, direct POST bypass refusal, existing/trashed workspace access, hostname/action/binding/time/token/size errors, safe upstream failure, hashed persistence, replay refusal, admission row ceiling/expiry, public policy secrecy, browser-helper off-mode/no-retry behavior, opt-in preview actually calling provider, and typo fail-closed behavior. Prior capacity/workspace/withdrawal regressions remain included.

Site48 deployment uses hosting source b3704cc58489df690976c6a7aa10ccd88289e6ed, saved version appgprj_6af8daf3a96c81918026a69ec89cfb47~appgver_177eb762192481918e3a0774660534fd, deployment appgdep_6afe45970f1c8191890fb23841c701c6, environment revision4. No Turnstile variables were configured. The published policy is explicitly checked as mode=off/required=false; deployment.json records package hashes. Hosted off-mode workspace acceptance is recorded separately. No claim that the live site is protected by Turnstile yet. Owner operator credential remains configured; no access-token rotation or counter reset occurred.

## Owner configuration — next dependency

Create a real widget using Cloudflare's official dashboard guidance:
https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/

| Field | Value |
| --- | --- |
| Widget name | TheRecord workspace admission |
| Region | Rest of World |
| Hostname | the-record-diana-verifier.flutteringpeach8.chatgpt.site |
| Widget mode | Managed |
| Pre-clearance | Off |

Use the hostname only, without https or a path. No domain transfer or DNS change is required by this implementation. Do not select dummy testing keys as live proof. An account is needed; any new account/legal acceptance must be completed by the owner. No account or paid subscription has been created by the agent.

Share only the public Site key. Keep the Secret key private and enter it through the hosting runtime's secure settings; never paste it into chat or show it in a screenshot. Runtime configuration for the approved next phase is RECORD_TURNSTILE_SITE_KEY (public key), RECORD_TURNSTILE_SECRET (secret), RECORD_TURNSTILE_HOSTNAME (exact hostname above), RECORD_ADMISSION_MODE=preview. Preserve the existing operator and service secrets. Do not set enforce before real desktop and QoreX acceptance. Owner may need help locating the secure settings UI; inspect the actual screen instead of guessing a route or asking for the secret.

After real configuration, test ?admission-test=1#workspace on desktop and QoreX with one non-sensitive new draft. Verify both widget completion and server-validated save, cancellation/failure preserving typed text, expired/replayed proof refusal and existing workflow access. Opening the preview URL without configured keys is not a challenge test. Once accepted, enable enforce and independently verify a direct new-workspace POST without proof is refused while already saved workspaces and public verification remain usable. Do not clear existing phone storage to create a test identity.

## Blunt review

Code and local regressions are ready, but real widget keys/account setup, secure secret entry, actual provider validation and QoreX UI acceptance remain missing. A fixture success, off-mode save or site badge is not proof of live admission enforcement. The counter/admission ceiling contains storage but still permits denial of service against new scopes; distributed request load, provider storage/billing monitoring and alerts remain unverified. These controls cannot guarantee unique humans or complete bot resistance. No app score or official audit closure is claimed.

Applicable event purpose: service reliability; no new Diana transaction or cryptographic claim. Ship Weeks four owner-reported completions/freshCheck-unobserved; Q-Day registration past/no entry claimed. Other audit corrections and independent-user acceptance remain open. Prior A06 architecture approval applies; do not ask for it again.

Official references:
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/
- https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/

My space draft — READY, NOT POSTED: The Record's storage/operator checkpoint is confirmed, and the next-workspace admission integration is prepared with62 passing automated checks. Enforcement remains off until the real widget and QoreX acceptance pass. This is preparation evidence, not a claim of live bot protection.
