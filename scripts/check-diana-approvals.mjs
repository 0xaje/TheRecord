import assert from "node:assert/strict";
import {
  BaseError, ContractFunctionRevertedError, createPublicClient,
  decodeFunctionData, http, parseAbi,
} from "viem";

const client = createPublicClient({ transport: http(
  process.env.DIANA_RPC_URL ?? "https://evm-testnet.qore.host",
  { timeout: 20000 },
) });
const address = "0x25721b3be0f24438da7daed4c800b073ef9bb802";
const abi = parseAbi([
  "function approve(bytes32 id, uint256 version, address signer, bytes signature)",
  "function getVersion(bytes32 id, uint256 version) view returns (bytes32, uint8, bool)",
  "error InvalidApproval()",
]);
const v1Hash = "0xb8b3895071b1ef1f9afbf665b52482b277ee312dfac5f090117ac50479927487";
const v2Hash = "0x5a4b0020a0a0d8980e63d7045b23594d24b6eb648fb7d8c3c6f23649096bf8b2";

assert.equal(await client.getChainId(), 9800);
const [v1, v2, receipt] = await Promise.all([
  client.getTransaction({ hash: v1Hash }),
  client.getTransaction({ hash: v2Hash }),
  client.getTransactionReceipt({ hash: v2Hash }),
]);
assert.equal(receipt.status, "success");
for (const tx of [v1, v2]) assert.equal(tx.to.toLowerCase(), address.toLowerCase());
const [id, oldVersion, oldSigner, oldSignature] = decodeFunctionData({ abi, data: v1.input }).args;
const [amendedId, version, signer, signature] = decodeFunctionData({ abi, data: v2.input }).args;
assert.equal(id, amendedId);
assert.equal(oldVersion, 1n);
assert.equal(version, 2n);
const before = receipt.blockNumber - 1n;
const after = receipt.blockNumber;
const versionAt = blockNumber => client.readContract({
  address, abi, functionName: "getVersion", args: [id, version], blockNumber,
});
const [[fingerprint, beforeMask, beforeFinal], [afterFingerprint, afterMask, afterFinal]] =
  await Promise.all([versionAt(before), versionAt(after)]);
assert.notEqual(fingerprint, "0x" + "0".repeat(64));
assert.equal(beforeMask, 0);
assert.equal(beforeFinal, false);
assert.equal(afterFingerprint, fingerprint);
assert.ok(afterMask === 1 || afterMask === 2);
assert.equal(afterFinal, false);

const check = (account, args, blockNumber) => client.simulateContract({
  address, abi, functionName: "approve", account, args, blockNumber,
});
await check(v2.from, [id, version, signer, signature], before);
console.log("PASS: recorded version 2 approval verifies before inclusion", String(before));

async function rejects(label, account, args, blockNumber) {
  await assert.rejects(() => check(account, args, blockNumber), error =>
    error instanceof BaseError &&
    error.walk(cause => cause instanceof ContractFunctionRevertedError)?.data?.errorName === "InvalidApproval");
  console.log("PASS:", label, String(blockNumber));
}

assert.equal(signature.length, 2 + 4627 * 2);
const altered = signature.slice(0, 2) + (signature[2] === "0" ? "1" : "0") + signature.slice(3);
await Promise.all([
  rejects("duplicate approval", v2.from, [id, version, signer, signature], after),
  rejects("version 1 signature reused for version 2", v1.from, [id, version, oldSigner, oldSignature], before),
  rejects("altered signature of valid length", v2.from, [id, version, signer, altered], before),
]);
