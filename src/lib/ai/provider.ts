/** A structured-output request sent to a provider. */
export interface GenerateRequest {
  /** System policy and task instructions. */
  system: string;
  /** User-turn content, including fenced document text. */
  prompt: string;
  /** JSON Schema the response must satisfy. */
  jsonSchema: Record<string, unknown>;
  /** Aborted by the manager when the per-call timeout expires. */
  signal: AbortSignal;
}

/** A model backend. Implementations return raw JSON text and never validate it. */
export interface AIProvider {
  /** Internal identifier for logs only; never sent to the client. */
  readonly id: string;
  /** Model name, shown in the health check and README. */
  readonly model: string;
  /**
   * @returns the raw JSON text produced by the model.
   * @throws ProviderError for every failure.
   */
  generateJson(request: GenerateRequest): Promise<string>;
}

/** Why a provider call failed. Decides whether to retry, fall back or give up. */
export type ProviderFailureKind =
  "quota" | "rate_limit" | "auth" | "timeout" | "network" | "server" | "bad_request";

const RETRYABLE: ReadonlySet<ProviderFailureKind> = new Set([
  "rate_limit",
  "timeout",
  "network",
  "server",
]);

/** A classified provider failure. Its message is for server logs only. */
export class ProviderError extends Error {
  readonly kind: ProviderFailureKind;

  constructor(kind: ProviderFailureKind, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ProviderError";
    this.kind = kind;
  }

  /** Whether trying the same provider again could succeed. */
  get retryable(): boolean {
    return RETRYABLE.has(this.kind);
  }
}

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;

/**
 * Classifies an HTTP status from a provider.
 * @param status - HTTP status code.
 * @param body - response text, used to tell a spent quota from a short-term rate limit.
 */
export function kindFromStatus(status: number, body = ""): ProviderFailureKind {
  if (status === HTTP_UNAUTHORIZED || status === HTTP_FORBIDDEN) return "auth";
  if (status === HTTP_TOO_MANY_REQUESTS) {
    return /quota|billing|exceeded your current/i.test(body) ? "quota" : "rate_limit";
  }
  if (status >= HTTP_SERVER_ERROR) return "server";
  return "bad_request";
}

/**
 * Converts any error thrown while calling a provider into a ProviderError.
 * @param error - the caught value.
 * @param signal - the call's abort signal, to recognise timeouts.
 */
export function toProviderError(error: unknown, signal: AbortSignal): ProviderError {
  if (error instanceof ProviderError) return error;
  if (signal.aborted)
    return new ProviderError("timeout", "Provider call timed out", { cause: error });
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === "number") {
    const message = error instanceof Error ? error.message : "";
    return new ProviderError(kindFromStatus(status, message), `Provider returned ${status}`, {
      cause: error,
    });
  }
  return new ProviderError("network", "Provider request failed", { cause: error });
}
