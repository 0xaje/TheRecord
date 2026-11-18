ALTER TABLE drafts ADD COLUMN trashed_at INTEGER;
--> statement-breakpoint
CREATE TRIGGER draft_trash_revoke AFTER UPDATE OF trashed_at ON drafts
WHEN NEW.trashed_at IS NOT NULL AND OLD.trashed_at IS NULL
BEGIN
  UPDATE shares SET revoked = 1 WHERE draft_id = NEW.id;
END;
