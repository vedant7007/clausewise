import { toAppError } from "@/lib/errors";

/** Error event appended to a stream when the work fails midway. */
export interface StreamErrorEvent {
  type: "error";
  code: string;
  message: string;
}

/**
 * Streams newline-delimited JSON events while `run` executes, so the UI can show staged
 * progress. Any failure becomes a final, user-safe error event; the stream always closes.
 * @param run - work that emits events.
 * @returns a streaming Response.
 */
export function ndjsonResponse<E>(run: (emit: (event: E) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: E | StreamErrorEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await run(send);
      } catch (error) {
        const appError = toAppError(error);
        if (appError.code === "INTERNAL") console.error("[api] stream failed", appError.cause);
        send({ type: "error", code: appError.code, message: appError.message });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
