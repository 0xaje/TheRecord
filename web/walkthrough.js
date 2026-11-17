const explorer = "https://dashboard.qorechain.io/explorer/tx/";
const evidenceLog = "https://github.com/0xaje/TheRecord/blob/main/docs/diana-evidence.md";
const chapters = [
  {
    title: "Agree on the terms.",
    description: "Two people review a delivery agreement. Both need the same file before they approve a version.",
    context: "Review and agree",
    visual: '<p class="eyebrow">How it works</p><div class="story-pair"><div class="story-card"><strong>Client</strong><p>Deliver one draft by <mark>Friday</mark>.</p><p>Save the revision and send its review invitation.</p></div><div class="story-card"><strong>Freelancer</strong><p>Read the terms. Request changes if needed.</p><p>Download the revision both people agree to.</p></div></div>',
    evidence: "Private review and on-chain approval are separate steps. This illustration explains the review stage.",
    links: [["Open the workspace", "/#workspace"]]
  },
  {
    title: "Give this version a record.",
    description: "The Record fingerprints the file and records it with two signer addresses on QoreChain Diana Testnet.",
    context: "Record on Diana",
    visual: '<p class="eyebrow">How it works</p><div class="story-card"><strong>agreement-v1.txt</strong><p>Deliver one draft by Friday.</p></div><div class="story-pair"><div class="story-card good"><strong>Recorded on Diana</strong><p>File fingerprint · version 1 · two signer addresses</p></div><div class="story-card"><strong>Keep your document</strong><p>The agreement contract stores the fingerprint. Keep the agreed file so you can check it later.</p></div></div>',
    evidence: "The public demo uses an existing agreement on Diana. Recording does not complete either party’s approval.",
    links: [["Inspect the evidence log", evidenceLog], ["Open Record", "/#create-title"]]
  },
  {
    title: "Both people approve.",
    description: "Each party verifies the file, then approves through their own QoreX account on Diana Testnet. Both approvals must refer to the same version.",
    context: "Approve through QoreX",
    visual: '<p class="eyebrow">Approval sequence explained</p><div class="story-pair"><div class="story-card"><strong>1 of 2 approvals</strong><p>One signer has approved.</p><p>Awaiting the other signer.</p></div><div class="story-card good"><strong>2 of 2 approvals</strong><p>Both designated signers approved this version.</p><p>Diana records finalization.</p></div></div><p>QoreX signs the approval message. The contract checks its ML-DSA-87 signature using Diana’s PQC verifier.</p>',
    evidence: "The sequence above explains the states. The linked receipt is the recorded final approval for the demo’s version 1.",
    links: [["View finalization receipt", explorer + "0xb8b3895071b1ef1f9afbf665b52482b277ee312dfac5f090117ac50479927487"]]
  },
  {
    title: "The original matches.",
    description: "Select the original file and version 1. The verifier hashes the file in your browser and compares it with the fingerprint on Diana.",
    context: "Original file · version 1",
    visual: '<p class="eyebrow">Recorded laptop result</p><img class="story-shot" src="/demo/original-match.png" alt="Original file matches finalized version 1, with two of two approvals recorded"><div class="story-card good"><strong>File matches the finalized version.</strong><p>The selected file matches the approved fingerprint for this version.</p></div>',
    evidence: "This screenshot is from the owner’s laptop test. You can repeat the check with the original sample in the demo.",
    links: [["Download original file", "/demo/agreement-v1.txt"], ["Open the live verifier", "/?id=0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e&version=1#verify-title"]]
  },
  {
    title: "Change one word. See the difference.",
    description: "The changed copy says Monday. Check it against version 1 and its Friday fingerprint. The verifier reports a mismatch.",
    context: "Changed copy · still version 1",
    visual: '<p class="eyebrow">Compare the two files</p><div class="story-pair"><div class="story-card good"><strong>Original file</strong><p>Deliver one draft by <mark>Friday</mark>.</p><p>Matches version 1.</p></div><div class="story-card bad"><strong>Changed copy</strong><p>Deliver one draft by <mark>Monday</mark>.</p><p>Does not match version 1.</p></div></div><img class="story-shot" src="/demo/changed-mismatch.png" alt="Changed file selected against version 1, showing file does not match this version">',
    evidence: "The mismatch screenshot uses the same agreement and version as the original-file screenshot. The recorded version remains finalized.",
    links: [["Download changed file", "/demo/agreement-v2.txt"], ["Test it against version 1", "/?id=0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e&version=1#verify-title"]]
  },
  {
    title: "A new version needs fresh consent.",
    description: "To agree to Monday, propose an amendment. Both parties approve version 2. You can still check the Friday file against version 1.",
    context: "Amend and preserve the history",
    visual: '<p class="eyebrow">Recorded amendment outcome explained</p><div class="story-pair"><div class="story-card good"><strong>Version 1 · Friday</strong><p>Finalized with its original approvals.</p><p>The original file still matches version 1.</p></div><div class="story-card good"><strong>Version 2 · Monday</strong><p>Finalized after two fresh approvals.</p><p>The changed file matches version 2.</p></div></div><p>Each version has its own fingerprint and approval state on QoreChain Diana Testnet.</p>',
    evidence: "The evidence log records version 2 finalization and the earlier version remaining verifiable. The receipt below emitted the final approval and Finalized event for version 2.",
    links: [["View amendment finalization", explorer + "0xd59158244fd94d9b2a83d9d7d1693fe56887704409538f9c396cb99c3230af70"], ["Read the full evidence", evidenceLog]]
  }
];

const chapterButtons = [...document.querySelectorAll("[data-chapter]")];
const previous = document.querySelector("#chapter-back");
const next = document.querySelector("#chapter-next");
let current = 0;

function displayChapter(index, focus = false) {
  current = Math.max(0, Math.min(chapters.length - 1, index));
  const chapter = chapters[current];
  const title = document.querySelector("#chapter-title");
  title.textContent = chapter.title;
  document.querySelector("#chapter-description").textContent = chapter.description;
  document.querySelector("#chapter-count").textContent = "Step " + (current + 1) + " of " + chapters.length;
  document.querySelector("#chapter-context").textContent = chapter.context;
  document.querySelector("#chapter-progress").value = current + 1;
  document.querySelector("#chapter-visual").innerHTML = chapter.visual;
  document.querySelector("#chapter-evidence").textContent = chapter.evidence;
  const links = document.querySelector("#chapter-links");
  links.replaceChildren();
  for (const [label, href] of chapter.links) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    if (href.startsWith("/demo/agreement-")) link.download = href.split("/").pop();
    links.append(link);
  }
  chapterButtons.forEach((button, position) => {
    if (position === current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  previous.disabled = current === 0;
  next.disabled = current === chapters.length - 1;
  if (focus) title.focus({ preventScroll: true });
}

for (const button of chapterButtons) {
  button.addEventListener("click", () => displayChapter(Number(button.dataset.chapter), true));
}
previous.addEventListener("click", () => displayChapter(current - 1, true));
next.addEventListener("click", () => displayChapter(current + 1, true));
displayChapter(0);
