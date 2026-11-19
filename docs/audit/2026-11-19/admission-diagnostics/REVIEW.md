# Admission provider failure — OPEN

Owner completed the real widget, but POST /api/drafts returned HTTP 503 (request efd3cc08c4db29032f1dfc3f1b51a4c7, 352 ms). No draft was saved. The original handler hid the underlying provider failure; root cause is unconfirmed.

Added bounded provider-response parsing, safe failure references, and an owner-authenticated invalid-token diagnostic. It grants no admission, saves no draft, and performs no wallet action. Local fixture tests pass: 64/64. These are engineering checks, not live CAPTCHA acceptance evidence.

Next: owner runs `node scripts/capacity-operator.mjs probe --confirm-no-save` using their existing private operator file. Inspect the safe result, correct the actual cause, then verify real desktop and QoreX challenge/save paths before enforcement. Preview remains enabled.

Separate open privacy finding: platform request logs include the custom workspace header. Do not publish raw logs. Evaluate redacted credential transport; no workspace credentials are included in this report.

Public update draft — READY, NOT POSTED: Investigating a real human-check/save failure. Added safe diagnostics and passed 64 automated checks. Live admission remains unverified; no success claim yet.

Event: this is backend reliability work, not a new Diana agreement proof. Ship Weeks checks were not re-observed; Q-Day registration deadline has passed.

## Owner connection diagnostic
Owner authenticated probe returned AP-CONNECTION at fetch stage, TypeError; no provider HTTP response, admission, or draft. Site50 adds allowlisted failure-reason classification (no raw message). A fresh disposable invalid-token POST independently reproduced HTTP503/AP-CONNECTION. Awaiting safe runtime diagnostic; human challenge retry is not required yet.

## Redirect handling repaired — real acceptance remains OPEN
Runtime failure category identified redirect handling. Replaced `redirect:error` with `redirect:manual`; redirects are still rejected via the non-2xx check and the secret is never intentionally forwarded to a redirect target. Added a 302 fixture to verify fail-closed behavior. All 64 checks pass. Site51 deployed at hosting commit aded582fe2db640bcc9b36d5ab346c78e28f1fec, environment revision8 unchanged.

Actual hosted invalid-token request now returns403 from the semantic validation path rather than503/AP-CONNECTION, and GET confirms zero drafts for the disposable test workspace. This proves the transport failure is repaired, not that a real human challenge/save succeeds or that the configured key pair is valid. Owner must refresh the explicit preview-test URL, complete a fresh challenge and verify a successful save; QoreX acceptance and enforcement still pending. No wallet, token funding or audit payment needed.

Updated My space draft — READY, NOT POSTED: Fixed a live server connection failure in new-workspace human verification. Invalid tokens are rejected without saving drafts; 64 automated checks pass. Real human-check/save acceptance is next.

## Owner desktop acceptance
Owner reports the fresh real human check completed and the private draft saved successfully after Site51 redirect repair. This is owner-reported real desktop acceptance, not an independently captured receipt or mobile acceptance. QoreX mobile real challenge/save and enforcement remain open. Next: repeat the explicit preview-test flow in QoreX with a new harmless draft; confirm saved draft survives refresh.
