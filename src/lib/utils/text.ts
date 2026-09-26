/** Share of the context budget kept from the start of a long document. */
const HEAD_SHARE = 0.7;
/** How far back from a cut point to look for a paragraph or line break. */
const BOUNDARY_SEARCH_CHARS = 400;

const MARKER_PATTERN = /\[\.\.\. [\d,]+ characters omitted for length \.\.\.\]/;

/**
 * Normalises extracted document text: unified newlines, no NUL bytes, no trailing spaces,
 * and at most one blank line in a row.
 * @param raw - text from any parser.
 * @returns cleaned text; never throws.
 */
export function normalizeDocumentText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Result of bounding a document to the model context budget. */
export interface BoundedText {
  text: string;
  truncated: boolean;
  omittedChars: number;
}

function cutBackToBoundary(text: string, index: number): number {
  const window = text.slice(Math.max(0, index - BOUNDARY_SEARCH_CHARS), index);
  const paragraph = window.lastIndexOf("\n\n");
  const line = window.lastIndexOf("\n");
  const found = paragraph >= 0 ? paragraph : line;
  return found >= 0 ? index - window.length + found : index;
}

function cutForwardToBoundary(text: string, index: number): number {
  const window = text.slice(index, index + BOUNDARY_SEARCH_CHARS);
  const found = window.indexOf("\n");
  return found >= 0 ? index + found + 1 : index;
}

/**
 * Keeps the head and tail of a long document, cutting on line boundaries, and marks the gap.
 * Headings, parties and definitions live at the start; signatures, governing law and
 * termination often live at the end, so both are kept.
 * @param text - the full document.
 * @param budget - maximum characters to keep, excluding the marker.
 * @returns the bounded text and how much was left out.
 */
export function truncateMiddle(text: string, budget: number): BoundedText {
  if (text.length <= budget) return { text, truncated: false, omittedChars: 0 };

  const headEnd = cutBackToBoundary(text, Math.floor(budget * HEAD_SHARE));
  const tailStart = cutForwardToBoundary(text, text.length - (budget - headEnd));
  const omittedChars = tailStart - headEnd;
  const marker = `\n\n[... ${omittedChars.toLocaleString("en-US")} characters omitted for length ...]\n\n`;

  return {
    text: text.slice(0, headEnd).trimEnd() + marker + text.slice(tailStart).trimStart(),
    truncated: true,
    omittedChars,
  };
}

/**
 * Reports whether a string contains the elision marker produced by {@link truncateMiddle}.
 * @param text - any string.
 */
export function hasElisionMarker(text: string): boolean {
  return MARKER_PATTERN.test(text);
}
