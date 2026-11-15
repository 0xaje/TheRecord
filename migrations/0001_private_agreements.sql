CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  title TEXT NOT NULL,
  terms TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE shares (
  token_hash TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES drafts(id),
  revision INTEGER NOT NULL,
  reviewer_email TEXT NOT NULL,
  reviewer_id TEXT,
  title TEXT NOT NULL,
  terms TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  expires INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX drafts_owner ON drafts(owner);
CREATE INDEX shares_draft ON shares(draft_id);
