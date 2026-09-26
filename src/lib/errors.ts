/** Machine-readable error codes shared by the API and the UI. */
export const ERROR_CODES = [
  "INVALID_INPUT",
  "UNSUPPORTED_FILE",
  "FILE_TOO_LARGE",
  "TEXT_TOO_LONG",
  "EMPTY_DOCUMENT",
  "SCANNED_PDF",
  "RATE_LIMITED",
  "AI_UNAVAILABLE",
  "AI_INVALID_OUTPUT",
  "SERVICE_MISCONFIGURED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const HTTP_STATUS: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  UNSUPPORTED_FILE: 415,
  FILE_TOO_LARGE: 413,
  TEXT_TOO_LONG: 413,
  EMPTY_DOCUMENT: 422,
  SCANNED_PDF: 422,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 503,
  AI_INVALID_OUTPUT: 502,
  SERVICE_MISCONFIGURED: 503,
  INTERNAL: 500,
};

/**
 * The only error type that crosses the API boundary. `message` is always safe to show a user:
 * it never contains stack traces, provider names or key state.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    this.status = HTTP_STATUS[code];
  }
}

/**
 * Converts any thrown value into an AppError.
 * @param error - anything caught in a `catch` block.
 * @returns the same AppError, or a generic INTERNAL error that hides the original.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError("INTERNAL", "Something went wrong on our side. Please try again.", {
    cause: error,
  });
}
