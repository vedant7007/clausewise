# ClauseWise architecture

This document explains how ClauseWise is put together and why. It is written for engineers who are
new to the codebase.

## Principles

1. **The model proposes; deterministic code decides.** The language model extracts and explains.
   TypeScript verifies every quote, computes the balance score, sorts risks, masks personal data and
   decides what reaches the screen.
2. **Nothing unvalidated reaches the user.** Every model response is parsed with Zod `safeParse`. A
   failure triggers one repair attempt with the validation errors fed back, then a typed error.
3. **Thin edges, rich services.** Route handlers validate input, call one service and map errors.
   Business logic lives in `src/lib/services` and pure libraries under `src/lib`.
4. **No storage.** Documents exist in memory for one request on the server and in React state in
   the browser tab. There is no database.

## Directory map

```
src/
  app/                     Next.js App Router pages and API route handlers (thin)
    api/analyze            multipart in, NDJSON stream out (stages then result)
    api/ask|compare|negotiate  JSON in, JSON out, via lib/http/model-route.ts
    api/extract            upload validation and text extraction for compare
    api/health             provider reachability, no secrets
  components/
    layout/                shell: skip link, disclaimer banner, header, footer, first-run notice
    ui/                    accessible primitives: Button, Tabs, Badge, FileDropzone, ...
    analysis/              BalanceMeter, ClauseCard, RiskCard, TimelineList, NegotiationPanel, ...
    analyze|ask|compare|prep  feature views
    session/               in-memory session context shared across pages
  hooks/use-analysis.ts    streaming analysis client state
  lib/
    ai/                    AIProvider interface, Gemini and Groq adapters, AIManager
    analysis/              evidence verifier, balance score, clause weights
    prompts/               system policy and task prompts
    parsers/               magic bytes and document parsing (unpdf, mammoth)
    security/              PII redaction, prompt defence, rate limiting, headers
    schemas/               Zod schemas: the single source of truth for types
    services/              analysis, Q&A, compare and negotiation pipelines
    http/                  request parsing, error mapping, NDJSON streaming
    export/                .ics and Markdown generation
    client/                browser API client and downloads
  data/                    samples, fair baselines and saved fixtures
tests/                     mirrors src/lib and components
```

## The analysis pipeline

```
upload / sample / pasted text
        │
        ▼
validateUpload ── size ≤ 8 MB, extension, MIME, magic bytes (%PDF-, PK\x03\x04, UTF-8 text)
        │
        ▼
extractText ───── unpdf (PDF) · mammoth (DOCX) · UTF-8 (TXT/MD) → normalise → bounds check
        │                                      (< 200 chars from a PDF → "looks scanned")
        ▼
redactPii ─────── emails, phones, Aadhaar-like, PAN-like, long digit runs → [EMAIL_1] tokens
countInjectionAttempts ── phrase patterns, reported to the user
truncateMiddle ── keep head (70%) and tail, cut on line boundaries, mark the elision
        │
        ▼
AIManager.generate(AnalysisModelOutputSchema)
        │   system: SYSTEM_POLICY (instruction hierarchy) + TASK
        │   user:   output style + <untrusted_document> fenced text
        ▼
restorePiiDeep ── tokens back to original values
verifyItems ───── clauses, risks, obligations: keep only quotes found in the original text
computeBalance ── category-weighted average of tilt points, rounded and clamped to 0–100
        │
        ▼
AnalysisResult ── streamed to the browser as the final NDJSON event
```

Progress events (`parsing`, `redacting`, `analyzing`, `verifying`) are emitted as each stage starts,
so the UI can show staged progress while the model works.

## Evidence verification

`createEvidenceVerifier(source)` normalises the source once: lower-case, typographic quotes and
dashes mapped to ASCII, whitespace runs collapsed to a single space. It keeps an `offsets` array
mapping every normalised character back to its index in the original text. A quote is normalised
the same way (after stripping wrapping quotes and ellipses) and accepted only if it is at least
8 characters and appears as a contiguous substring. The evidence returned is sliced from the
**original** document, so the user always sees their own text, with its true character offsets.

Items whose quotes fail are dropped, and the counts become the "Grounded: N/M" badge.

## Balance score

`TILT_POINTS` maps FAVORS_YOU to 100, NEUTRAL to 75, FAVORS_COUNTERPARTY to 30 and
HEAVILY_FAVORS_COUNTERPARTY to 0. `CATEGORY_WEIGHTS` gives liability and indemnity 1.75,
termination, payment and penalty 1.5, renewal and confidentiality 1.0, notice and jurisdiction
0.75, and other 0.5. The score is the weighted mean of points over verified clauses, rounded and
clamped. Verdict bands start at 80, 60, 40, 20 and 0. An empty ledger yields a null score with an
explanatory verdict rather than a misleading number.

## AI layer

`AIProvider` is a two-method interface: `generateJson` and `ping`. `GeminiProvider` streams output
with a response JSON Schema; `GroqProvider` uses JSON-object mode with the schema embedded in the
system message. `providersFromEnv` builds the fallback chain: `GEMINI_MODEL`, then each of
`GEMINI_FALLBACK_MODELS`, then Groq. Free-tier quotas are per model, so the chain keeps the service
up when one model's daily quota is spent.

`AIManager` wraps every call:

| Concern  | Behaviour                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------- |
| Timeout  | Aborted after 25 s without data (reset on each streamed chunk) and after a 90 s hard cap           |
| Retry    | Up to 2 retries for rate limits, timeouts, network and 5xx errors, exponential backoff with jitter |
| Fallback | Auth, bad-request and daily-quota errors move straight to the next provider                        |
| Repair   | One retry with the Zod issues and the invalid output fed back                                      |
| Errors   | Callers only see `AppError` codes `AI_UNAVAILABLE` or `AI_INVALID_OUTPUT` with user-safe messages  |

The JSON Schema sent to providers is generated from the Zod schema with size and pattern keywords
removed; Gemini rejects heavily constrained schemas, and Zod enforces those limits locally anyway.

## Prompt-injection defence

- The system policy sets an explicit hierarchy: SYSTEM POLICY > TASK > USER REQUEST > DOCUMENT CONTENT.
- Document text is wrapped in `<untrusted_document>` tags; any such tags inside the document are
  stripped first so content cannot close the fence.
- Known injection phrases are counted and surfaced ("N suspicious instructions were ignored"), and
  the analysis prompt asks the model to report such text as a HIGH risk.
- Even a successful injection cannot fabricate evidence: quotes are verified and the score is
  computed outside the model.

## Demo resilience

`runAnalyzeRequest` catches `AI_UNAVAILABLE` and `SERVICE_MISCONFIGURED` for **bundled samples only**
and serves a saved analysis from `src/data/fixtures`, validated against `AnalysisResultSchema` and
marked `source: "fixture"`. The UI shows a prominent notice. User uploads and pasted text never fall
back, and invalid model output is never hidden behind a fixture. Fixtures were produced by running
the real pipeline on each sample.

## Client state

`SessionProvider` holds `{ document, result }` in React state for the tab. Q&A, compare and the prep
pack read from it, so the document never needs to be stored or re-uploaded. Reloading the tab clears
it by design. The analysis stream is read with `fetch` and a `TextDecoderStream`, parsing one JSON
event per line.

## Security headers

Set for every route in `next.config.ts` from `src/lib/security/headers.ts`: a same-origin
Content-Security-Policy (with `'unsafe-inline'` scripts required by Next.js bootstrapping, and
`'unsafe-eval'` only in development), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` denying camera,
microphone and geolocation, and HSTS.

## Testing strategy

Pure libraries are unit tested exhaustively. Services are tested with a fake `AIManager` so
redaction, verification, scoring and fallback rules are proven without network calls. HTTP helpers
are tested with real `Request` and `Response` objects. Components are tested in jsdom with Testing
Library, including an axe-core assertion on the full analysis view rendered from a real fixture.
CI runs lint, typecheck, tests with coverage thresholds and a production build on every push.
