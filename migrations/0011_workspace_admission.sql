-- No raw challenge tokens or workspace recovery codes are stored.
CREATE TABLE workspace_admissions (
 owner TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX workspace_admission_expiry ON workspace_admissions(expires_at);
--> statement-breakpoint
CREATE TRIGGER workspace_admission_quota BEFORE INSERT ON workspace_admissions
WHEN NOT EXISTS(SELECT 1 FROM workspace_admissions WHERE owner=NEW.owner)
 AND (SELECT COUNT(*) FROM workspace_admissions)>=4096
BEGIN SELECT RAISE(ABORT,'workspace_admission_capacity'); END;
