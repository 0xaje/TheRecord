-- Enforce the existing quota on owner changes as well as inserts.
-- ABORT rolls back every row of a multi-row ownership move, never a partial move.
CREATE TRIGGER workspace_transfer_quota BEFORE UPDATE OF owner ON drafts
WHEN NEW.owner <> OLD.owner AND (SELECT COUNT(*) FROM drafts WHERE owner = NEW.owner) >= 50
BEGIN SELECT RAISE(ABORT, 'workspace_draft_quota'); END;
