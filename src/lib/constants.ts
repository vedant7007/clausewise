/** Largest upload accepted, in bytes (8 MB). */
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
/** Largest extracted document text accepted, in characters. */
export const MAX_TEXT_CHARS = 120_000;
/** A PDF yielding fewer characters than this is treated as a scanned image. */
export const MIN_PDF_TEXT_CHARS = 200;
/** Shortest document worth analysing, in characters. */
export const MIN_DOCUMENT_CHARS = 40;
/** Longest question accepted by grounded Q&A. */
export const MAX_QUESTION_CHARS = 1_000;
/** Shortest question accepted by grounded Q&A. */
export const MIN_QUESTION_CHARS = 3;
/** Characters of document sent to the model; longer text keeps its head and tail. */
export const MODEL_CONTEXT_CHAR_BUDGET = 60_000;
/** A provider call is aborted after this long without receiving any data. */
export const PROVIDER_TIMEOUT_MS = 25_000;
/** Absolute cap on a single provider call, even while it is still streaming. */
export const PROVIDER_MAX_CALL_MS = 90_000;
/** Retries per provider for transient failures, before falling back. */
export const MAX_PROVIDER_RETRIES = 2;
/** Base delay for exponential backoff between retries. */
export const RETRY_BASE_DELAY_MS = 400;
/** Requests allowed per client inside one rate-limit window. */
export const RATE_LIMIT_MAX_REQUESTS = 10;
/** Sliding rate-limit window length. */
export const RATE_LIMIT_WINDOW_MS = 60_000;
/** Quotes shorter than this (after normalisation) are too generic to count as evidence. */
export const MIN_QUOTE_CHARS = 8;
/** Longest quote the model may return for a single claim. */
export const MAX_QUOTE_CHARS = 800;
