const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
const reply = (body, status = 200) => Response.json(body, { status, headers });
const uuid = /^[a-f0-9-]{36}$/;
const tokenPattern = /^[a-f0-9]{64}$/;
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const utf8 = new TextEncoder();
const digest = async text => hex(new Uint8Array(await crypto.subtle.digest("SHA-256", utf8.encode(text))));

async function readInput(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 100000) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  }
}

class RequestLimit extends Error {
  constructor(retryAfter) { super("Too many requests. Please wait before trying again."); this.retryAfter = retryAfter; }
}
async function limitRequests(db, scope, maximum) {
  const now = Date.now();
  const window = Math.floor(now / 60000) * 60000;
  const row = await db.prepare(`INSERT INTO request_limits(scope, window_start, hits) VALUES (?, ?, 1)
    ON CONFLICT(scope) DO UPDATE SET hits = CASE WHEN window_start = excluded.window_start THEN hits + 1 ELSE 1 END,
    window_start = excluded.window_start RETURNING hits`).bind(scope, window).first();
  if (row.hits > maximum) throw new RequestLimit(Math.max(1, Math.ceil((window + 60000 - now) / 1000)));
  await db.prepare("DELETE FROM request_limits WHERE scope IN (SELECT scope FROM request_limits WHERE window_start < ? LIMIT 100)")
    .bind(now - 3600000).run();
}
const limitWrites = db => limitRequests(db, "service:write", 600);

export async function privateAgreements(request, db) {
  try {
    return await handlePrivateAgreements(request, db);
  } catch (error) {
    if (error instanceof RequestLimit) return Response.json({ error: error.message }, {
      status: 429, headers: { ...headers, "Retry-After": String(error.retryAfter) },
    });
    const message = String(error.message ?? "");
    const quota = message.includes("workspace_draft_quota") ? "This workspace has reached its 50-draft limit. Existing drafts are still available."
      : message.includes("draft_invitation_quota") ? "This draft has reached its 100-invitation limit. Existing invitations are unchanged."
      : message.includes("draft_revision_quota") ? "This draft has reached its 200-revision limit. Saved revisions are still available." : null;
    if (quota) return reply({ error: quota }, 409);
    return reply({ error: "Draft service is temporarily unavailable. Try again." }, 503);
  }
}

async function handlePrivateAgreements(request, db) {
  const url = new URL(request.url);
  const readRoutes = ["/api/drafts", "/api/drafts/trash", "/api/drafts/item", "/api/drafts/revisions", "/api/drafts/revision", "/api/drafts/feedback"];
  const writeRoutes = ["/api/drafts", "/api/drafts/trash", "/api/drafts/restore", "/api/drafts/delete", "/api/drafts/move", "/api/drafts/share", "/api/drafts/revoke", "/api/drafts/review", "/api/drafts/feedback"];
  if (!(request.method === "GET" ? readRoutes : request.method === "POST" ? writeRoutes : []).includes(url.pathname)) return reply({ error: "Page not found." }, 404);
  if (request.method === "POST" && request.headers.get("origin") !== url.origin) return reply({ error: "Request blocked." }, 403);
  if (url.pathname === "/api/drafts/review" || (url.pathname === "/api/drafts/feedback" && request.method === "POST")) {
    if (request.method !== "POST") return reply({ error: "Page not found." }, 404);
    if (request.headers.get("origin") !== url.origin) return reply({ error: "Request blocked." }, 403);
    if (!db) return reply({ error: "Draft storage is unavailable." }, 503);
    const input = await readInput(request);
    const code = typeof input?.code === "string" ? input.code.trim().toLowerCase() : "";
    if (typeof input?.token !== "string" || !tokenPattern.test(input.token) || !/^[a-f0-9]{24}$/.test(code)) {
      return reply({ error: "Enter the access code from the sender." }, 400);
    }
    const tokenHash = await digest(input.token);
    await limitRequests(db, "review:" + tokenHash, 30);
    const codeHash = await digest(code);
    if (url.pathname === "/api/drafts/feedback") {
      const note = typeof input.note === "string" ? input.note.trim() : "";
      if (!note || note.length > 2000) return reply({ error: "Enter a change request up to 2,000 characters." }, 400);
      const validShare = await db.prepare(`SELECT s.token_hash FROM shares s JOIN drafts d ON d.id = s.draft_id
        WHERE s.token_hash = ? AND s.access_code_hash = ? AND s.revoked = 0 AND s.expires > ? AND s.revision = d.revision AND d.trashed_at IS NULL`)
        .bind(tokenHash, codeHash, Date.now()).first();
      if (!validShare) return reply({ error: "This invitation is unavailable or a request was already sent." }, 409);
      await limitWrites(db);
      const saved = await db.prepare(`INSERT INTO review_feedback (token_hash, note, created_at)
        SELECT s.token_hash, ?, ? FROM shares s JOIN drafts d ON d.id = s.draft_id
        WHERE s.token_hash = ? AND s.access_code_hash = ? AND s.revoked = 0
        AND s.expires > ? AND s.revision = d.revision AND d.trashed_at IS NULL
        ON CONFLICT(token_hash) DO NOTHING RETURNING token_hash`)
        .bind(note, Date.now(), tokenHash, codeHash, Date.now()).first();
      return saved ? reply({ ok: true }, 201) : reply({ error: "This invitation is unavailable or a request was already sent." }, 409);
    }
    const share = await db.prepare(`SELECT s.title, s.terms, s.revision, s.fingerprint
      FROM shares s JOIN drafts d ON d.id = s.draft_id
      WHERE s.token_hash = ? AND s.access_code_hash = ? AND s.revoked = 0
      AND s.expires > ? AND s.revision = d.revision AND d.trashed_at IS NULL`)
      .bind(tokenHash, codeHash, Date.now()).first();
    return share ? reply(share) : reply({ error: "Incorrect code or unavailable invitation. Ask the sender for a current link and code." }, 404);
  }
  // Trust this header only behind Sites dispatch, which provides sign-in identity.
  const legacyOwner = request.headers.get("oai-authenticated-user-id");
  const workspaceKey = request.headers.get("X-Record-Workspace");
  if (workspaceKey !== null && !tokenPattern.test(workspaceKey)) {
    return reply({ error: "Invalid workspace key." }, 400);
  }
  const workspaceOwner = workspaceKey ? "workspace:" + await digest(workspaceKey) : null;
  const user = workspaceOwner ?? legacyOwner;
  if (!user) {
    if (request.method === "GET" && url.pathname === "/api/drafts") return reply([]);
    return reply({ error: "Open your workspace before saving." }, 401);
  }
  if (!db) return reply({ error: "Draft storage is unavailable." }, 503);

  await limitRequests(db, (request.method === "GET" ? "read:" : "write:") + await digest(user), request.method === "GET" ? 120 : 30);

  if (request.method === "GET" && ["/api/drafts", "/api/drafts/trash"].includes(url.pathname)) {
    const before = url.searchParams.get("before");
    if (before !== null && !/^[1-9][0-9]{0,14}$/.test(before)) return reply({ error: "Invalid page." }, 400);
    const inTrash = url.pathname === "/api/drafts/trash";
    const { results } = await db.prepare(`SELECT rowid AS cursor, id, title, ${inTrash ? "trashed_at" : "terms"}, revision FROM drafts WHERE owner = ? AND trashed_at IS ${inTrash ? "NOT " : ""}NULL AND rowid < ? ORDER BY rowid DESC LIMIT 21`)
      .bind(user, before === null ? Number.MAX_SAFE_INTEGER : Number(before)).all();
    const page = results.slice(0, 20);
    return Response.json(page, { headers: { ...headers, ...(results.length > 20 ? { "X-Next-Draft": String(page.at(-1).cursor) } : {}) } });
  }
  if (request.method === "GET" && url.pathname === "/api/drafts/item") {
    const id = url.searchParams.get("id") ?? "";
    if (!uuid.test(id)) return reply({ error: "Invalid draft." }, 400);
    const row = await db.prepare("SELECT id, title, terms, revision FROM drafts WHERE id = ? AND owner = ? AND trashed_at IS NULL").bind(id, user).first();
    return row ? reply(row) : reply({ error: "Draft unavailable." }, 404);
  }

  if (request.method === "GET" && ["/api/drafts/revisions", "/api/drafts/revision"].includes(url.pathname)) {
    const id = url.searchParams.get("id") ?? "";
    if (!uuid.test(id)) return reply({ error: "Invalid draft." }, 400);
    const owned = await db.prepare("SELECT id FROM drafts WHERE id = ? AND owner = ?").bind(id, user).first();
    if (!owned) return reply({ error: "Draft unavailable." }, 404);
    if (url.pathname === "/api/drafts/revision") {
      const revision = url.searchParams.get("revision") ?? "";
      if (!/^[1-9][0-9]{0,14}$/.test(revision)) return reply({ error: "Invalid revision." }, 400);
      const row = await db.prepare(`SELECT r.revision, r.title, r.terms, r.saved_at FROM draft_revisions r
        JOIN drafts d ON d.id = r.draft_id WHERE d.id = ? AND d.owner = ? AND r.revision = ?
        UNION ALL SELECT d.revision, d.title, d.terms, NULL FROM drafts d
        WHERE d.id = ? AND d.owner = ? AND d.revision = ?
        AND NOT EXISTS (SELECT 1 FROM draft_revisions r WHERE r.draft_id = d.id AND r.revision = d.revision)
        LIMIT 1`).bind(id, user, Number(revision), id, user, Number(revision)).first();
      if (!row) return reply({ error: "Revision unavailable. Earlier overwritten text cannot be recovered." }, 404);
      return reply({ ...row, fingerprint: await digest(row.title + "\n\n" + row.terms) });
    }
    const before = url.searchParams.get("before");
    if (before !== null && !/^[1-9][0-9]{0,14}$/.test(before)) return reply({ error: "Invalid page." }, 400);
    const limit = before === null ? Number.MAX_SAFE_INTEGER : Number(before);
    const { results } = await db.prepare(`SELECT r.revision, r.title, r.saved_at FROM draft_revisions r
      JOIN drafts d ON d.id = r.draft_id WHERE d.id = ? AND d.owner = ? AND r.revision < ?
      UNION ALL SELECT d.revision, d.title, NULL FROM drafts d
      WHERE d.id = ? AND d.owner = ? AND d.revision < ?
      AND NOT EXISTS (SELECT 1 FROM draft_revisions r WHERE r.draft_id = d.id AND r.revision = d.revision)
      ORDER BY revision DESC LIMIT 21`).bind(id, user, limit, id, user, limit).all();
    const revisions = results.slice(0, 20);
    return reply({ revisions, nextBefore: results.length > 20 ? revisions.at(-1).revision : null });
  }

  if (request.method === "GET" && url.pathname === "/api/drafts/feedback") {
    const id = url.searchParams.get("id") ?? "";
    if (!uuid.test(id)) return reply({ error: "Invalid draft." }, 400);
    const { results } = await db.prepare(`SELECT s.revision, f.note FROM review_feedback f
      JOIN shares s ON s.token_hash = f.token_hash JOIN drafts d ON d.id = s.draft_id
      WHERE d.id = ? AND d.owner = ? ORDER BY f.created_at DESC LIMIT 50`).bind(id, user).all();
    return reply(results);
  }

  if (request.method !== "POST") return reply({ error: "Page not found." }, 404);
  if (request.headers.get("origin") !== url.origin) return reply({ error: "Request blocked." }, 403);
  const input = await readInput(request);
  if (!input || typeof input !== "object") return reply({ error: "Invalid request." }, 400);

  if (url.pathname === "/api/drafts/delete") {
    if (typeof input.id !== "string" || !uuid.test(input.id) || !Number.isSafeInteger(input.revision)
      || !Number.isSafeInteger(input.trashedAt) || input.trashedAt <= 0 || input.confirmation !== "DELETE") {
      return reply({ error: "Open Trash and confirm permanent deletion by typing DELETE." }, 400);
    }
    await limitWrites(db);
    // Dependent private rows are removed by the trigger in this atomic statement.
    const deleted = await db.prepare(`DELETE FROM drafts WHERE id = ? AND owner = ?
      AND revision = ? AND trashed_at = ? RETURNING id`)
      .bind(input.id, user, input.revision, input.trashedAt).first();
    return deleted ? reply({ ok: true }) : reply({ error: "Draft unavailable or changed. Refresh Trash before trying again." }, 409);
  }

  if (["/api/drafts/trash", "/api/drafts/restore"].includes(url.pathname)) {
    if (typeof input.id !== "string" || !uuid.test(input.id) || !Number.isSafeInteger(input.revision)) {
      return reply({ error: "Invalid draft." }, 400);
    }
    await limitWrites(db);
    const trashing = url.pathname === "/api/drafts/trash";
    const changed = await db.prepare(`UPDATE drafts SET trashed_at = ?
      WHERE id = ? AND owner = ? AND revision = ? AND trashed_at IS ${trashing ? "" : "NOT "}NULL RETURNING id`)
      .bind(trashing ? Date.now() : null, input.id, user, input.revision).first();
    return changed ? reply({ ok: true }) : reply({ error: "Draft unavailable or changed. Refresh and try again." }, 409);
  }

  if (url.pathname === "/api/drafts/move") {
    if (!legacyOwner || !workspaceOwner) return reply({ error: "Open your original signed-in browser to move these drafts." }, 403);
    await limitWrites(db);
    const result = await db.prepare("UPDATE drafts SET owner = ? WHERE owner = ?").bind(workspaceOwner, legacyOwner).run();
    return reply({ moved: result.meta.changes });
  }

  if (url.pathname === "/api/drafts") {
    const { id, revision, title, terms } = input;
    if (typeof title !== "string" || !title.trim() || title.length > 120
      || typeof terms !== "string" || !terms.trim() || utf8.encode(terms).length > 20000) {
      return reply({ error: "Enter a title and agreement terms within the limits." }, 400);
    }
    if (id == null) {
      await limitWrites(db);
      const draftId = crypto.randomUUID();
      await db.prepare("INSERT INTO drafts (id, owner, title, terms) VALUES (?, ?, ?, ?)").bind(draftId, user, title.trim(), terms).run();
      return reply({ id: draftId, revision: 1 }, 201);
    }
    if (typeof id !== "string" || !uuid.test(id) || !Number.isSafeInteger(revision)) return reply({ error: "Invalid draft." }, 400);
    await limitWrites(db);
    const updated = await db.prepare("UPDATE drafts SET title = ?, terms = ?, revision = revision + 1 WHERE id = ? AND owner = ? AND revision = ? AND trashed_at IS NULL RETURNING revision")
      .bind(title.trim(), terms, id, user, revision).first();
    if (!updated) return reply({ error: "Draft unavailable or changed. Reopen it and try again." }, 409);
    return reply({ id, revision: updated.revision });
  }

  if (url.pathname === "/api/drafts/share") {
    const { id, revision } = input;
    if (typeof id !== "string" || !uuid.test(id) || !Number.isSafeInteger(revision)) {
      return reply({ error: "Save the draft first." }, 400);
    }
    const draft = await db.prepare("SELECT title, terms FROM drafts WHERE id = ? AND owner = ? AND revision = ? AND trashed_at IS NULL").bind(id, user, revision).first();
    if (!draft) return reply({ error: "Draft unavailable or changed. Reopen it first." }, 409);
    await limitWrites(db);
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    const code = hex(crypto.getRandomValues(new Uint8Array(12)));
    const fingerprint = await digest(draft.title + "\n\n" + draft.terms);
    const expiry = Date.now() + 7 * 86400000;
    const share = await db.prepare(`INSERT INTO shares (token_hash, draft_id, revision, reviewer_email, title, terms, fingerprint, expires, access_code_hash)
      SELECT ?, id, revision, '', title, terms, ?, ?, ? FROM drafts WHERE id = ? AND owner = ? AND revision = ? AND trashed_at IS NULL RETURNING token_hash`)
      .bind(await digest(token), fingerprint, expiry, await digest(code), id, user, revision).first();
    return share ? reply({ token, code }) : reply({ error: "Draft changed. Reopen it first." }, 409);
  }

  if (url.pathname === "/api/drafts/revoke") {
    if (typeof input.id !== "string" || !uuid.test(input.id)) return reply({ error: "Invalid draft." }, 400);
    await limitWrites(db);
    await db.prepare("UPDATE shares SET revoked = 1 WHERE draft_id IN (SELECT id FROM drafts WHERE id = ? AND owner = ?)")
      .bind(input.id, user).run();
    return reply({ ok: true });
  }


  return reply({ error: "Page not found." }, 404);
}
