CREATE TABLE review_feedback (
  token_hash TEXT PRIMARY KEY REFERENCES shares(token_hash),
  note TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
