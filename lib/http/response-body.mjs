export class ResponseBodyTooLargeError extends Error {
  constructor() {
    super("response-body-too-large");
    this.name = "ResponseBodyTooLargeError";
  }
}

/** Read a response stream while enforcing a byte limit before joining chunks. */
export async function readResponseTextLimited(response, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new RangeError("invalid-response-body-limit");
  const contentLength = response.headers.get("content-length");
  if (/^\d+$/.test(contentLength || "") && Number(contentLength) > maxBytes) {
    try { await response.body?.cancel(); } catch { /* the body may already be closed */ }
    throw new ResponseBodyTooLargeError();
  }
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try { await reader.cancel(); } catch { /* the response is rejected regardless */ }
        throw new ResponseBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
