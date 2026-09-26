# Security policy

## Reporting a vulnerability

Please report security issues privately through
[GitHub security advisories](https://github.com/vedant7007/clausewise/security/advisories/new)
rather than a public issue. Include steps to reproduce and the impact you observed. You can expect
an acknowledgement within three working days.

## Supported versions

Only the latest commit on `main`, which is what is deployed, receives security fixes.

## How ClauseWise protects users

ClauseWise handles legal documents that often contain personal and financial details, so it is
designed to hold as little as possible, for as short a time as possible.

| Area              | Control                                                                                                                                                                                                                        | Where                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Storage           | No database and no document storage. Text lives in memory for one request on the server and in React state in the browser tab.                                                                                                 | `src/lib/services`, `src/components/session`                             |
| Personal data     | Emails, phone numbers, Aadhaar-like and PAN-like numbers and long digit runs are replaced with tokens **before** any text is sent to a model provider, and restored only in the response.                                      | `src/lib/security/pii-redactor.ts`                                       |
| Prompt injection  | Instruction hierarchy in the system policy; document text fenced as untrusted data with fence tags stripped from content; known injection phrases counted and reported; quotes verified and scores computed outside the model. | `src/lib/prompts/system-policy.ts`, `src/lib/security/prompt-defense.ts` |
| Upload validation | Extension allow-list, MIME check, magic-byte check (`%PDF-`, `PK\x03\x04`, UTF-8 text), 8 MB file limit, 120,000 character text limit, declared `Content-Length` checked before reading.                                       | `src/lib/parsers`, `src/lib/http/analyze-input.ts`                       |
| Input validation  | Every request body is validated with Zod; questions are limited to 1,000 characters.                                                                                                                                           | `src/lib/schemas`, `src/lib/http/responses.ts`                           |
| Abuse             | Sliding-window rate limit of 10 requests per 60 seconds per client IP, returning 429 with `Retry-After`.                                                                                                                       | `src/lib/security/rate-limit.ts`                                         |
| Secrets           | API keys are read only on the server; no `NEXT_PUBLIC_` secrets; `.env*` files are git-ignored and excluded from deployments.                                                                                                  | `src/lib/ai/index.ts`, `.gitignore`, `.vercelignore`                     |
| Error handling    | One `AppError` type with user-safe messages. Stack traces, provider names and key state never reach the client.                                                                                                                | `src/lib/errors.ts`, `src/lib/http`                                      |
| Health check      | Reports only `reachable`, `unreachable` or `not_configured`, cached for a minute, using a metadata call that spends no generation quota.                                                                                       | `src/app/api/health/route.ts`                                            |
| Timeouts          | Every provider call is aborted after 25 s without data and after a 90 s hard cap.                                                                                                                                              | `src/lib/ai/ai-manager.ts`                                               |
| Headers           | Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone and geolocation, and HSTS.            | `src/lib/security/headers.ts`, `next.config.ts`                          |

## Known limitations

- **Per-instance rate limiting.** The limiter is in memory, so each serverless instance counts
  separately. Production deployments should use a shared store such as Redis or Upstash.
- **Names and addresses are sent to the model provider**, because they are needed to explain who
  owes what. Users are told this on the disclaimer page.
- **`'unsafe-inline'` scripts** are allowed by the CSP because Next.js injects inline bootstrap
  scripts; a nonce-based CSP via middleware is the stricter alternative.
- Third-party model providers process the redacted text under their own terms.
