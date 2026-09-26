# Security policy and threat model

## Reporting a vulnerability

Please report security issues privately through
[GitHub security advisories](https://github.com/vedant7007/clausewise/security/advisories/new)
rather than a public issue. Include steps to reproduce and the impact you observed. You can expect
an acknowledgement within three working days. Only the latest commit on `main`, which is what is
deployed, receives security fixes.

## Assets

| Asset                                | Why it matters                                                             |
| ------------------------------------ | -------------------------------------------------------------------------- |
| The user's document and questions    | Contracts contain personal, financial and employment details.              |
| Personal identifiers in documents    | Emails, phone numbers, Aadhaar-like and PAN-like numbers, account numbers. |
| Model provider API keys              | Abuse costs money and quota and could exfiltrate prompts.                  |
| Model quota and service availability | Exhaustion or abuse takes the service down for everyone.                   |
| Integrity of the analysis            | A manipulated result could mislead someone about what they are signing.    |

## Trust boundaries

1. **Browser → API routes.** Everything from the client is untrusted: files, form fields, JSON
   bodies and headers.
2. **API → model provider.** Text leaves our infrastructure here; the provider sees only
   redacted, fenced content.
3. **Model → API.** Model output is untrusted until validated and verified.
4. **Document content → prompt.** A document is data, never instructions, even though it is
   placed inside a prompt.

## Threats and controls

| #   | Threat                                                     | Control                                                                                                                                                                                                                                            | Where                                                                                                           |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| T1  | Personal data sent to a third-party model                  | Structured identifiers are replaced with reversible tokens **before** inference and restored only in the response; the analysis cache stores token-bearing output, never personal data                                                             | `src/lib/security/pii-redactor.ts`, `src/lib/cache/analysis-cache.ts`                                           |
| T2  | Documents retained after use                               | No database and no document storage: text lives in memory for one request and in the browser tab only                                                                                                                                              | `src/lib/services`, `src/components/session/SessionProvider.tsx`                                                |
| T3  | Prompt injection hidden in a document                      | Instruction hierarchy (system policy > task > user request > document); document text fenced in `<untrusted_document>` tags with fence tags stripped from content; injection phrases detected and reported to the user                             | `src/lib/prompts/system-policy.ts`, `src/lib/security/prompt-defense.ts`                                        |
| T4  | Fabricated or manipulated findings                         | Every model response is validated with Zod; every quote must be found verbatim in the document or the claim is dropped; the balance score is computed in code, not by the model                                                                    | `src/lib/ai/structured-output.ts`, `src/lib/analysis/evidence-verifier.ts`, `src/lib/analysis/balance-score.ts` |
| T5  | Malicious or disguised uploads                             | Extension allow-list, MIME check and magic-byte signature check (`%PDF-`, `PK\x03\x04`, UTF-8 text); corrupt files rejected safely                                                                                                                 | `src/lib/parsers/magic-bytes.ts`, `src/lib/parsers/document-parser.ts`                                          |
| T6  | Oversized requests exhausting memory                       | Bodies are streamed and cut off at the limit even without a truthful Content-Length: 1.5 MB for JSON, 8 MB plus form overhead for uploads, 120,000 characters of text; all return 413                                                              | `src/lib/http/body-limit.ts`, `src/lib/constants.ts`                                                            |
| T7  | Abuse and quota exhaustion                                 | Sliding-window limit of 10 requests per 60 s per client, with `Retry-After`; the client is identified by platform-set headers (`x-vercel-forwarded-for`, `x-real-ip`) that a client cannot forge                                                   | `src/lib/security/rate-limit.ts`                                                                                |
| T8  | Cross-site scripting                                       | Per-request nonce CSP: `script-src 'self' 'nonce-…' 'strict-dynamic'` with no `unsafe-inline` or `unsafe-eval` in production; React escapes all rendered text; no `dangerouslySetInnerHTML`                                                        | `src/proxy.ts`, `src/lib/security/headers.ts`                                                                   |
| T9  | Clickjacking, MIME sniffing, referrer leaks, device access | `frame-ancestors 'none'` and `X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin`, a Permissions-Policy denying camera, microphone and geolocation, HSTS                                                                          | `src/lib/security/headers.ts`, `next.config.ts`                                                                 |
| T10 | Leaked secrets or internals                                | Keys are server-only (no `NEXT_PUBLIC_` secrets, `.env*` ignored and excluded from deployments); a single `AppError` type returns user-safe messages without stack traces, provider names or key state; the health check reports only reachability | `src/lib/errors.ts`, `src/lib/http/responses.ts`, `src/app/api/health/route.ts`                                 |
| T11 | Hung or slow provider calls tying up functions             | 25 s idle timeout and 90 s hard cap per call, bounded retries, then fallback                                                                                                                                                                       | `src/lib/ai/ai-manager.ts`                                                                                      |
| T12 | Vulnerable dependencies                                    | `npm audit --audit-level=high` runs in CI on every push and fails the build                                                                                                                                                                        | `.github/workflows/ci.yml`                                                                                      |

## Residual risks and mitigation paths

- **Per-instance rate limiting.** The limiter keeps its window in memory, so each serverless
  instance counts separately and a burst spread across instances can exceed 10 requests per
  minute in total. The mitigation path is a shared store: replace `SlidingWindowRateLimiter`
  with an Upstash Redis sliding window (`@upstash/ratelimit`, keyed by the same `clientKey`),
  provisioned through the Vercel Marketplace, with the in-memory limiter kept as a fallback if
  Redis is unreachable. Platform-level protection (Vercel Firewall rate-limit rules) can be
  added without code changes.
- **Per-instance cache.** The analysis cache is also per instance; it holds no personal data, so
  the risk is only reduced hit rates, not exposure.
- **Names and addresses reach the model provider**, because they are needed to explain who owes
  what. Users are told this on the disclaimer page.
- **`style-src-attr 'unsafe-inline'`** remains for inline style attributes, which cannot execute
  script; style elements require the nonce.
- **Third-party providers** process the redacted text under their own terms.
