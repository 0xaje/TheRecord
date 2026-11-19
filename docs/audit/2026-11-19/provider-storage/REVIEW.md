# Provider storage, hosting cost and recovery checkpoint

**Owner read-back PASS — 19 November2026,14:51:58UTC:** Owner supplied status from the updated main checkout. [Aggregate JSON](owner-status.json) reports initialized:true, reconciled:true, status:normal, all inventory bounds exhaustive, mandatory admission enforced, retained text7139/67108864bytes and actual D1-reported database size159744bytes (156KiB). This verifies the protected live readout using the owner-held credential; no secret or private document was supplied. Source pull log/prompt omitted from retained evidence. Size/readout checkpoint CLOSED; automatic alert delivery and backup/restore assurance remain OPEN. Dated pending statements below describe the earlier state. Both GitHub check and solidity jobs passed for67e29eaa277dcb21b6bc1d21d3870eb84e03193f ([CI](https://github.com/0xaje/TheRecord/actions/runs/44548149386)).

19 November 2026. PARTIAL: safe aggregate inspection and protected readout improvement completed; actual provider size read-back, automatic alerts and database backup/restore assurance remain open. This is an operational review, not a new contract or a new product feature.

Deployed **Site60**, hosting source24695b3714a5332a24abab0a1b7bfeac6d50af99, environment revision9. [Hosted operator-auth refusal, public availability and unchanged browser parity](hosted.json) pass. Operator positive read-back remains pending; deployment success is not that read-back.

## Verified existing state

The native read-only database overview returned binding DB and the nine expected application tables. Only the single service_capacity row was read; no private draft, invitation, review text, credentials or raw request logs were read or exported. It reports7139 retained UTF-8 application-text bytes against67108864bytes (64MiB), with27drafts,26revisions,19shares and2feedback entries. This is a retained-text meter snapshot, NOT database file size, a full reconciliation, provider billing usage or a backup.

Existing application containment and80%/90% warning states remain enforced/readable in the private operator status. Alerts are manual status flags, not delivered notifications. No automatic alert schedule was created, no secret was rotated and no counter was reset. Relay access and the owner's QoreX acceptance remain complete.

## Provider documentation checked

Primary source: [Creating and using ChatGPT Sites](https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites), reread19November2026.

- Current published policy says Sites hosting is included with Plus/Pro. Build/edit usage is separate Codex usage. Do not invent a separate Cloudflare bill for this managed Site. Actual account invoices/shared usage and any future policy change were not independently inspected.
- It documents up to10GB per Site database, with shared usage/storage limits also applicable. This is a published service limit, not a queried account-specific available balance or an implemented spending cap. Do not substitute a directly owned Cloudflare Free/Paid account quota for managed Sites.
- Restoring an earlier Site version restores code, not its database or uploaded files. Source version history is not a private-data backup.
- Sites has no built-in combined database/files backup-and-restore-to-new-Site feature. This does not prove no internal provider backups exist. Their retention, export, erasure and owner restore access remain unverified.

[Cloudflare D1 return objects](https://developers.cloudflare.com/d1/worker-api/return-object/) and [prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/) document size_after query metadata. Cloudflare's general Time Travel policy is not evidence of owner-accessible restore/retention for this managed Site. No direct provider API/account permissions or billing/backup management tools were found in the available connected capabilities. Plugin discovery did not provide a matching Cloudflare/D1 management connection.

## Implemented improvement

The existing operator-only capacity query now uses the same bounded aggregate with its result metadata retained. The response exposes only a validated positive safe-integer size_after as databaseStorage.reportedSizeBytes. Missing/invalid metadata is null/unavailable; application-text bytes are never substituted. Raw provider metadata is never returned. Authentication is unchanged, and the read remains one aggregate snapshot with no mutations. Provider quota is unknown in the runtime response rather than a fabricated live quota.

The readout explicitly states manual monitoring, no configured automatic alert delivery, and unverified account billing/backup retention/provider restore testing. It excludes backup copies and is not a spending total. The database size value still needs actual hosted owner read-back because the operator credential exists only on the owner's machine. Existing native table-reading tools do not expose size metadata.

**89 build/Node checks pass** ([raw log](check.txt)), including provider-metadata allowlisting, absent/invalid-value handling, authentication/privacy, unchanged data and all prior containment/relay checks. Provider metadata in tests is explicitly a local fixture; no live size measurement is claimed from it. No schema/migration, public UI, browser bundle, contract or wallet behavior changed.

## Remaining acceptance and concrete next action

Owner runs from the updated main checkout on their Ubuntu machine:

```sh
git pull --ff-only origin main
node scripts/capacity-operator.mjs status
```

Share only the resulting status JSON, never operator.secret or its token. This is a GET aggregate read; do NOT run init, initialize, probe or a restore. Expected: initialized:true, reconciled:true, status:normal and the new databaseStorage/operations fields. A null size means the managed binding did not expose metadata, which is an honest limitation to record rather than bypass operator access.

Next decision after that read-back: retain manual monitoring/disclosed recovery limits for the current event build, or approve a concrete encrypted owner-controlled data export/restore design. No private multi-user export, third-party monitoring service, hosting migration, direct Cloudflare account, paid plan, live restore or data deletion was introduced. A service backup design must cover all related tables and credentials safely, exclude/revoke ephemeral grants, preserve migration/capacity consistency, and prove restore into an isolated target before any production restore claim. Current data must not be overwritten merely to demonstrate recovery.

Provider-level recovery remains a real operational limitation; this is not described as a new official hackathon eligibility rule. Independent participant testing, organizer audit acceptance, final video/listing and other release checks remain separate. The checkpoint is not marked fully closed.

My space update — READY, NOT POSTED: I checked The Record's live aggregate storage meter and added provider-reported database size to the existing private operator readout, with explicit unknown states. All89 build/Node checks pass. Site source rollback is documented separately from database recovery; automatic alerts and backup/restore assurance are not claimed.

Ship Weeks fresh official Check remains unobserved. No new challenge completion, Q-Day entry or Diana transaction is claimed. GitHub source publication does not itself prove the public event timeline updated.

## Current next action

Do not rerun initialization. Current usage is small and accounting is consistent; no cleanup, paid storage upgrade or hosting migration is justified by this snapshot. Monitoring is still manual, and successful source updates/status reads do not establish backup recoverability. Next separate work is an owner-controlled recovery design and delivered alerts; retain these gaps rather than closing the entire operational milestone. Public My space update READY, NOT POSTED: I verified the protected live database-size readout from Ubuntu. The database reports156KiB, retained-text accounting reconciles, and admission remains enforced. Automatic alerts and tested data recovery remain disclosed operational gaps.
