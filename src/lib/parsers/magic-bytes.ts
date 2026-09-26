import type { DocumentKind } from "@/lib/schemas/document";

/** "%PDF-" */
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;
/** "PK\x03\x04": a ZIP local file header, which every DOCX starts with. */
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04] as const;
/** Bytes inspected when deciding whether a file is plain text. */
const TEXT_SNIFF_BYTES = 8_192;

/**
 * Checks whether a byte array begins with a signature.
 * @param bytes - file contents.
 * @param signature - expected leading bytes.
 */
export function startsWithSignature(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Heuristic plain-text check: no NUL bytes and valid UTF-8 in the leading bytes.
 * @param bytes - file contents.
 */
export function looksLikeText(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, TEXT_SNIFF_BYTES);
  if (head.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(head);
    return true;
  } catch {
    // A multi-byte character split exactly at the sniff boundary is still valid text.
    return head.length === TEXT_SNIFF_BYTES;
  }
}

/**
 * Confirms that file contents match the kind implied by its extension, so a renamed
 * executable or archive cannot pass as a document.
 * @param kind - the kind derived from the file extension.
 * @param bytes - file contents.
 * @returns true when the content signature matches.
 */
export function matchesKind(kind: DocumentKind, bytes: Uint8Array): boolean {
  switch (kind) {
    case "pdf":
      return startsWithSignature(bytes, PDF_SIGNATURE);
    case "docx":
      return startsWithSignature(bytes, ZIP_SIGNATURE);
    case "txt":
    case "md":
      return looksLikeText(bytes);
  }
}
