/** Error surfaced to the UI: a machine code plus a message that is safe to display. */
export class ClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ClientError";
  }
}

const HTTP_PAYLOAD_TOO_LARGE = 413;
const GENERIC_MESSAGE = "We could not reach ClauseWise. Check your connection and try again.";

/**
 * Converts a failed response into a ClientError, using the server's user-safe message when
 * the body is our JSON error shape.
 * @param response - a non-OK response.
 */
export async function errorFromResponse(response: Response): Promise<ClientError> {
  if (response.status === HTTP_PAYLOAD_TOO_LARGE) {
    return new ClientError(
      "FILE_TOO_LARGE",
      "That file is too large to upload. Please try a smaller one.",
    );
  }
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    if (body.error?.message)
      return new ClientError(body.error.code ?? "UNKNOWN", body.error.message);
  } catch {
    // Non-JSON error pages fall through to the generic message.
  }
  return new ClientError("UNKNOWN", GENERIC_MESSAGE);
}

/**
 * POSTs JSON and returns the parsed JSON response.
 * @param url - API route.
 * @param body - request payload.
 * @param signal - optional abort signal.
 * @throws ClientError with a displayable message.
 */
export async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ClientError("NETWORK", GENERIC_MESSAGE);
  }
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as T;
}

/**
 * POSTs a form and reads a newline-delimited JSON stream, calling `onEvent` per event.
 * @param url - API route.
 * @param form - multipart body.
 * @param onEvent - receives each parsed event in order.
 * @param signal - optional abort signal.
 * @throws ClientError on HTTP or network failure.
 */
export async function postForNdjson<E>(
  url: string,
  form: FormData,
  onEvent: (event: E) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: form, signal });
  } catch {
    throw new ClientError("NETWORK", GENERIC_MESSAGE);
  }
  if (!response.ok || !response.body) throw await errorFromResponse(response);

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as E);
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as E);
}
