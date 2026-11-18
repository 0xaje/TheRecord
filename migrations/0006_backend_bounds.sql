CREATE TABLE request_limits (
  scope TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX request_limits_expiry ON request_limits(window_start);
--> statement-breakpoint
CREATE TRIGGER workspace_draft_quota BEFORE INSERT ON drafts
WHEN (SELECT COUNT(*) FROM drafts WHERE owner = NEW.owner) >= 50
BEGIN SELECT RAISE(ABORT, 'workspace_draft_quota'); END;
--> statement-breakpoint
CREATE TRIGGER draft_invitation_quota BEFORE INSERT ON shares
WHEN (SELECT COUNT(*) FROM shares WHERE draft_id = NEW.draft_id) >= 100
BEGIN SELECT RAISE(ABORT, 'draft_invitation_quota'); END;
--> statement-breakpoint
CREATE TRIGGER draft_revision_quota BEFORE UPDATE OF title, terms, revision ON drafts
WHEN (SELECT COUNT(*) FROM draft_revisions WHERE draft_id = OLD.id) +
  CASE WHEN EXISTS (SELECT 1 FROM draft_revisions WHERE draft_id = OLD.id AND revision = OLD.revision) THEN 0 ELSE 1 END >= 200
BEGIN SELECT RAISE(ABORT, 'draft_revision_quota'); END;
