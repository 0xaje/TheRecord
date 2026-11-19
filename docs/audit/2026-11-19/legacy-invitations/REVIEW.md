# A12 pre-access-code invitations — regression PASS

Created an isolated real SQLite database at migrations0001/0002, seeded one explicitly labelled legacy fixture draft/share/old email code/reviewer identity, then applied every remaining migration unchanged. The new access_code_hash is NULL. Missing access code returns400; old valid email code, arbitrary valid-shaped code and old reviewer identity cannot open the invitation (404) or submit feedback (409). No draft terms leaked in rejected responses and no feedback row was inserted.

The same owner issues a new coded invitation: review200 and feedback201 pass. The old access-code hash remainsNULL, no secret is invented/backfilled, original draft remains. No live database was inspected for old invitations, no live invitation revoked/deleted, and no runtime/schema changes made. Existing UI already asks for a current link/code; no change needed merely to close a review finding.

77 local checks pass including the new actual migration regression. Fixtures are private-workspace adapter tests, not live independent-user or Diana transaction evidence. The production Worker build is unchanged, so no redeployment required. A12 regression checkpoint closed. Historic live legacy invitation inventory remains unmeasured; behavior stays fail-closed regardless of row existence.

Judge review: the suspected compatibility issue is resolved by explicit fail-closed policy and a tested reissue path, not an authentication bypass fix. Independent complete-user acceptance, trusted-source relay abuse controls, provider monitoring and other audit work remain open. Event: supports safe shared-document review; no new PQ approval/scoped-window claim. Ship Weeks fresh Check unobserved; no Q-Day entry.

Public update draft — READY, NOT POSTED: Added a migration regression confirming older invitations cannot bypass access-code checks. Owners can issue fresh invitations;77 automated checks pass. No private data or wallet transaction used in the live service.
