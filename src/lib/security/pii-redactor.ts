/** Categories of personal data masked before any text reaches a model provider. */
export type PiiKind = "EMAIL" | "PAN" | "AADHAAR" | "PHONE" | "NUMBER";

/**
 * Ordered most-specific first, so a 12-digit Aadhaar number is not swallowed by the generic
 * long-number rule and an email's digits are never treated as a phone number.
 */
const PII_PATTERNS: readonly { kind: PiiKind; pattern: RegExp }[] = [
  { kind: "EMAIL", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g },
  { kind: "PAN", pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  { kind: "AADHAAR", pattern: /(?<![\d-])[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?![\d-])/g },
  { kind: "PHONE", pattern: /(?<![\w+])\+\d{1,3}[ -]?\d(?:[ -]?\d){6,12}(?!\d)/g },
  { kind: "PHONE", pattern: /(?<![\w+])(?:0)?[6-9]\d{4}[ -]?\d{5}(?!\d)/g },
  { kind: "NUMBER", pattern: /(?<!\w)\d{9,18}(?!\d)/g },
];

const TOKEN_PATTERN = /\[(?:EMAIL|PAN|AADHAAR|PHONE|NUMBER)_\d+\]/g;

/** Output of {@link redactPii}: masked text plus the map needed to undo it. */
export interface Redaction {
  text: string;
  /** token → original value */
  tokens: ReadonlyMap<string, string>;
  /** number of personal details masked, counting repeats */
  count: number;
}

/** Redacts several texts with one shared token map, so tokens never collide across texts. */
export interface Redactor {
  /** Masks one text, continuing the shared numbering. */
  redact(text: string): string;
  /** token → original value, across every text redacted so far */
  readonly tokens: ReadonlyMap<string, string>;
  /** personal details masked so far, counting repeats */
  readonly count: number;
}

/**
 * Creates a redactor for one request. Masks emails, phone numbers, Aadhaar-like and PAN-like
 * identifiers, and long digit runs such as account numbers. A value always gets one token.
 */
export function createRedactor(): Redactor {
  const tokens = new Map<string, string>();
  const byValue = new Map<string, string>();
  const counters = new Map<PiiKind, number>();
  let count = 0;

  const redact = (text: string): string =>
    PII_PATTERNS.reduce(
      (masked, { kind, pattern }) =>
        masked.replace(pattern, (value) => {
          count += 1;
          const existing = byValue.get(value);
          if (existing) return existing;
          const next = (counters.get(kind) ?? 0) + 1;
          counters.set(kind, next);
          const token = `[${kind}_${next}]`;
          tokens.set(token, value);
          byValue.set(value, token);
          return token;
        }),
      text,
    );

  return {
    redact,
    tokens,
    get count() {
      return count;
    },
  };
}

/**
 * Redacts a single text.
 * @param text - document text or a user question.
 * @returns masked text and a reversible token map.
 */
export function redactPii(text: string): Redaction {
  const redactor = createRedactor();
  const masked = redactor.redact(text);
  return { text: masked, tokens: redactor.tokens, count: redactor.count };
}

/**
 * Replaces redaction tokens in a string with their original values. Unknown tokens are kept.
 * @param text - model output that may contain tokens.
 * @param tokens - the map from {@link redactPii}.
 */
export function restorePii(text: string, tokens: ReadonlyMap<string, string>): string {
  if (tokens.size === 0) return text;
  return text.replace(TOKEN_PATTERN, (token) => tokens.get(token) ?? token);
}

/**
 * Restores tokens in every string inside a JSON-like value, preserving its shape.
 * @param value - parsed model output.
 * @param tokens - the map from {@link redactPii}.
 * @returns a new value; the input is not mutated.
 */
export function restorePiiDeep<T>(value: T, tokens: ReadonlyMap<string, string>): T {
  if (tokens.size === 0) return value;
  const visit = (node: unknown): unknown => {
    if (typeof node === "string") return restorePii(node, tokens);
    if (Array.isArray(node)) return node.map(visit);
    if (node !== null && typeof node === "object") {
      return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, visit(child)]));
    }
    return node;
  };
  return visit(value) as T;
}
