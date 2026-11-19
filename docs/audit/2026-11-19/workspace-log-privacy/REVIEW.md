# Workspace credential transport privacy

New browser code and operational test scripts send the workspace code through Authorization (Bearer workspace:...), rather than the unredacted custom header. Server derives exactly the same owner hash; saved drafts and recovery codes are not migrated, replaced or rotated. Malformed Authorization and conflicting dual credentials fail closed. Older clients retain the legacy header fallback to preserve existing sessions.

65 local checks pass, including identity continuity from legacy to Authorization, update access, recovery by same code, outsider isolation and conflict rejection. Hosted new transport obtains enforce/required policy200, missing-proof POST403, reads200 and zero drafts. This is not a successful human challenge/save claim for the new transport.

Scope limits: old already-open clients may still send the custom header until refreshed. Historical logs are not erased or retroactively redacted by this patch. No real user workspace key was used in testing. Do not publish raw platform logs or credentials. Fresh live log redaction observation and owner existing-draft acceptance are tracked separately in evidence/progress.

Event: backend privacy work, no contract change or new Diana proof. Ship Weeks Check not re-observed. No additional Q-Day entry. Public update draft READY, NOT POSTED: Updated workspace credential transport while preserving stored drafts; 65 tests pass and live API checks preserve mandatory proof enforcement. Final user continuity check pending.

## Owner continuity acceptance — PASS
Owner confirms saved draft access works after the requested hard refresh. Combined with65 local checks and three live redacted Authorization observations, the updated-client transport repair passes its bounded acceptance. Historical logs and older unrefreshed clients remain limitations; no deletion of historical logs or comprehensive incident closure claimed. Public update READY, NOT POSTED.
