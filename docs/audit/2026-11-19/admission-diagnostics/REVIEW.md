# Admission provider failure — OPEN

Owner completed the real widget, but POST /api/drafts returned HTTP 503 (request efd3cc08c4db29032f1dfc3f1b51a4c7, 352 ms). No draft was saved. The original handler hid the underlying provider failure; root cause is unconfirmed.

Added bounded provider-response parsing, safe failure references, and an owner-authenticated invalid-token diagnostic. It grants no admission, saves no draft, and performs no wallet action. Local fixture tests pass: 64/64. These are engineering checks, not live CAPTCHA acceptance evidence.

Next: owner runs `node scripts/capacity-operator.mjs probe --confirm-no-save` using their existing private operator file. Inspect the safe result, correct the actual cause, then verify real desktop and QoreX challenge/save paths before enforcement. Preview remains enabled.

Separate open privacy finding: platform request logs include the custom workspace header. Do not publish raw logs. Evaluate redacted credential transport; no workspace credentials are included in this report.

Public update draft — READY, NOT POSTED: Investigating a real human-check/save failure. Added safe diagnostics and passed 64 automated checks. Live admission remains unverified; no success claim yet.

Event: this is backend reliability work, not a new Diana agreement proof. Ship Weeks checks were not re-observed; Q-Day registration deadline has passed.
