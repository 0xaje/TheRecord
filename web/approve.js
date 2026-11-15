import { english, generateMnemonic } from "viem/accounts";
import { addressFromPublicKey, deriveCanonicalPqKey, deriveClassicalKey, signMessage } from "@qorechain/qoresign";
import { bytesToHex, createPublicClient, encodeFunctionData, hexToBytes, http, parseAbi } from "viem";

const abi = parseAbi([
  "function approvalData(bytes32,uint256,address) view returns (bytes)",
  "function approve(bytes32,uint256,address,bytes)",
  "error InvalidApproval()",
  "error InvalidVersion()",
]);

export function deriveSigner(mnemonic) {
  const classicalKey = deriveClassicalKey({ mnemonic });
  const { bech32: signer } = addressFromPublicKey(classicalKey.publicKey, "secp256k1");
  const alphabet = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const bits = Array.from(signer.slice(4, -6), char => alphabet.indexOf(char).toString(2).padStart(5, "0")).join("");
  const derivedAddress = "0x" + BigInt("0b" + bits).toString(16).padStart(40, "0");
  return { classicalKey, signer, derivedAddress };
}

export function generateTestSigner() {
  const mnemonic = generateMnemonic(english, 256);
  const { signer, derivedAddress } = deriveSigner(mnemonic);
  const file = new Blob([mnemonic, "\n"], { type: "text/plain" });
  return { signer, derivedAddress, file };
}

export async function submitApproval({ rpcUrl, contract, id, version, fingerprint, signerAddress, keyFile, onSubmitted }) {
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

  const payload = await client.readContract({
    address: contract, abi, functionName: "approvalData", args: [id, version, signerAddress],
  });
  const data = hexToBytes(payload);
  if (data.length !== 224 || bytesToHex(data.slice(160, 192)) !== "0x" + fingerprint) {
    throw new Error("The recorded fingerprint changed. Verify your file again.");
  }

  const mnemonic = (await keyFile.text()).trim();
  const { classicalKey, signer, derivedAddress } = deriveSigner(mnemonic);
  if (derivedAddress !== signerAddress.toLowerCase()) throw new Error("The key file belongs to a different signer.");
  const pqKey = deriveCanonicalPqKey({ mnemonic, address: signer });
  const signed = signMessage({ chainId: "qorechain-diana", signer, data, classicalKey, pqKey });
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
