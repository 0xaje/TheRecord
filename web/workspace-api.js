export class WorkspaceRequestError extends Error {
  constructor(message, uncertain = false) { super(message); this.uncertain = uncertain; }
}
export function createWorkspaceApi({ getKey, invitation = false, fetcher = (...args) => fetch(...args), timeoutMs = 15000 }) {
  let uncertainWrite = false;
  return async function api(path = "", body, key = getKey()) {
    const writes = body !== undefined && !path.startsWith("/review");
    if (writes && uncertainWrite) throw new WorkspaceRequestError("A previous write has an unknown outcome. Check saved state, then reload before making another change.", true);
    const headers = {};
    if (!invitation && key) headers.Authorization = "Bearer workspace:" + key;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const controller = new AbortController();
    let timer, response;
    try {
      return await Promise.race([
        (async () => {
          response = await fetcher("/api/drafts" + path, {
            headers, signal: controller.signal, ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }),
          });
          const reader = response.body?.getReader();
          if (!reader) throw Error("Missing response");
          const decoder = new TextDecoder(); let text = "", size = 0;
          try {
            for (;;) {
              const {done,value} = await reader.read(); if(done)break;
              size += value.length;
              if(size > 2097152)throw Error("Response too large");
              text += decoder.decode(value,{stream:true});
            }
          } catch(error) { void reader.cancel().catch(()=>{}); throw error; }
          const data = JSON.parse(text + decoder.decode());
          if (!data || typeof data !== "object") throw Error("Invalid response");
          if (!response.ok) {
            if (response.status >= 500) throw Error("Server outcome unavailable");
            throw new WorkspaceRequestError(typeof data?.error === "string" ? data.error : "Request rejected.");
          }
          if (writes && (path === "" ? typeof data.id !== "string" || !Number.isSafeInteger(data.revision) || data.revision < 1
            : path === "/share" ? typeof data.token !== "string" || typeof data.code !== "string"
            : path === "/move" ? !Number.isSafeInteger(data.moved)
            : data.ok !== true)) throw Error("Missing acknowledgement");
          if (Array.isArray(data)) data.nextCursor = response.headers.get("X-Next-Draft");
          return data;
        })(),
        new Promise((_,reject) => { timer = setTimeout(() => { controller.abort(); reject(Error("Request timeout")); }, timeoutMs); }),
      ]);
    } catch (error) {
      if (error instanceof WorkspaceRequestError) throw error;
      if (writes) {
        uncertainWrite = true;
        throw new WorkspaceRequestError("The change could not be confirmed. It may already be saved. Do not repeat it. " + (invitation ? "Ask the creator to check the request before retrying" : "Use Check saved state, then reload before changing anything") + ".", true);
      }
      throw new WorkspaceRequestError("The request could not be completed. Your editor text and recovery code have been kept. Try reading again.");
    } finally { clearTimeout(timer); }
  };
}
