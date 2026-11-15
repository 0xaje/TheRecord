const query = new URLSearchParams(location.search);
const invitation = new URLSearchParams(location.hash.slice(1)).get("invite");
const workspace = document.querySelector("#workspace");
const review = document.querySelector("#review");
const draftForm = document.querySelector("#draft");
const invite = document.querySelector("#invite");
const inviteStatus = invite.querySelector("output");
const copy = document.querySelector("#copy-invite");
let drafts = [];
let current;

async function api(path = "", body) {
  const response = await fetch("/api/drafts" + path, body === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
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
  setDownload(document.querySelector("#download-draft"), current);
  clearLink();
  inviteStatus.textContent = "";
}

async function loadDrafts(id) {
  drafts = await api();
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
  form.addEventListener("submit", event => {
    event.preventDefault();
    submit(form, async () => {
      const version = await api("/review", { token: invitation, code: form.elements.code.value });
      const bytes = new TextEncoder().encode(version.title + "\n\n" + version.terms);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      if (fingerprint !== version.fingerprint) throw new Error("The shared text does not match its fingerprint.");
      setDownload(document.querySelector("#download-review"), version);
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
    const saved = await api("", { id: current?.id, revision: current?.revision, title: title.value, terms: terms.value });
    await loadDrafts(saved.id);
    return "Private draft saved.";
  });
});

draftForm.addEventListener("input", event => {
  if (event.target !== draftForm.elements.saved) {
    invite.hidden = true;
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
