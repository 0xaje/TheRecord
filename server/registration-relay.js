import { boundedText } from "./bounded-stream.js";
import { authorizeRelay } from "./relay-access.js";
import { TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

const upstream = "https://api-testnet.qore.host";
const paths = [
  /^\/qorechain\/pqc\/v1\/evm_window\/qor1[0-9a-z]{38}$/,
  /^\/cosmos\/base\/tendermint\/v1beta1\/node_info$/,
  /^\/cosmos\/auth\/v1beta1\/accounts\/qor1[0-9a-z]{38}$/,
  /^\/cosmos\/tx\/v1beta1\/txs\/[A-F0-9]{64}$/,
];
const broadcast = "/cosmos/tx/v1beta1/txs";

export async function relayRegistration(request, { fetcher = fetch, timeoutMs = 12000, env = {} } = {}) {
  const url = new URL(request.url);
  const path = url.pathname.slice("/api/diana".length);
  if (request.method === "GET" && paths.some(pattern => pattern.test(path))) {
    const denied = await authorizeRelay(request, env, "read");
    if (denied) return denied;
    return forward(path, undefined, fetcher, timeoutMs);
  }
  if (request.method !== "POST" || path !== broadcast) {
    return new Response(null, { status: 404 });
  }
  if (request.headers.get("origin") !== url.origin) {
    return new Response(null, { status: 403 });
  }

  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return Response.json({ error: "Expected a JSON registration envelope." }, { status: 415 });
  }
  const denied = await authorizeRelay(request, env, "broadcast");
  if (denied) return denied;
  let body;
  try { body = await boundedText(request.body, 16000, timeoutMs); }
  catch (error) {
    return Response.json({ error: "Registration envelope unavailable or too large." }, {
      status: error.code === "SIZE" ? 413 : error.code === "TIMEOUT" ? 408 : 400,
    });
  }

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
  }, fetcher, timeoutMs);
}


async function forward(path, options, fetcher, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const failure = (status = 502) => Response.json({
    error: options?.method === "POST"
      ? "Diana response could not be confirmed. Check the transaction receipt before retrying."
      : "Diana API unavailable.",
    ...(options?.method === "POST" ? { outcomeUnknown: true } : {}),
  }, { status, headers: { "Cache-Control": "no-store" } });
  try {
    const response = await fetcher(upstream + path, {
      ...options, redirect: "manual", signal: controller.signal,
    });
    if (!response.ok) return failure(response.status === 429 ? 429 : 502);
    if (response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") return failure();
    const text = await boundedText(response.body, 262144, timeoutMs);
    const data = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) return failure();
    return Response.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch { return failure(); }
  finally { clearTimeout(timeout); }
}
