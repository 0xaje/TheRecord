# Build, run and prepare a deployment

Current source: main. The previously tested working history was merged through PR #1. All future work stays on main. See [current status](CURRENT_STATUS.md).

## Verified environment

Ubuntu/Linux or Ubuntu in WSL, Node **24.22.3** (`.nvmrc`), npm 11.9.0.
The build uses the shell command `cp`; on Windows, run these commands inside
Ubuntu/WSL, not native PowerShell. No wallet phrase, private key or npm secret
is needed for the checks below. Dependency versions/integrities are locked in
`package-lock.json`; `npm ci` must succeed without modifying it.

```sh
git clone --branch main --single-branch https://github.com/0xaje/TheRecord.git
cd TheRecord
# If nvm is installed:
nvm install
nvm use
npm ci
npm run check
npm run start:local
```

Open **http://127.0.0.1:8788/**. Keep the terminal running. Ctrl+C stops it.
The HTML and browser JavaScript are the real built application, served through
`dist/server/index.js`, not a separate UI. The local adapter binds only loopback.
It strips caller-supplied `oai-authenticated-user-id`; use workspace recovery
codes for local drafts. Do not expose this development server publicly.

Local drafts persist in `.record-local/drafts.sqlite`, which Git ignores.
Eleven SQL migrations are applied at startup, outside request handling. A local
migration ledger checks SHA-256 before skipping applied migrations; changed
migration files fail startup. Migration application is transactional. Never
edit applied SQL. Append the next numbered migration and matching journal entry.
Keep the database file and recovery code if you want to retain local drafts.
There is no automatic transfer between local and hosted databases.

The browser still uses real Diana testnet RPC when you verify/record/approve.
The automated local tests create only non-sensitive, isolated local records;
they do not submit transactions, exercise Diana's PQC precompiles, or establish
that an approval succeeded on-chain. Those claims require the linked receipts.

## Commands and boundaries

| Command | What it verifies/does |
| --- | --- |
| `npm run build:site` | Bundles browser JS, HTML, images and actual Worker |
| `npm test` | Runs isolated tests; run build first because startup/server tests import built output |
| `npm run check` | Builds then runs all regression checks, including local HTTP/SQLite persistence |
| `npm run start:local` | Runs the built Worker against a separate durable local SQLite file |
| `node scripts/check-published-build.mjs` | Read-only comparison of published HTML and JS with this build; saves evidence |
| `node scripts/check-history.mjs` | Read-only real Diana agreement history check; needs network/archive data |
| `node scripts/check-diana-approvals.mjs` | Read-only real Diana signature rejection regression |

Live write/delete scripts require explicit flags and are **not** part of CI.
They create their own disposable drafts. Never substitute existing user draft
IDs. CI does not access hosted draft storage, recovery codes or wallet keys.

## Contract tests

The contract source pins Solidity 0.8.28 in `foundry.toml`. With Foundry already
installed, run:

```sh
DIANA_RPC_URL=https://evm-testnet.qore.host forge test -vv
```

See `AUDIT.md` for historical results and limitations. Foundry is not installed
in the current work environment, so no fresh Solidity test result is claimed
for this build milestone. The separate Solidity CI job runs pinned Foundry state-rule tests; its local precompile fixtures are not live Diana execution.

## Prepare the existing Sites/Worker deployment format

The hosted application uses a Worker entrypoint plus D1 binding **DB**. A static
file server alone supports neither saving drafts nor the registration relay.
The public GitHub source is authoritative. The hosting checkout contains the
compiled Worker and immutable migration copies; it is not a second source UI.

1. Register/select **your own** Site through the hosting platform. Retain the
   exact returned project ID and current audience. Do not reuse The Record's
   live ID or database for your own deployment.
2. Run `npm ci` and `npm run check` from the selected source commit.
3. Prepare a **new, empty** output path. Replace `YOUR_SITE_ID` with that returned
   ID; the script does not register, deploy or change permissions:

   ```sh
   npm run package:site -- --project-id YOUR_SITE_ID --output site-bundle
   ```

4. The output includes `.openai/hosting.json` (`project_id` and `d1: DB`),
   `dist/server/index.js`, `drizzle/0001…0011*.sql`, and
   `drizzle/meta/_journal.json`. The journal preserves the live deployment's
   existing immutable entries. `build-hashes.json` records compiled/migration
   hashes. Existing output paths are rejected to avoid replacing identities.
5. In the selected hosting checkout, use its supported source workflow to copy
   the built Worker and only unapplied migration additions, preserve its
   identity and prior journal entries, commit/push that exact source, package
   its output, save a version from the pushed commit and deploy that version.
   The platform provisions D1 and applies pending schema migrations before the
   Worker. Never create schema from an HTTP request or manually rerun old SQL.
6. Verify the deployment succeeded, then check original/changed-file results,
   draft save/restart/recovery, review revocation, Trash/restore and confirmed
   deletion of a disposable draft. Save receipts/results without secrets.

The legacy signed-in fallback relies on the hosting platform's trusted identity
header. Another production host must strip untrusted incoming identity headers
and provide its own verified identity boundary before forwarding any trusted
header. Do not forward caller-supplied identity as if it were authenticated.
The local adapter deliberately disables that fallback. A fresh deployment on
another provider is not asserted as tested by the prepared bundle.

## Automated checks and proof

`.github/workflows/check.yml` runs on main pushes, pull requests and manual
invocation, using read-only permissions, immutable action commit pins and the
Node version in `.nvmrc`. It performs `npm ci` and `npm run check` without
production or wallet credentials. An enabled workflow is not a passing run:
record the actual Actions result separately. No auto-deployment is configured.

Evidence in `docs/audit/2026-11-18/` distinguishes the local run, fresh dependency
installation, compiled asset hashes and any observed GitHub Actions run.
Independent user testing and organizer audit-stage acceptance remain separate release gates. Real scoped-window evidence is linked in [current status](CURRENT_STATUS.md).

Official implementation references: [Node SQLite API](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html),
[GitHub Node build/test guide](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs),
[setup-node action](https://github.com/actions/setup-node).
