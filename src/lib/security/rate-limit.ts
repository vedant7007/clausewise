import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

/** Above this many tracked clients, idle entries are swept to bound memory. */
const SWEEP_THRESHOLD = 5_000;
const MS_PER_SECOND = 1_000;

/** Outcome of a rate-limit check. */
export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * In-memory sliding-window log limiter. State is per server instance, so on serverless
 * platforms each warm instance counts separately; a shared store such as Redis is the
 * production path.
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * Records a request for `key` if it is within the limit.
   * @param key - client identifier, usually an IP address.
   * @returns whether the request may proceed and, if not, when to retry.
   */
  check(key: string): RateLimitDecision {
    const now = this.now();
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((time) => time > windowStart);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + this.windowMs - now) / MS_PER_SECOND),
      );
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > SWEEP_THRESHOLD) this.sweep(windowStart);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterSeconds: 0 };
  }

  private sweep(windowStart: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((time) => time <= windowStart)) this.hits.delete(key);
    }
  }
}

/** Shared limiter for all model-backed API routes: 10 requests per minute per client. */
export const apiRateLimiter = new SlidingWindowRateLimiter(
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
);

/**
 * Picks a client identifier from proxy headers.
 * @param headers - incoming request headers.
 * @returns the first forwarded IP, the real IP, or a shared fallback bucket.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "anonymous";
}
