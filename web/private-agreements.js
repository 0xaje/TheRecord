const query = new URLSearchParams(location.search);
const invitation = new URLSearchParams(location.hash.slice(1)).get("invite");
const workspace = document.querySelector("#workspace");
const review = document.querySelector("#review");
const draftForm = document.querySelector("#draft");
const invite = document.querySelector("#invite");
const inviteStatus = invite.querySelector("output");
const feedback = document.querySelector("#draft-feedback");
const copy = document.querySelector("#copy-invite");
let drafts = [];
let current;

const storageKey = "the-record-workspace";
const keyPattern = /^[a-f0-9]{64}$/;
let workspaceKey = localStorage.getItem(storageKey);

function rememberKey(key) {
  localStorage.setItem(storageKey, key);
  workspaceKey = key;
}

function newWorkspaceKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
}

async function api(path = "", body, key = workspaceKey) {
  const headers = {};
  if (!invitation && key) headers["X-Record-Workspace"] = key;
  const options = { headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.method = "POST";
    options.body = JSON.stringify(body);
  }
  const response = await fetch("/api/drafts" + path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

function clearLink() {
  invite.elements.access.value = "";
  invite.elements.access.hidden = true;
  invite.elements.link.value = "";
  invite.elements.link.hidden = true;
  copy.hidden = true;
}

function setDownload(link, version) {
  if (link.hasAttribute("href")) URL.revokeObjectURL(link.href);
  link.removeAttribute("href");
  link.hidden = !version;
  if (!version) return;
  const bytes = new TextEncoder().encode(version.title + "\n\n" + version.terms);
  link.href = URL.createObjectURL(new Blob([bytes], { type: "text/plain;charset=utf-8" }));
  link.download = `agreement-revision-${version.revision}.txt`;
}

function openDraft(id) {
  current = drafts.find(draft => draft.id === id);
  draftForm.elements.title.value = current?.title ?? "";
  draftForm.elements.terms.value = current?.terms ?? "";
  invite.hidden = !current;
  document.querySelector("#draft-record").hidden = !current;
  document.querySelector("#draft-revision").textContent = current ? `Saved revision ${current.revision}` : "New draft";
  setDownload(document.querySelector("#download-draft"), current);
  clearLink();
  feedback.hidden = !current;
  const list = feedback.querySelector("ul");
  const status = feedback.querySelector("output");
  list.replaceChildren();
  status.textContent = "";
  if (current) {
    const draft = current;
    api("/feedback?" + new URLSearchParams({ id: draft.id })).then(notes => {
      if (current !== draft) return;
      status.textContent = notes.length ? "" : "No change requests yet.";
      for (const { revision, note } of notes) {
        const item = document.createElement("li");
        item.textContent = `Revision ${revision}: ${note}`;
        list.append(item);
      }
    }).catch(error => {
      if (current === draft) status.textContent = error.message;
    });
  }
  inviteStatus.textContent = "";
  openRevisionHistory(current);
}

async function loadDrafts(id) {
  drafts = await api();
  document.querySelector("#move-legacy-drafts").hidden = Boolean(workspaceKey) || !drafts.length;
  const list = draftForm.elements.saved;
  list.replaceChildren(new Option("New draft", ""), ...drafts.map(draft => new Option(draft.title, draft.id)));
  list.value = id ?? "";
  openDraft(list.value);
}

async function submit(form, run) {
  const status = form.querySelector("output");
  const controls = [...form.querySelectorAll("button")];
  controls.forEach(button => { button.disabled = true; });
  status.textContent = "Working…";
  try {
    status.textContent = await run();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    controls.forEach(button => { button.disabled = false; });
  }
}

if (invitation) {
  review.hidden = false;
  const form = document.querySelector("#review-code");
  const requestForm = document.querySelector("#review-feedback");
  let accessCode;
  requestForm.addEventListener("submit", event => {
    event.preventDefault();
    submit(requestForm, async () => {
      await api("/feedback", { token: invitation, code: accessCode, note: requestForm.elements.note.value });
      requestForm.reset();
      return "Change request sent to the creator.";
    });
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    submit(form, async () => {
      const version = await api("/review", { token: invitation, code: form.elements.code.value });
      const bytes = new TextEncoder().encode(version.title + "\n\n" + version.terms);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      if (fingerprint !== version.fingerprint) throw new Error("The shared text does not match its fingerprint.");
      setDownload(document.querySelector("#download-review"), version);
      accessCode = form.elements.code.value;
      requestForm.hidden = false;
      form.reset();
      form.hidden = true;
      review.querySelector("h2").textContent = version.title;
      review.querySelector("pre").textContent = version.terms;
      review.querySelector("output").textContent = `Shared revision ${version.revision}. SHA-256: ${version.fingerprint}`;
      return "";
    });
  });
} else if (!query.has("id")) {
  workspace.hidden = false;
  loadDrafts().catch(error => { draftForm.querySelector("output").textContent = error.message; });
}

draftForm.elements.saved.addEventListener("change", event => openDraft(event.target.value));
draftForm.addEventListener("submit", event => {
  event.preventDefault();
  submit(draftForm, async () => {
    const { title, terms } = draftForm.elements;
    if (!workspaceKey && !drafts.length) rememberKey(newWorkspaceKey());
    const saved = await api("", { id: current?.id, revision: current?.revision, title: title.value, terms: terms.value });
    await loadDrafts(saved.id);
    return "Private draft saved.";
  });
});

const templatePicker = document.querySelector("#draft-template");
const templates = {
  services: ["Service agreement", "Parties\n[Client] and [Service provider]\n\nServices and deliverables\n[Describe the work and what will be delivered.]\n\nSchedule\n[Set due dates and review periods.]\n\nFees and payment\n[State the price, currency and payment dates.]\n\nAcceptance\n[Describe how both parties will approve the work.]"],
  project: ["Project scope", "Objective\n[State the outcome.]\n\nIncluded work\n[List deliverables.]\n\nExcluded work\n[List what is outside scope.]\n\nResponsibilities and deadlines\n[Name the owner and date for each milestone.]\n\nReview\n[Explain how changes and approvals work.]"],
  amendment: ["Agreement amendment", "Original agreement\n[Identify the agreement and version.]\n\nEffective date\n[Enter the date.]\n\nChanges\n[List each replacement or addition.]\n\nRemaining terms\n[State which existing terms still apply.]"],
};

templatePicker.addEventListener("change", () => {
  const template = templates[templatePicker.value];
  templatePicker.value = "";
  if (!template) return;
  const { title, terms } = draftForm.elements;
  if ((title.value || terms.value) && !confirm("Replace the text in the editor with this template?")) return;
  [title.value, terms.value] = template;
  title.dispatchEvent(new Event("input", { bubbles: true }));
  title.focus();
});

draftForm.addEventListener("input", event => {
  if ([draftForm.elements.title, draftForm.elements.terms].includes(event.target)) {
    invite.hidden = true;
    document.querySelector("#draft-record").hidden = true;
    document.querySelector("#draft-revision").textContent = "Unsaved changes";
    setDownload(document.querySelector("#download-draft"), null);
    clearLink();
  }
});

invite.addEventListener("submit", event => {
  event.preventDefault();
  submit(invite, async () => {
    clearLink();
    if (!current) throw new Error("Save your draft first.");
    const { token, code } = await api("/share", { id: current.id, revision: current.revision });
    const url = new URL("/", location.origin);
    url.hash = new URLSearchParams({ invite: token }).toString();
    invite.elements.link.value = url.href;
    invite.elements.link.hidden = false;
    invite.elements.access.value = code;
    invite.elements.access.hidden = false;
    copy.hidden = false;
    return "Invitation ready. It expires in seven days.";
  });
});

copy.addEventListener("click", () => {
  navigator.clipboard.writeText(`Agreement link: ${invite.elements.link.value}\nAccess code: ${invite.elements.access.value}`).then(() => {
    inviteStatus.textContent = "Link and access code copied.";
  }).catch(() => {
    invite.elements.link.select();
    inviteStatus.textContent = "Copy the link and access code from the fields above.";
  });
});

document.querySelector("#revoke-invites").addEventListener("click", () => {
  submit(invite, async () => {
    if (!current) throw new Error("Open a saved draft first.");
    await api("/revoke", { id: current.id });
    clearLink();
    return "Invitations revoked.";
  });
});

const recoveryDialog = document.querySelector("#recovery-dialog");
document.querySelector("#open-recovery").addEventListener("click", () => recoveryDialog.showModal());
document.querySelector("#close-recovery").addEventListener("click", () => recoveryDialog.close());
recoveryDialog.addEventListener("close", () => {
  recoveryField.value = "";
  recoveryField.hidden = true;
  restoreForm.reset();
});
const recoveryField = document.querySelector("#workspace-key");
document.querySelector("#show-workspace-key").addEventListener("click", () => {
  recoveryField.value = workspaceKey ?? "Save a new draft or move your existing drafts first.";
  recoveryField.hidden = false;
  recoveryField.select();
});

const restoreForm = document.querySelector("#restore-workspace");
restoreForm.addEventListener("submit", event => {
  event.preventDefault();
  submit(restoreForm, async () => {
    const key = restoreForm.elements.recovery.value.trim().toLowerCase();
    if (!keyPattern.test(key)) throw new Error("Enter the 64-character recovery code.");
    const previous = workspaceKey;
    const records = await api("", undefined, key);
    if (!records.length) throw new Error("No saved drafts found for that code.");
    if (previous && previous !== key && !confirm("Open this workspace? Save your current recovery code first if you still need it.")) {
      return "Workspace kept.";
    }
    rememberKey(key);
    recoveryField.hidden = true;
    recoveryField.value = "";
    restoreForm.reset();
    await loadDrafts();
    return "Workspace opened.";
  });
});

document.querySelector("#move-legacy-drafts").addEventListener("click", () => {
  submit(draftForm, async () => {
    if (!confirm("Move your existing drafts to this browser’s recovery workspace? Save its code afterward.")) return "Drafts kept.";
    const key = workspaceKey ?? newWorkspaceKey();
    // Persist before the transfer so a dropped response cannot strand drafts.
    rememberKey(key);
    await api("/move", {}, key);
    await loadDrafts();
    return "Drafts moved. Save your recovery code under Workspace recovery.";
  });
});


const revisionPanel = document.querySelector("#draft-history");
const revisionStatus = document.querySelector("#revision-status");
const revisionList = document.querySelector("#revision-list");
const revisionMore = document.querySelector("#revision-more");
const revisionPreview = document.querySelector("#revision-preview");
let revisionCursor;
let revisionRequest = 0;

function openRevisionHistory(draft) {
  revisionRequest++;
  revisionPanel.hidden = !draft;
  revisionPanel.open = false;
  revisionList.replaceChildren();
  revisionPreview.hidden = true;
  setDownload(document.querySelector("#download-revision"), null);
  revisionMore.hidden = true;
  revisionCursor = null;
  revisionStatus.textContent = "";
}

async function loadRevisions(older = false) {
  const draft = current;
  if (!draft) return;
  const request = ++revisionRequest;
  revisionStatus.textContent = "Loading saved revisions…";
  revisionMore.disabled = true;
  try {
    const query = new URLSearchParams({ id: draft.id });
    if (older && revisionCursor !== null) query.set("before", String(revisionCursor));
    const data = await api("/revisions?" + query);
    if (current !== draft || request !== revisionRequest) return;
    if (!older) revisionList.replaceChildren();
    for (const revision of data.revisions) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button"; button.className = "secondary";
      button.textContent = "Open revision " + revision.revision + " · " + revision.title;
      button.addEventListener("click", () => showSavedRevision(draft, revision.revision));
      item.append(button); revisionList.append(item);
    }
    revisionCursor = data.nextBefore;
    revisionMore.hidden = revisionCursor === null;
    revisionStatus.textContent = data.revisions.length ? "Select a revision to read or download." : "No earlier saved revisions available.";
  } catch (error) {
    if (current === draft && request === revisionRequest) revisionStatus.textContent = error.message;
  } finally { revisionMore.disabled = false; }
}

async function showSavedRevision(draft, revision) {
  const request = ++revisionRequest;
  revisionPreview.hidden = true;
  setDownload(document.querySelector("#download-revision"), null);
  revisionStatus.textContent = "Opening saved revision…";
  try {
    const saved = await api("/revision?" + new URLSearchParams({ id: draft.id, revision }));
    const bytes = new TextEncoder().encode(saved.title + "\n\n" + saved.terms);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), b => b.toString(16).padStart(2, "0")).join("");
    if (hash !== saved.fingerprint) throw new Error("This revision failed its fingerprint check.");
    if (current !== draft || request !== revisionRequest) return;
    document.querySelector("#revision-title").textContent = saved.title;
    document.querySelector("#revision-meta").textContent = "Draft revision " + saved.revision + (saved.saved_at ? " · Saved " + new Date(saved.saved_at).toLocaleString() : " · Original save time unavailable");
    document.querySelector("#revision-terms").textContent = saved.terms;
    document.querySelector("#revision-fingerprint").textContent = "SHA-256: " + saved.fingerprint;
    setDownload(document.querySelector("#download-revision"), saved);
    revisionPreview.hidden = false;
    revisionStatus.textContent = "Saved revision opened. Your editor has not changed.";
  } catch (error) {
    if (current === draft && request === revisionRequest) revisionStatus.textContent = error.message;
  }
}
revisionPanel.addEventListener("toggle", () => {
  if (revisionPanel.open && !revisionList.children.length) loadRevisions();
});
revisionMore.addEventListener("click", () => loadRevisions(true));
