CREATE TABLE draft_revisions (
  draft_id TEXT NOT NULL REFERENCES drafts(id),
  revision INTEGER NOT NULL,
  title TEXT NOT NULL,
  terms TEXT NOT NULL,
  saved_at INTEGER,
  PRIMARY KEY (draft_id, revision)
);
--> statement-breakpoint
CREATE TRIGGER draft_revision_created AFTER INSERT ON drafts
BEGIN
  INSERT INTO draft_revisions (draft_id, revision, title, terms, saved_at)
  VALUES (NEW.id, NEW.revision, NEW.title, NEW.terms, CAST(strftime('%s', 'now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER draft_revision_preserve BEFORE UPDATE OF title, terms, revision ON drafts
BEGIN
  INSERT OR IGNORE INTO draft_revisions (draft_id, revision, title, terms, saved_at)
  VALUES (OLD.id, OLD.revision, OLD.title, OLD.terms, NULL);
END;
--> statement-breakpoint
CREATE TRIGGER draft_revision_saved AFTER UPDATE OF title, terms, revision ON drafts
BEGIN
  INSERT INTO draft_revisions (draft_id, revision, title, terms, saved_at)
  VALUES (NEW.id, NEW.revision, NEW.title, NEW.terms, CAST(strftime('%s', 'now') AS INTEGER) * 1000);
END;
