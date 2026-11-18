const explorer = "https://dashboard.qorechain.io/explorer/tx/";
const evidenceLog = "https://github.com/0xaje/TheRecord/blob/main/docs/diana-evidence.md";
const person = (role, file, text) => '<figure class="role-card"><div class="role-image"><img src="/assets/' + file + '.png" alt="' + role + ' illustration" width="144" height="144"></div><figcaption><strong>' + role + '</strong>' + text + '</figcaption></figure>';
const paper = (version, day, status) => '<div class="agreement-paper" role="img" aria-label="Illustrated delivery agreement, version ' + version + ', deliver by ' + day + '"><div class="paper-heading"><img src="/assets/document.png" alt="" width="56" height="56"><div><strong>Delivery agreement</strong><p>Version ' + version + '</p></div></div><p>Client and freelancer agree to one draft.</p><div class="paper-line"></div><p><b>Delivery date</b></p><p>Deliver one draft by <mark>' + day + '</mark>.</p><div class="paper-signers"><span>Client</span><span>Freelancer</span></div><span class="paper-status">' + status + '</span></div>';
const signer = (role, file, approved) => '<div class="signer-row"><img src="/assets/' + file + '.png" alt="" width="60" height="60"><div><b>' + role + '</b><span class="' + (approved ? 'approved-mark' : 'waiting-mark') + '">' + (approved ? '✓ Approval recorded' : '○ Awaiting approval') + '</span></div></div>';

const chapters = [
{"title": "Save a draft. Keep each revision.", "description": "Start with any two-party document agreement. Save your draft, then review it together before recording a file on QoreChain Diana Testnet.", "visual": "<p class=\"eyebrow\">Workspace steps illustrated</p><div class=\"story-pair\"><div class=\"story-card\"><img src=\"/assets/document.png\" width=\"56\" height=\"56\" alt=\"Document illustration\"><strong>Save the terms</strong><p>Give the agreement a title and save it in Drafts. A later save keeps a new private revision.</p></div><div class=\"story-card good\"><strong>Open Saved revisions</strong><p>View or download an earlier saved draft. Opening it does not replace your current editor text.</p></div></div><div class=\"story-card\"><strong>Two kinds of version</strong><p>Private draft revisions live in your workspace. An agreement version on QoreChain is created separately when you record its file fingerprint.</p></div>", "evidence": "These cards explain the workspace controls; they are not transaction receipts. Save your workspace recovery code before relying on the workspace. Earlier text overwritten before revision history was added cannot be reconstructed.", "links": [["Open Drafts", "/#workspace"]]},
  {
    title: "Agree on the terms.",
    description: "This example follows a client and freelancer. Any two parties can review terms this way. Both need the same file before they approve a version.",
    visual: '<p class="eyebrow">Illustrated review</p><div class="story-pair">' + person('Client', 'client', '<p>Deliver one draft by <mark>Friday</mark>.</p><p>Save the revision and share its review invitation.</p>') + person('Freelancer', 'freelancer', '<p>Read the terms. Request changes if needed.</p><p>Download the exact revision both people agree to.</p>') + '</div>',
    evidence: "Private review and on-chain approval are separate steps. This illustration explains the review stage.",
    links: [["Open the workspace", "/#workspace"]]
  },
  {
    title: "Give this version a record.",
    description: "The Record fingerprints the file and records it with two signer addresses on QoreChain Diana Testnet.",
    visual: '<p class="eyebrow">Illustrated document</p>' + paper('1', 'Friday', 'Ready to record') + '<div class="story-pair"><div class="story-card good"><strong>QoreChain Diana Testnet</strong><p>Records the fingerprint, version and two signer addresses.</p></div><div class="story-card"><strong>Keep the agreed file</strong><p>Use the exact file when approving and verifying later.</p></div></div>',
    evidence: "The public demo uses an existing agreement on Diana. Recording does not complete either party’s approval.",
    links: [["Inspect the evidence log", evidenceLog], ["Open Record", "/#create-title"]]
  },
  {
    title: "Both people approve.",
    description: "Each party verifies the file, then approves through their own QoreX account on Diana Testnet. Both approvals must refer to the same version.",
    visual: '<p class="eyebrow">Approval sequence illustrated</p><div class="approval-illustration"><div class="story-card"><strong>1 of 2 approvals</strong>' + signer('Client', 'client', true) + signer('Freelancer', 'freelancer', false) + '<p>Still awaiting the second signer.</p></div><div class="story-card good"><strong>2 of 2 approvals</strong>' + signer('Client', 'client', true) + signer('Freelancer', 'freelancer', true) + '<p>Diana finalizes this version.</p></div></div><p>Each person approves in QoreX. The contract checks the ML-DSA-87 approval using Diana’s PQC verifier.</p>',
    evidence: "The sequence above explains the states. The linked receipt is the recorded final approval for the demo’s version 1.",
    links: [["View finalization receipt", explorer + "0xb8b3895071b1ef1f9afbf665b52482b277ee312dfac5f090117ac50479927487"]]
  },
  {
    title: "The original matches.",
    description: "Select the original file and version 1. The verifier hashes the file in your browser and compares it with the fingerprint on Diana.",
    visual: '<p class="eyebrow">Recorded laptop result</p><figure class="evidence-preview"><a href="/demo/original-match.png"><img class="story-shot" src="/demo/original-match.png" alt="Original file matches finalized version 1 with two approvals"></a><figcaption><a href="/demo/original-match.png">View full match screenshot</a></figcaption></figure><div class="story-card good"><strong>File matches the finalized version.</strong><p>The selected file matches the approved fingerprint for version 1.</p></div>',
    evidence: "This screenshot is from the owner’s laptop test. You can repeat the check with the original sample in the demo.",
    links: [["Download original file", "/demo/agreement-v1.txt"], ["Open the live verifier", "/?id=0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e&version=1#verify-title"]]
  },
  {
    title: "Change one word. See the difference.",
    description: "The changed copy says Monday. Check it against version 1 and its Friday fingerprint. The verifier reports a mismatch.",
    visual: '<p class="eyebrow">Compare the two files</p><div class="story-pair"><div class="story-card good"><strong>Original file</strong><p>Deliver one draft by <mark>Friday</mark>.</p><p>Matches version 1.</p></div><div class="story-card bad"><strong>Changed copy</strong><p>Deliver one draft by <mark>Monday</mark>.</p><p>Does not match version 1.</p></div></div><figure class="evidence-preview"><a href="/demo/changed-mismatch.png"><img class="story-shot" src="/demo/changed-mismatch.png" alt="Changed copy does not match version 1"></a><figcaption><a href="/demo/changed-mismatch.png">View full mismatch screenshot</a></figcaption></figure>',
    evidence: "The mismatch screenshot uses the same agreement and version as the original-file screenshot. The recorded version remains finalized.",
    links: [["Download changed file", "/demo/agreement-v2.txt"], ["Test it against version 1", "/?id=0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e&version=1#verify-title"]]
  },
  {
    title: "A new version needs fresh consent.",
    description: "To agree to Monday, propose an amendment. Both parties approve version 2. You can still check the Friday file against version 1.",
    visual: '<p class="eyebrow">Version history illustrated</p><div class="story-pair">' + paper('1', 'Friday', 'Finalized · original approvals') + paper('2', 'Monday', 'Finalized · fresh approvals') + '</div><p>Check Friday against version 1 and Monday against version 2. QoreChain Diana Testnet preserves each recorded version’s fingerprint and approvals.</p>',
    evidence: "The evidence log records version 2 finalization and the earlier version remaining verifiable. The receipt below emitted the final approval and Finalized event for version 2.",
    links: [["View amendment finalization", explorer + "0xd59158244fd94d9b2a83d9d7d1693fe56887704409538f9c396cb99c3230af70"], ["Read the full evidence", evidenceLog]]
  },
{"title": "Read the agreement history.", "description": "Use History to inspect versions, approvals and finalization events recorded on QoreChain Diana Testnet. No wallet connection is needed for this lookup.", "visual": "<p class=\"eyebrow\">History illustrated</p><div class=\"story-pair\"><div class=\"story-card good\"><strong>Version 1</strong><p>Original fingerprint</p><p>Two designated approvals</p><p>Finalized on Diana</p></div><div class=\"story-card good\"><strong>Version 2</strong><p>Changed fingerprint</p><p>Two fresh approvals</p><p>Earlier version retained</p></div></div><div class=\"story-card\"><strong>Inspect the source</strong><p>Open a transaction in QoreChain Explorer. If a scan is incomplete, continue it before treating it as the full history.</p></div>", "evidence": "The diagram explains recorded states. History reads actual Diana events and checks them against a contract-state snapshot. Public versions are separate from private saved revisions.", "links": [["Open agreement history", "/history?id=0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e"], ["Read the Diana evidence", "https://github.com/0xaje/TheRecord/blob/main/docs/diana-evidence.md"]]},
{"title": "Manage drafts in Trash.", "description": "Move a saved draft to Trash when you no longer need it in your active list. Restore it later, or choose permanent deletion.", "visual": "<p class=\"eyebrow\">Draft controls illustrated</p><div class=\"story-pair\"><div class=\"story-card\"><strong>Trash and restore</strong><p>Saved revisions stay with the draft. Review invitations are revoked. Restore the draft and create a new invitation if you want to share again.</p></div><div class=\"story-card bad\"><strong>Delete permanently</strong><p>Inside Trash, choose Delete permanently and type DELETE. This removes the draft, saved revisions, invitations and feedback from the live database.</p></div></div><div class=\"story-card\"><strong>QoreChain records remain</strong><p>Deleting a private draft does not erase Diana fingerprints or approval history. Downloaded copies remain too. Hosting backup erasure has not been verified.</p></div>", "evidence": "The owner confirmed phone Trash, restore and permanent deletion worked. Backend regression evidence is linked below. Nothing is automatically purged; permanent deletion cannot be restored.", "links": [["Open the workspace", "/#workspace"], ["Inspect backend evidence", "https://github.com/0xaje/TheRecord/blob/main/docs/audit/2026-11-18/review.md"]]},
{"title": "Keep your files and recovery code.", "description": "Keep a copy of each agreed file and save your workspace recovery code somewhere private. They serve different purposes.", "visual": "<p class=\"eyebrow\">Recovery checklist illustrated</p><div class=\"story-pair\"><div class=\"story-card good\"><img src=\"/assets/document.png\" width=\"56\" height=\"56\" alt=\"Document illustration\"><strong>Your agreed files</strong><p>The fingerprint on QoreChain lets you check a copy. It cannot recreate a lost document.</p></div><div class=\"story-card\"><strong>Your workspace recovery code</strong><p>Use Workspace recovery to show and save your code, or open your existing drafts on another device. Anyone holding it can access that workspace.</p></div></div><div class=\"story-card\"><strong>Keep wallet secrets separate</strong><p>A workspace recovery code is not a wallet recovery phrase. Never send either one to another person or paste it into a review invitation.</p></div>", "evidence": "If browser storage is blocked, public file verification can still work, but the workspace stops saves that could leave you with an unsaved recovery identity. Private drafts are stored on the service and are not end-to-end encrypted.", "links": [["Open workspace recovery", "/#workspace"], ["Read privacy and recovery details", "/blog#privacy"]]}
];



const chapterLinks = [...document.querySelectorAll('.chapter-list a')];
const chapterContainer = document.querySelector('#story-chapters');
const sections = chapters.map((chapter, index) => {
  const section = document.createElement('section');
  section.className = 'chapter-panel';
  section.id = 'chapter-' + (index + 1);
  section.setAttribute('aria-labelledby', 'chapter-title-' + index);
  section.innerHTML = '<header class="chapter-heading"><p class="eyebrow">Step ' + (index + 1) + ' of ' + chapters.length + '</p><h2 id="chapter-title-' + index + '">' + chapter.title + '</h2><p>' + chapter.description + '</p></header><div class="story-visual">' + chapter.visual + '</div>';
  const evidence = document.createElement('details');
  evidence.className = 'story-evidence';
  const summary = document.createElement('summary');
  summary.textContent = 'Evidence and next actions';
  evidence.append(summary);
  const explanation = document.createElement('p');
  explanation.textContent = chapter.evidence;
  evidence.append(explanation);
  for (const [label, href] of chapter.links) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    if (href.startsWith('/demo/agreement-')) link.download = href.split('/').pop();
    evidence.append(link);
  }
  section.append(evidence);
  chapterContainer.append(section);
  return section;
});

const chapterMenu = document.querySelector('#chapter-menu-toggle');
const chapterNavigation = document.querySelector('#walkthrough-chapters');
function closeChapterMenu() {
  chapterNavigation.removeAttribute('data-open');
  chapterMenu.setAttribute('aria-expanded', 'false');
}
chapterMenu.addEventListener('click', () => {
  const open = chapterNavigation.toggleAttribute('data-open');
  chapterMenu.setAttribute('aria-expanded', String(open));
});
chapterNavigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeChapterMenu();
});
chapterNavigation.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeChapterMenu();
    chapterMenu.focus();
  }
});
window.matchMedia('(max-width: 760px)').addEventListener('change', closeChapterMenu);

function markChapter(id) {
  for (const link of chapterLinks) {
    if (link.hash === '#' + id) {
      link.setAttribute('aria-current', 'location');
      chapterMenu.textContent = 'Step ' + id.split('-')[1] + ' of ' + chapters.length + ' · ' + link.textContent;
    }
    else link.removeAttribute('aria-current');
  }
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) markChapter(entry.target.id);
  }
}, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
sections.forEach(section => observer.observe(section));
markChapter(sections[0].id);
