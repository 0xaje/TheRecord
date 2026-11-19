-- No live-data backfill or deletion. Operator initialization is a separate bounded atomic statement.
CREATE TABLE service_capacity (
  id INTEGER PRIMARY KEY CHECK(id=1),
  limit_bytes INTEGER NOT NULL CHECK(limit_bytes>0),
  used_bytes INTEGER NOT NULL CHECK(used_bytes>=0),
  drafts_count INTEGER NOT NULL CHECK(drafts_count>=0),
  revisions_count INTEGER NOT NULL CHECK(revisions_count>=0),
  shares_count INTEGER NOT NULL CHECK(shares_count>=0),
  feedback_count INTEGER NOT NULL CHECK(feedback_count>=0),
  initialized_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER capacity_drafts_insert AFTER INSERT ON drafts
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+(length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))), drafts_count=drafts_count+(1) WHERE id=1;
  SELECT CASE WHEN (length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB)))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_drafts_update AFTER UPDATE OF title, terms ON drafts
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+((length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))) - (length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB)))), drafts_count=drafts_count+(0) WHERE id=1;
  SELECT CASE WHEN ((length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))) - (length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB))))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_drafts_delete AFTER DELETE ON drafts
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+(-(length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB)))), drafts_count=drafts_count+(-1) WHERE id=1;
  SELECT CASE WHEN (-(length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB))))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_draft_revisions_insert AFTER INSERT ON draft_revisions
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+(length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))), revisions_count=revisions_count+(1) WHERE id=1;
  SELECT CASE WHEN (length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB)))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_draft_revisions_update AFTER UPDATE OF title, terms ON draft_revisions
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+((length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))) - (length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB)))), revisions_count=revisions_count+(0) WHERE id=1;
  SELECT CASE WHEN ((length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))) - (length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB))))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_draft_revisions_delete AFTER DELETE ON draft_revisions
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+(-(length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB)))), revisions_count=revisions_count+(-1) WHERE id=1;
  SELECT CASE WHEN (-(length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB))))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_shares_insert AFTER INSERT ON shares
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+(length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))), shares_count=shares_count+(1) WHERE id=1;
  SELECT CASE WHEN (length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB)))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_shares_update AFTER UPDATE OF title, terms ON shares
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+((length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))) - (length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB)))), shares_count=shares_count+(0) WHERE id=1;
  SELECT CASE WHEN ((length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.terms AS BLOB))) - (length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB))))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_shares_delete AFTER DELETE ON shares
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+(-(length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB)))), shares_count=shares_count+(-1) WHERE id=1;
  SELECT CASE WHEN (-(length(CAST(OLD.title AS BLOB)) + length(CAST(OLD.terms AS BLOB))))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_review_feedback_insert AFTER INSERT ON review_feedback
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+(length(CAST(NEW.note AS BLOB))), feedback_count=feedback_count+(1) WHERE id=1;
  SELECT CASE WHEN (length(CAST(NEW.note AS BLOB)))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_review_feedback_update AFTER UPDATE OF note ON review_feedback
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+((length(CAST(NEW.note AS BLOB))) - (length(CAST(OLD.note AS BLOB)))), feedback_count=feedback_count+(0) WHERE id=1;
  SELECT CASE WHEN ((length(CAST(NEW.note AS BLOB))) - (length(CAST(OLD.note AS BLOB))))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER capacity_review_feedback_delete AFTER DELETE ON review_feedback
WHEN EXISTS(SELECT 1 FROM service_capacity WHERE id=1)
BEGIN
  UPDATE service_capacity SET used_bytes=used_bytes+(-(length(CAST(OLD.note AS BLOB)))), feedback_count=feedback_count+(-1) WHERE id=1;
  SELECT CASE WHEN (-(length(CAST(OLD.note AS BLOB))))>0 AND (SELECT used_bytes>limit_bytes FROM service_capacity WHERE id=1)
    THEN RAISE(ABORT, 'service_text_capacity') END;
END;
--> statement-breakpoint
CREATE TRIGGER request_limit_scope_quota BEFORE INSERT ON request_limits
WHEN NOT EXISTS(SELECT 1 FROM request_limits WHERE scope=NEW.scope)
 AND (SELECT COUNT(*) FROM request_limits)>=4096
BEGIN SELECT RAISE(ABORT, 'request_scope_capacity'); END;
