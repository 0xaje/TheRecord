import { TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

const upstream = "https://api-testnet.qore.host";
const paths = [
  /^\/qorechain\/pqc\/v1\/evm_window\/qor1[0-9a-z]{38}$/,
  /^\/cosmos\/base\/tendermint\/v1beta1\/node_info$/,
  /^\/cosmos\/auth\/v1beta1\/accounts\/qor1[0-9a-z]{38}$/,
  /^\/cosmos\/tx\/v1beta1\/txs\/[A-F0-9]{64}$/,
];
const broadcast = "/cosmos/tx/v1beta1/txs";

export async function relayRegistration(request) {
  const url = new URL(request.url);
  const path = url.pathname.slice("/api/diana".length);
  if (request.method === "GET" && paths.some(pattern => pattern.test(path))) {
    return forward(path);
  }
  if (request.method !== "POST" || path !== broadcast) {
    return new Response(null, { status: 404 });
  }
  if (request.headers.get("origin") !== url.origin) {
    return new Response(null, { status: 403 });
  }

  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 16000) {
      await reader.cancel();
      return new Response(null, { status: 413 });
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();

  let txBytes;
  try {
    const { tx_bytes: encoded, mode } = JSON.parse(body);
    if (typeof encoded !== "string" || mode !== "BROADCAST_MODE_SYNC") throw new Error();
    const tx = TxRaw.decode(Uint8Array.from(atob(encoded), char => char.charCodeAt(0)));
    const txBody = TxBody.decode(tx.bodyBytes);
    if (tx.signatures.length !== 1 || txBody.messages.length !== 1
      || txBody.messages[0].typeUrl !== "/qorechain.pqc.v1.MsgRegisterPQCKeyV2"
      || txBody.extensionOptions.length || txBody.nonCriticalExtensionOptions.length) throw new Error();
    txBytes = encoded;
  } catch {
    return Response.json({ error: "Expected one signed Diana key registration." }, { status: 400 });
  }
  return forward(broadcast, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tx_bytes: txBytes, mode: "BROADCAST_MODE_SYNC" }),
  });
}

async function forward(path, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(upstream + path, {
      ...options, redirect: "manual", signal: controller.signal,
    });
    if (response.status >= 300 && response.status < 400) {
      return Response.json({ error: "Unexpected redirect from Diana." }, { status: 502 });
    }
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Diana relay fetch failed", error.name, error.message);
    return Response.json({ error: "Diana API unavailable." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
