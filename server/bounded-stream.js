export async function boundedText(stream, maximum, timeoutMs) {
  if (!stream) throw Object.assign(new Error(), { code: "BODY" });
  const reader = stream.getReader(), decoder = new TextDecoder("utf-8", { fatal: true });
  let timer, bytes = 0, text = "";
  try {
    return await Promise.race([
      (async () => {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return text + decoder.decode();
          bytes += value.length;
          if (bytes > maximum) throw Object.assign(new Error(), { code: "SIZE" });
          text += decoder.decode(value, { stream: true });
        }
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error(), { code: "TIMEOUT" })), timeoutMs); }),
    ]);
  } catch (error) { void reader.cancel().catch(() => {}); throw error; }
  finally { clearTimeout(timer); }
}

