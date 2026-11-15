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

export async function privateAgreements(request, db) {
  const url = new URL(request.url);
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
    const codeHash = await digest(code);
    if (url.pathname === "/api/drafts/feedback") {
      const note = typeof input.note === "string" ? input.note.trim() : "";
      if (!note || note.length > 2000) return reply({ error: "Enter a change request up to 2,000 characters." }, 400);
      const saved = await db.prepare(`INSERT INTO review_feedback (token_hash, note, created_at)
        SELECT s.token_hash, ?, ? FROM shares s JOIN drafts d ON d.id = s.draft_id
        WHERE s.token_hash = ? AND s.access_code_hash = ? AND s.revoked = 0
        AND s.expires > ? AND s.revision = d.revision
        ON CONFLICT(token_hash) DO NOTHING RETURNING token_hash`)
        .bind(note, Date.now(), tokenHash, codeHash, Date.now()).first();
      return saved ? reply({ ok: true }, 201) : reply({ error: "This invitation is unavailable or a request was already sent." }, 409);
    }
    const share = await db.prepare(`SELECT s.title, s.terms, s.revision, s.fingerprint
      FROM shares s JOIN drafts d ON d.id = s.draft_id
      WHERE s.token_hash = ? AND s.access_code_hash = ? AND s.revoked = 0
      AND s.expires > ? AND s.revision = d.revision`)
      .bind(tokenHash, codeHash, Date.now()).first();
    return share ? reply(share) : reply({ error: "Incorrect code or unavailable invitation. Ask the sender for a current link and code." }, 404);
  }
  const user = request.headers.get("oai-authenticated-user-id");
  if (!user) return reply({ error: "Sign in to continue." }, 401);
  if (!db) return reply({ error: "Draft storage is unavailable." }, 503);

  if (request.method === "GET" && url.pathname === "/api/drafts") {
    const { results } = await db.prepare("SELECT id, title, terms, revision FROM drafts WHERE owner = ? ORDER BY rowid DESC").bind(user).all();
    return reply(results);
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

  if (url.pathname === "/api/drafts") {
    const { id, revision, title, terms } = input;
    if (typeof title !== "string" || !title.trim() || title.length > 120
      || typeof terms !== "string" || !terms.trim() || utf8.encode(terms).length > 20000) {
      return reply({ error: "Enter a title and agreement terms within the limits." }, 400);
    }
    if (id == null) {
      const draftId = crypto.randomUUID();
      await db.prepare("INSERT INTO drafts (id, owner, title, terms) VALUES (?, ?, ?, ?)").bind(draftId, user, title.trim(), terms).run();
      return reply({ id: draftId, revision: 1 }, 201);
    }
    if (typeof id !== "string" || !uuid.test(id) || !Number.isSafeInteger(revision)) return reply({ error: "Invalid draft." }, 400);
    const updated = await db.prepare("UPDATE drafts SET title = ?, terms = ?, revision = revision + 1 WHERE id = ? AND owner = ? AND revision = ? RETURNING revision")
      .bind(title.trim(), terms, id, user, revision).first();
    if (!updated) return reply({ error: "Draft unavailable or changed. Reopen it and try again." }, 409);
    return reply({ id, revision: updated.revision });
  }

  if (url.pathname === "/api/drafts/share") {
    const { id, revision } = input;
    if (typeof id !== "string" || !uuid.test(id) || !Number.isSafeInteger(revision)) {
      return reply({ error: "Save the draft first." }, 400);
    }
    const draft = await db.prepare("SELECT title, terms FROM drafts WHERE id = ? AND owner = ? AND revision = ?").bind(id, user, revision).first();
    if (!draft) return reply({ error: "Draft unavailable or changed. Reopen it first." }, 409);
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    const code = hex(crypto.getRandomValues(new Uint8Array(12)));
    const fingerprint = await digest(draft.title + "\n\n" + draft.terms);
    const expiry = Date.now() + 7 * 86400000;
    const share = await db.prepare(`INSERT INTO shares (token_hash, draft_id, revision, reviewer_email, title, terms, fingerprint, expires, access_code_hash)
      SELECT ?, id, revision, '', title, terms, ?, ?, ? FROM drafts WHERE id = ? AND owner = ? AND revision = ? RETURNING token_hash`)
      .bind(await digest(token), fingerprint, expiry, await digest(code), id, user, revision).first();
    return share ? reply({ token, code }) : reply({ error: "Draft changed. Reopen it first." }, 409);
  }

  if (url.pathname === "/api/drafts/revoke") {
    if (typeof input.id !== "string" || !uuid.test(input.id)) return reply({ error: "Invalid draft." }, 400);
    await db.prepare("UPDATE shares SET revoked = 1 WHERE draft_id IN (SELECT id FROM drafts WHERE id = ? AND owner = ?)")
      .bind(input.id, user).run();
    return reply({ ok: true });
  }


  return reply({ error: "Page not found." }, 404);
}
