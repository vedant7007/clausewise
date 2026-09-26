import { MAX_FILE_BYTES } from "@/lib/constants";
import { AppError } from "@/lib/errors";

/** JSON bodies carry at most two 120,000-character documents plus small fields. */
export const MAX_JSON_BODY_BYTES = 1_500_000;
/** Multipart uploads carry one file of up to 8 MB plus form fields and boundaries. */
export const MAX_FORM_BODY_BYTES = MAX_FILE_BYTES + 64 * 1024;

const TOO_LARGE = "This request is too large. Please upload a smaller document.";

/**
 * Reads a request body while enforcing a byte limit. A declared Content-Length over the limit
 * is rejected before reading; a body without one (or one that lies) is cut off as soon as the
 * limit is crossed, so an oversized body is never buffered in full.
 * @param request - incoming request.
 * @param maxBytes - largest body accepted.
 * @throws AppError PAYLOAD_TOO_LARGE (HTTP 413).
 */
export async function readBodyLimited(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new AppError("PAYLOAD_TOO_LARGE", TOO_LARGE);
  if (!request.body) return new Uint8Array(new ArrayBuffer(0));

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new AppError("PAYLOAD_TOO_LARGE", TOO_LARGE);
    }
    chunks.push(value);
  }
  const body = new Uint8Array(new ArrayBuffer(received));
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/**
 * Parses a multipart form after enforcing a byte limit on the raw body.
 * @param request - incoming multipart request.
 * @param maxBytes - largest body accepted.
 * @throws AppError PAYLOAD_TOO_LARGE, or INVALID_INPUT when the body is not a valid form.
 */
export async function readFormLimited(request: Request, maxBytes: number): Promise<FormData> {
  const body = await readBodyLimited(request, maxBytes);
  try {
    const contentType = request.headers.get("content-type") ?? "";
    return await new Response(body, { headers: { "content-type": contentType } }).formData();
  } catch {
    throw new AppError("INVALID_INPUT", "The request must be a multipart form.");
  }
}
