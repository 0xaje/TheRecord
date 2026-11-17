import { english, generateMnemonic } from "viem/accounts";
import { addressFromPublicKey, deriveCanonicalPqKey, deriveClassicalKey, signMessage } from "@qorechain/qoresign";
import { bytesToHex, createPublicClient, encodeFunctionData, hexToBytes, http, parseAbi } from "viem";

const abi = parseAbi([
  "function approvalData(bytes32,uint256,address) view returns (bytes)",
  "function approve(bytes32,uint256,address,bytes)",
  "error InvalidApproval()",
  "error InvalidVersion()",
]);

const keyStatusAbi = parseAbi([
  "function pqcKeyStatus(address) view returns (bool, uint8, bytes, bool)",
]);

export class SignerReadinessError extends Error {}

async function checkSignerReadiness(client, signerAddress) {
  let status;
  try {
    status = await client.readContract({
      address: "0x0000000000000000000000000000000000000a02",
      abi: keyStatusAbi,
      functionName: "pqcKeyStatus",
      args: [signerAddress],
    });
  } catch {
    throw new SignerReadinessError("Couldn’t check your signing key on Diana. Try again.");
  }
  const [registered, algorithm, publicKey, possessionProven] = status;
  if (!registered) throw new SignerReadinessError("Set up your signing key on Diana before approving.");
  if (algorithm !== 1 || publicKey.length !== 2 + 2592 * 2) {
    throw new SignerReadinessError("This signer needs a registered ML-DSA-87 key on Diana.");
  }
  if (!possessionProven) {
    throw new SignerReadinessError("Your signing key is registered. Complete proof of possession before approving.");
  }
}

function signerToHex(signer) {
  if (!/^qor1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$/.test(signer)) {
    throw new Error("QoreX did not return a valid Diana account.");
  }
  const alphabet3 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const bits = Array.from(signer.slice(4, -6), (char) => alphabet3.indexOf(char).toString(2).padStart(5, "0")).join("");
  return "0x" + BigInt("0b" + bits).toString(16).padStart(40, "0");
}
export function deriveSigner(mnemonic) {
  const classicalKey = deriveClassicalKey({ mnemonic });
  const { bech32: signer } = addressFromPublicKey(classicalKey.publicKey, "secp256k1");
  const derivedAddress = signerToHex(signer);
  return { classicalKey, signer, derivedAddress };
}

export function generateTestSigner() {
  const mnemonic = generateMnemonic(english, 256);
  const { signer, derivedAddress } = deriveSigner(mnemonic);
  const file = new Blob([mnemonic, "\n"], { type: "text/plain" });
  return { signer, derivedAddress, file };
}

export async function submitApproval({ rpcUrl, contract, id, version, fingerprint, signerAddress, keyFile, useQoreX = false, onSubmitted }) {
  const wallet = window.ethereum;
  if (!wallet?.request) throw new Error("Open this page in a browser with a compatible wallet.");
  const client = createPublicClient({ transport: http(rpcUrl, { timeout: 15000 }) });
  const [from] = await wallet.request({ method: "eth_requestAccounts" });
  const [walletChain, rpcChain] = await Promise.all([
    wallet.request({ method: "eth_chainId" }),
    client.getChainId(),
  ]);
  if (!from || BigInt(walletChain) !== 9800n || rpcChain !== 9800) {
    throw new Error("Connect your wallet on Diana Testnet.");
  }

  const chainId = "qorechain-diana";
  let native;
  let walletSigner;
  if (useQoreX) {
    native = window.qorex?.native;
    if (!native?.capabilities?.includes("signArbitrary") || typeof native.signArbitrary !== "function") {
      throw new Error("Update QoreX to a build that supports message signing.");
    }
    await native.enable(chainId);
    ({ bech32Address: walletSigner } = await native.getKey(chainId));
    signerAddress = signerToHex(walletSigner);
    if (signerAddress !== from.toLowerCase()) {
      throw new Error("Select the same Diana account in QoreX and your EVM wallet.");
    }
  }
  const payload = await client.readContract({
    address: contract, abi, functionName: "approvalData", args: [id, version, signerAddress],
  });
  const data = hexToBytes(payload);
  if (data.length !== 224 || bytesToHex(data.slice(160, 192)) !== "0x" + fingerprint) {
    throw new Error("The recorded fingerprint changed. Verify your file again.");
  }

  await checkSignerReadiness(client, signerAddress);
  let signed;
  if (useQoreX) {
    signed = await native.signArbitrary(chainId, walletSigner, data);
    if (signed?.signatureType !== "ml-dsa-87-hybrid" || signed.pq?.algorithmId !== 1) {
      throw new Error("QoreX did not return an ML-DSA-87 signature.");
    }
  } else {
    const mnemonic = (await keyFile.text()).trim();
    const { classicalKey, signer, derivedAddress } = deriveSigner(mnemonic);
    if (derivedAddress !== signerAddress.toLowerCase()) throw new Error("The key file belongs to a different signer.");
    const pqKey = deriveCanonicalPqKey({ mnemonic, address: signer });
    signed = signMessage({ chainId: chainId, signer, data, classicalKey, pqKey });
  }
  const bytes = Uint8Array.from(atob(signed.pq?.signature ?? ""), char => char.charCodeAt(0));
  if (bytes.length !== 4627) throw new Error("Could not create the ML-DSA-87 approval.");

  const args = [id, version, signerAddress, bytesToHex(bytes)];
  await client.simulateContract({ address: contract, abi, functionName: "approve", account: from, args });
  if (BigInt(await wallet.request({ method: "eth_chainId" })) !== 9800n) {
    throw new Error("Switch your wallet back to Diana Testnet.");
  }
  const hash = await wallet.request({
    method: "eth_sendTransaction",
    params: [{ from, to: contract, data: encodeFunctionData({ abi, functionName: "approve", args }), value: "0x0" }],
  });
  onSubmitted(hash);
  const receipt = await client.waitForTransactionReceipt({ hash, timeout: 60000 });
  if (receipt.status !== "success") throw new Error("Diana rejected the approval transaction.");
  return hash;
}
