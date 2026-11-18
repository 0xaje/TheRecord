CREATE TRIGGER draft_delete_private_data BEFORE DELETE ON drafts
BEGIN
  SELECT CASE WHEN OLD.trashed_at IS NULL THEN RAISE(ABORT, 'draft_not_trashed') END;
  DELETE FROM review_feedback WHERE token_hash IN (SELECT token_hash FROM shares WHERE draft_id = OLD.id);
  DELETE FROM invite_codes WHERE token_hash IN (SELECT token_hash FROM shares WHERE draft_id = OLD.id);
  DELETE FROM shares WHERE draft_id = OLD.id;
  DELETE FROM draft_revisions WHERE draft_id = OLD.id;
END;
