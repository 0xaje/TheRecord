CREATE TABLE invite_codes (
  token_hash TEXT PRIMARY KEY REFERENCES shares(token_hash),
  code_hash TEXT NOT NULL,
  expires INTEGER NOT NULL,
  sent_at INTEGER NOT NULL,
  sends INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0
);
