-- Short-lived, provider-verified relay access. No raw tokens, IPs or signing data.
CREATE TABLE relay_sessions (
 binding TEXT PRIMARY KEY,
 proof_hash TEXT NOT NULL UNIQUE,
 expires_at INTEGER NOT NULL,
 read_window INTEGER NOT NULL DEFAULT 0,
 read_hits INTEGER NOT NULL DEFAULT 0,
 send_window INTEGER NOT NULL DEFAULT 0,
 send_hits INTEGER NOT NULL DEFAULT 0,
 send_total INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX relay_session_expiry ON relay_sessions(expires_at);
--> statement-breakpoint
CREATE TRIGGER relay_session_quota BEFORE INSERT ON relay_sessions
WHEN (SELECT COUNT(*) FROM relay_sessions)>=4096
BEGIN SELECT RAISE(ABORT,'relay_session_capacity'); END;
