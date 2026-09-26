import { MIN_QUOTE_CHARS } from "@/lib/constants";
import type { Evidence } from "@/lib/schemas/evidence";

/** Typographic characters mapped to their plain equivalents before matching. */
const CHARACTER_EQUIVALENTS: Readonly<Record<string, string>> = {
  "‘": "'",
  "’": "'",
  "‚": "'",
  "‛": "'",
  "′": "'",
  "“": '"',
  "”": '"',
  "„": '"',
  "‟": '"',
  "″": '"',
  "‐": "-",
  "‑": "-",
  "‒": "-",
  "–": "-",
  "—": "-",
  "―": "-",
  "…": "...",
};

/** Wrapping characters and ellipses a model tends to add around a quote. */
const QUOTE_WRAPPER = /^[\s"'`.…]+|[\s"'`.…]+$/g;

/** Text prepared for matching, with a map from each character back to the original. */
export interface NormalizedText {
  text: string;
  /** offsets[i] is the index in the original string of normalised character i */
  offsets: number[];
}

/**
 * Lower-cases, unifies typographic punctuation and collapses whitespace runs to one space,
 * while remembering where every character came from.
 * @param input - any string.
 */
export function normalizeForMatch(input: string): NormalizedText {
  let text = "";
  const offsets: number[] = [];
  let previousWasSpace = true;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index] ?? "";
    if (/\s/.test(char)) {
      if (!previousWasSpace) {
        text += " ";
        offsets.push(index);
      }
      previousWasSpace = true;
      continue;
    }
    for (const piece of (CHARACTER_EQUIVALENTS[char] ?? char).toLowerCase()) {
      text += piece;
      offsets.push(index);
    }
    previousWasSpace = false;
  }
  if (text.endsWith(" ")) {
    text = text.slice(0, -1);
    offsets.pop();
  }
  return { text, offsets };
}

/** Locates model quotes inside one source document. */
export interface EvidenceVerifier {
  /**
   * @param quote - text the model claims is verbatim.
   * @returns the exact source span, or null when the quote is not in the document.
   */
  locate(quote: string): Evidence | null;
}

/**
 * Prepares a verifier for a source document. Normalisation of the source happens once.
 * A quote verifies only if its normalised form is a contiguous substring of the normalised
 * source and at least {@link MIN_QUOTE_CHARS} long; partial overlaps and paraphrases fail.
 * @param source - the original, unredacted document text.
 */
export function createEvidenceVerifier(source: string): EvidenceVerifier {
  const normalizedSource = normalizeForMatch(source);
  return {
    locate(quote) {
      const needle = normalizeForMatch(quote.replace(QUOTE_WRAPPER, "")).text;
      if (needle.length < MIN_QUOTE_CHARS) return null;
      const start = normalizedSource.text.indexOf(needle);
      if (start < 0) return null;
      const offset = normalizedSource.offsets[start] ?? 0;
      const end = (normalizedSource.offsets[start + needle.length - 1] ?? offset) + 1;
      return { quote: source.slice(offset, end), offset, length: end - offset };
    },
  };
}

/** Result of verifying a list of quoted items. */
export interface VerifiedItems<T> {
  items: (Omit<T, "quote"> & { id: string; evidence: Evidence })[];
  verified: number;
  total: number;
}

/**
 * Keeps only items whose quote is found in the source, attaching the exact evidence span
 * and a stable id. Unverified items are dropped and counted.
 * @param items - model items that each carry a `quote`.
 * @param verifier - from {@link createEvidenceVerifier}.
 * @param idPrefix - prefix for generated ids, for example "clause".
 */
export function verifyItems<T extends { quote: string }>(
  items: readonly T[],
  verifier: EvidenceVerifier,
  idPrefix: string,
): VerifiedItems<T> {
  const verifiedItems: VerifiedItems<T>["items"] = [];
  for (const item of items) {
    const evidence = verifier.locate(item.quote);
    if (!evidence) continue;
    const { quote: _quote, ...rest } = item;
    verifiedItems.push({ ...rest, id: `${idPrefix}-${verifiedItems.length + 1}`, evidence });
  }
  return { items: verifiedItems, verified: verifiedItems.length, total: items.length };
}
