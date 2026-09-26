import type { z } from "zod";
import { AppError, toAppError } from "@/lib/errors";
import { apiRateLimiter, clientKey } from "@/lib/security/rate-limit";
import { MAX_JSON_BODY_BYTES, readBodyLimited } from "./body-limit";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Serialises an error for the client. Only the machine code and the user-safe message leave
 * the server; internal failures are logged without their details reaching the response.
 * @param error - any thrown value.
 */
export function errorResponse(error: unknown): Response {
  const appError = toAppError(error);
  if (appError.code === "INTERNAL") console.error("[api] internal error", appError.cause);
  return Response.json(
    { error: { code: appError.code, message: appError.message } },
    { status: appError.status, headers: NO_STORE },
  );
}

/**
 * Applies the per-client rate limit.
 * @param request - incoming request.
 * @returns a 429 response with Retry-After when the client is over the limit, otherwise null.
 */
export function rateLimitResponse(request: Request): Response | null {
  const decision = apiRateLimiter.check(clientKey(request.headers));
  if (decision.allowed) return null;
  return Response.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: `Too many requests. Please wait ${decision.retryAfterSeconds} seconds and try again.`,
      },
    },
    { status: 429, headers: { ...NO_STORE, "Retry-After": String(decision.retryAfterSeconds) } },
  );
}

/**
 * Parses and validates a JSON request body.
 * @param request - incoming request.
 * @param schema - Zod schema for the body.
 * @throws AppError PAYLOAD_TOO_LARGE over 1.5 MB, or INVALID_INPUT naming the first invalid field.
 */
export async function readJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const raw = await readBodyLimited(request, MAX_JSON_BODY_BYTES);
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw new AppError("INVALID_INPUT", "The request body must be valid JSON.");
  }
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue?.path.map(String).join(".") || "request";
  throw new AppError("INVALID_INPUT", `Invalid ${field}: ${issue?.message ?? "unknown problem"}.`);
}
