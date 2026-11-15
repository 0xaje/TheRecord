import "./private-agreements.js";
import { generateTestSigner, submitApproval } from "./approve.js";
import { registerSigner } from "./register.js";

const contract = "0x25721b3be0f24438da7daed4c800b073ef9bb802";
const rpcUrl = "https://evm-testnet.qore.host";
const versionSelector = "0xaf904a06";
const zeroFingerprint = "0".repeat(64);

async function rpc(method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Diana RPC unavailable");
  const { result, error } = await response.json();
  if (error || result == null) throw new Error("Diana RPC call failed");
  return result;
}

const toHex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");

const form = document.querySelector("#verify");
const output = form.querySelector("output");
const button = form.querySelector("button");
const approvalStatus = document.querySelector("#approval-status");
const approvalSection = document.querySelector("#approval");
let verifiedVersion;
let reviewRevision = 0;
form.addEventListener("input", () => {
  reviewRevision += 1;
  approvalStatus.hidden = true;
  approvalSection.hidden = true;
  verifiedVersion = undefined;
  output.textContent = "";
});
const query = new URLSearchParams(location.search);
form.elements.id.value = query.get("id") ?? "";
form.elements.version.value = query.get("version") ?? "1";

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const revision = ++reviewRevision;
  approvalStatus.hidden = true;
  approvalSection.hidden = true;
  verifiedVersion = undefined;
  const { id, version, file } = form.elements;
  const selectedFile = file.files[0];
  const agreementId = id.value;
  const versionWord = BigInt(version.value).toString(16);
  if (versionWord.length > 64) {
    output.textContent = "Enter a smaller version number.";
    return;
  }

  button.disabled = true;
  output.textContent = "Checking Diana…";
  try {
    if (await rpc("eth_chainId", []) !== "0x2648") throw new Error("Unexpected network");
    const data = versionSelector + agreementId.slice(2) + versionWord.padStart(64, "0");
    const record = await rpc("eth_call", [{ to: contract, data }, "latest"]);
    if (!/^0x[0-9a-fA-F]{192}$/.test(record)) throw new Error("Unexpected response");
    if (revision !== reviewRevision) return;
    const fingerprint = record.slice(2, 66).toLowerCase();
    if (fingerprint === zeroFingerprint) {
      output.textContent = "Agreement version not found.";
      return;
    }
    const digest = await crypto.subtle.digest("SHA-256", await selectedFile.arrayBuffer());
    const local = toHex(new Uint8Array(digest));
    if (revision !== reviewRevision) return;
    const approvals = BigInt("0x" + record.slice(66, 130));
    const finalizedWord = BigInt("0x" + record.slice(130));
    if (approvals > 3n || finalizedWord !== (approvals === 3n ? 1n : 0n)) {
      throw new Error("Unexpected approval state");
    }
    const finalized = finalizedWord === 1n;
    const count = approvals === 0n ? 0 : finalized ? 2 : 1;
    approvalStatus.textContent = finalized
      ? "Finalized · 2 of 2 approvals recorded"
      : `Awaiting approval · ${count} of 2 approvals recorded`;
    approvalStatus.hidden = false;
    if (local === fingerprint && !finalized) {
      verifiedVersion = { id: agreementId, version: BigInt("0x" + versionWord), fingerprint };
      approvalSection.hidden = false;
    }
    output.textContent = local === fingerprint
      ? (finalized ? "File matches the finalized version." : "File matches. This version is awaiting approval.")
      : "File does not match this version.";
  } catch {
    if (revision !== reviewRevision) return;
    output.textContent = "Could not verify this file. Check your connection and try again.";
  } finally {
    button.disabled = false;
  }
});

const createForm = document.querySelector("#create");
const createOutput = createForm.querySelector("output");
const proposedTopic = "0x47167e70ffc8009028dd96fc5952ba8a012a6592c3582840ae312bdb5b416887";

createForm.addEventListener("submit", async event => {
  event.preventDefault();
  const first = createForm.elements.first.value.toLowerCase();
  const second = createForm.elements.second.value.toLowerCase();
  const file = createForm.elements.document.files[0];
  const word = address => address.slice(2).padStart(64, "0");
  if (first === second || [first, second].includes("0x" + "0".repeat(40))) {
    createOutput.textContent = "Enter two distinct signer addresses.";
    return;
  }
  const salt = toHex(crypto.getRandomValues(new Uint8Array(32)));
  await submitProposal(createForm, file, "0xb9fd4b6d" + salt + word(first) + word(second));
});

const amendForm = document.querySelector("#amend");
amendForm.elements.id.value = document.querySelector("#verify").elements.id.value;
amendForm.addEventListener("submit", async event => {
  event.preventDefault();
  const id = amendForm.elements.id.value.toLowerCase();
  await submitProposal(amendForm, amendForm.elements.document.files[0], "0x26283cc7" + id.slice(2), id);
});

async function submitProposal(form, file, prefix, id) {
  const createOutput = form.querySelector("output");
  const createButton = form.querySelector("button");
  const [transactionLink, agreementLink] = form.querySelectorAll("a");
  const wallet = window.ethereum;
  if (!wallet?.request) {
    createOutput.textContent = "Open this page in a browser with a compatible wallet.";
    return;
  }
  createButton.disabled = true;
  transactionLink.hidden = true;
  agreementLink.hidden = true;
  let hash;
  try {
    createOutput.textContent = "Preparing your file fingerprint…";
    const fingerprint = toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())));
    const [from] = await wallet.request({ method: "eth_requestAccounts" });
    if (!from) throw new Error("Select a wallet account and try again.");
    const [walletChain, rpcChain] = await Promise.all([
      wallet.request({ method: "eth_chainId" }),
      rpc("eth_chainId", []),
    ]);
    if (BigInt(walletChain) !== 9800n || BigInt(rpcChain) !== 9800n) {
      throw new Error("Switch your wallet to Diana Testnet (9800).");
    }

    const data = prefix + fingerprint;
    if (id) {
      try {
        await rpc("eth_call", [{ from, to: contract, data }, "latest"]);
      } catch {
        throw new Error("Could not prepare the amendment. Use the original proposer’s wallet, check that the latest version is finalized, and select a changed file.");
      }
    }
    createOutput.textContent = "Review and confirm the transaction in your wallet.";
    hash = await wallet.request({
      method: "eth_sendTransaction",
      params: [{ from, to: contract, data, value: "0x0" }],
    });
    transactionLink.href = "https://dashboard.qorechain.io/explorer/tx/" + hash;
    transactionLink.hidden = false;
    createOutput.textContent = "Transaction submitted. Waiting for Diana…";

    let receipt;
    for (let attempt = 0; attempt < 12 && !receipt; attempt++) {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) break;
      const result = await response.json();
      if (result.error) break;
      receipt = result.result;
      if (!receipt) await new Promise(resolve => setTimeout(resolve, 2500));
    }
    if (!receipt) throw new Error("Confirmation is still pending. Check the transaction link before retrying.");
    if (receipt.status !== "0x1") throw new Error("Diana rejected the transaction.");
    const proposed = receipt.logs.find(log => log.address.toLowerCase() === contract.toLowerCase()
      && log.topics[0] === proposedTopic && log.data.toLowerCase() === "0x" + fingerprint
      && /^0x[0-9a-f]{64}$/i.test(log.topics[1]) && /^0x[0-9a-f]{64}$/i.test(log.topics[2])
      && (id ? log.topics[1] === id && BigInt(log.topics[2]) > 1n : BigInt(log.topics[2]) === 1n));
    if (!proposed) throw new Error("Diana confirmed the transaction. The agreement event could not be verified.");
    const version = BigInt(proposed.topics[2]).toString();
    const link = new URL(location.href);
    link.search = new URLSearchParams({ id: proposed.topics[1], version }).toString();
    agreementLink.href = link.href;
    agreementLink.hidden = false;
    createOutput.textContent = `Version ${version} is awaiting both approvals.`;
  } catch (error) {
    createOutput.textContent = error.code === 4001
      ? "You declined the wallet request."
      : hash ? (error.name === "TimeoutError" ? "Check the transaction link for confirmation before retrying." : error.message)
        : (error.shortMessage ?? error.message ?? "Could not submit the transaction.");
  } finally {
    createButton.disabled = false;
  }
}


const approveForm = document.querySelector("#approve");
approveForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!verifiedVersion) return;
  const approval = verifiedVersion;
  const submit = approveForm.querySelector("button");
  const status = approveForm.querySelector("output");
  const link = approveForm.querySelector("a");
  const signerAddress = approveForm.elements.signer.value.toLowerCase();
  const keyFile = approveForm.elements.key.files[0];
  submit.disabled = true;
  link.hidden = true;
  status.textContent = "Checking your approval on Diana…";
  try {
    await submitApproval({
      rpcUrl, contract, ...approval, signerAddress, keyFile,
      onSubmitted(hash) {
        link.href = "https://dashboard.qorechain.io/explorer/tx/" + hash;
        link.hidden = false;
        status.textContent = "Approval submitted. Waiting for Diana…";
      },
    });
    status.textContent = "Approval confirmed. Verify the file again to refresh its status.";
  } catch (error) {
    if (!link.hidden) {
      status.textContent = "Check the transaction link for the outcome before retrying.";
    } else if (error.code === 4001) {
      status.textContent = "You declined the wallet request.";
    } else {
      const details = [error.message, error.data?.message, error.cause?.message];
      const authorizationFailure = details.some(detail =>
        /EVM authorization window/i.test(detail ?? "")
      );
      status.textContent = authorizationFailure
        ? "Diana could not submit this approval. Check the EVM authorization window for the sending account in QoreX."
        : "Could not submit approval. Check your signer, key file, and Diana wallet.";
    }
  } finally {
    approveForm.elements.key.value = "";
    submit.disabled = false;
  }
});

const downloadSigner = document.querySelector("#download-signer");
const signerStatus = document.querySelector("#signer-status");

document.querySelector("#generate-signer").addEventListener("click", () => {
  try {
    const { signer, derivedAddress, file } = generateTestSigner();
    if (!downloadSigner.hidden) URL.revokeObjectURL(downloadSigner.href);
    downloadSigner.href = URL.createObjectURL(file);
    downloadSigner.download = `the-record-${signer}.secret`;
    downloadSigner.hidden = false;
    signerStatus.textContent = `Public signer address: ${derivedAddress}. Diana funding address: ${signer}. Fund this test account and register its signing key on Diana before using it to approve.`;
  } catch {
    signerStatus.textContent = "Could not generate a test signing file.";
  }
});

const registerForm = document.querySelector("#register-signer");
registerForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = registerForm.querySelector("button");
  const status = registerForm.querySelector("output");
  const link = registerForm.querySelector("a");
  button.disabled = true;
  link.hidden = true;
  status.textContent = "Checking your test account on Diana…";
  try {
    await registerSigner(registerForm.elements.key.files[0], registerForm.elements.address.value, hash => {
      link.href = "https://dashboard.qorechain.io/explorer/tx/" + hash;
      link.hidden = false;
      status.textContent = "Registration sent. Waiting for Diana…";
    });
    status.textContent = "Signing key registration confirmed on Diana.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    registerForm.elements.key.value = "";
    button.disabled = false;
  }
});

document.querySelector("#agreement-navigation").addEventListener("click", event => {
  const href = event.target.closest("a")?.getAttribute("href");
  if (!href?.startsWith("#")) return;
  const section = document.getElementById(href.slice(1));
  if (!section) return;
  event.preventDefault();
  if (section instanceof HTMLDetailsElement) section.open = true;
  section.tabIndex = -1;
  section.focus({ preventScroll: true });
  section.scrollIntoView();
});
