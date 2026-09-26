import { createHash } from "node:crypto";
import type { AnalysisModelOutput } from "@/lib/schemas/analysis";
import type { OutputOptions } from "@/lib/schemas/document";
import { TtlLruCache } from "./ttl-lru-cache";

/** Enough for the samples and repeat analyses without holding much memory per instance. */
const MAX_ENTRIES = 100;
/** Thirty minutes: long enough for re-explaining and revisiting, short enough to stay fresh. */
const TTL_MS = 30 * 60 * 1000;
/** Bump when the analysis prompt or output schema changes, so stale entries are never reused. */
const PROMPT_VERSION = "analyze-v1";

/**
 * Validated model output keyed by a hash of the redacted prompt text. Values still contain
 * redaction tokens such as [EMAIL_1], never personal data; each request restores them with
 * its own token map, which is identical for identical text.
 */
export const analysisCache = new TtlLruCache<AnalysisModelOutput>(MAX_ENTRIES, TTL_MS);

/**
 * Builds the cache key for an analysis.
 * @param redactedText - the redacted, bounded text sent to the model.
 * @param options - output language and reading level, which change the output.
 * @returns a SHA-256 hex digest; the text itself is never used as a key.
 */
export function analysisCacheKey(redactedText: string, options: OutputOptions): string {
  return createHash("sha256")
    .update(`${PROMPT_VERSION}\u0000${options.language}\u0000${options.plainLanguage}\u0000`)
    .update(redactedText)
    .digest("hex");
}
