import { buildRegisterPqKeyMessage, deriveCanonicalPqKey, signHybrid, toBase64 } from "@qorechain/qoresign";
import { AuthInfo, TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { PubKey } from "cosmjs-types/cosmos/crypto/secp256k1/keys";
import { deriveSigner } from "./approve.js";

const rest = "/api/diana";
const chainId = "qorechain-diana";

async function request(path, options) {
  const response = await fetch(rest + path, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Diana returned HTTP ${response.status}.`);
  return response.json();
}

export async function registerSigner(file, expectedAddress, onAccepted) {
  const mnemonic = (await file.text()).trim();
  const { classicalKey, signer } = deriveSigner(mnemonic);
  if (signer !== expectedAddress) throw new Error("The signing file belongs to a different Diana address.");

  const [node, accountData] = await Promise.all([
    request("/cosmos/base/tendermint/v1beta1/node_info"),
    request(`/cosmos/auth/v1beta1/accounts/${signer}`),
  ]);
  if (node.default_node_info?.network !== chainId) throw new Error("Expected Diana testnet.");
  const account = accountData.account?.base_account ?? accountData.account;
  if (account?.address !== signer || account.account_number == null || account.sequence == null) {
    throw new Error("Diana could not verify this account. Fund the test address first.");
  }

  const pqKey = deriveCanonicalPqKey({ mnemonic, address: signer });
  const message = buildRegisterPqKeyMessage({
    chainId, account: signer, pqKey, classicalPublicKey: classicalKey.publicKey,
  });
  const bodyBytes = TxBody.encode(TxBody.fromPartial({ messages: [message] })).finish();
  const authInfoBytes = AuthInfo.encode(AuthInfo.fromPartial({
    signerInfos: [{
      publicKey: {
        typeUrl: "/cosmos.crypto.secp256k1.PubKey",
        value: PubKey.encode({ key: classicalKey.publicKey }).finish(),
      },
      modeInfo: { single: { mode: 1 } },
      sequence: BigInt(account.sequence),
    }],
    fee: { amount: [{ denom: "uqor", amount: "60000" }], gasLimit: 600000n },
  })).finish();
  const { txBytes } = signHybrid({
    chainId, accountNumber: BigInt(account.account_number), bodyBytes, authInfoBytes,
    classicalKey, mode: "classicalOnly",
  });
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", txBytes)),
    byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();

  const broadcast = await request("/cosmos/tx/v1beta1/txs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tx_bytes: toBase64(txBytes), mode: "BROADCAST_MODE_SYNC" }),
  }).catch(() => {
    throw new Error(`Broadcast outcome unknown. Check Diana for ${hash} before retrying.`);
  });
  const accepted = broadcast.tx_response;
  if (Number(accepted?.code) !== 0 || accepted.txhash !== hash) {
    throw new Error(accepted?.raw_log || "Diana could not confirm broadcast acceptance.");
  }

  onAccepted(hash);
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await fetch(`${rest}/cosmos/tx/v1beta1/txs/${hash}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) {
      const { tx_response: receipt } = await response.json();
      if (receipt?.txhash === hash && BigInt(receipt.height) > 0n) {
        if (Number(receipt.code) !== 0) throw new Error(receipt.raw_log || "Diana rejected registration.");
        return;
      }
    } else if (response.status !== 404) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error("Confirmation is pending. Check the transaction link before retrying.");
}
