import { extractText as extractPdfText, getDocumentProxy } from "unpdf";
import {
  MAX_FILE_BYTES,
  MAX_TEXT_CHARS,
  MIN_DOCUMENT_CHARS,
  MIN_PDF_TEXT_CHARS,
} from "@/lib/constants";
import { AppError } from "@/lib/errors";
import type { DocumentKind, ParsedDocument } from "@/lib/schemas/document";
import { normalizeDocumentText } from "@/lib/utils/text";
import { matchesKind } from "./magic-bytes";

const EXTENSION_KINDS: Record<string, DocumentKind> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
  md: "md",
  markdown: "md",
};

const ALLOWED_MIME_TYPES: Record<DocumentKind, readonly string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
  md: ["text/markdown", "text/x-markdown", "text/plain"],
};

/** Browsers send these when they cannot tell; the magic-byte check still applies. */
const GENERIC_MIME_TYPES: readonly string[] = ["", "application/octet-stream"];

/** An uploaded file as received by the API. */
export interface UploadedFile {
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}

const UNSUPPORTED = "Please upload a PDF, Word (.docx), text (.txt) or Markdown (.md) file.";

/**
 * Derives the document kind from a file name's extension.
 * @param fileName - the uploaded file's name.
 * @throws AppError UNSUPPORTED_FILE for any other extension.
 */
export function kindFromFileName(fileName: string): DocumentKind {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  const kind = EXTENSION_KINDS[extension];
  if (!kind || !fileName.includes(".")) throw new AppError("UNSUPPORTED_FILE", UNSUPPORTED);
  return kind;
}

/**
 * Validates size, extension, declared MIME type and magic bytes, in that order.
 * @param file - the uploaded file.
 * @returns the verified document kind.
 * @throws AppError FILE_TOO_LARGE, EMPTY_DOCUMENT or UNSUPPORTED_FILE.
 */
export function validateUpload(file: UploadedFile): DocumentKind {
  if (file.bytes.length > MAX_FILE_BYTES) {
    throw new AppError(
      "FILE_TOO_LARGE",
      "That file is larger than 8 MB. Please upload a smaller one.",
    );
  }
  if (file.bytes.length === 0) {
    throw new AppError("EMPTY_DOCUMENT", "That file is empty.");
  }
  const kind = kindFromFileName(file.fileName);
  const mime = file.mimeType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!ALLOWED_MIME_TYPES[kind].includes(mime) && !GENERIC_MIME_TYPES.includes(mime)) {
    throw new AppError("UNSUPPORTED_FILE", "The file type does not match its extension.");
  }
  if (!matchesKind(kind, file.bytes)) {
    throw new AppError("UNSUPPORTED_FILE", "The file contents do not match its extension.");
  }
  return kind;
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractPdfText(pdf, { mergePages: true });
  return text;
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value;
}

/**
 * Extracts raw text for a validated document kind.
 * @param kind - a kind already confirmed by {@link validateUpload}.
 * @param bytes - file contents.
 * @throws AppError UNSUPPORTED_FILE when the file is corrupt or unreadable.
 */
export async function extractText(kind: DocumentKind, bytes: Uint8Array): Promise<string> {
  try {
    if (kind === "pdf") return await extractPdf(bytes);
    if (kind === "docx") return await extractDocx(bytes);
    return new TextDecoder("utf-8").decode(bytes);
  } catch (error) {
    throw new AppError("UNSUPPORTED_FILE", "We could not read that file. It may be damaged.", {
      cause: error,
    });
  }
}

/**
 * Checks extracted text against the minimum and maximum lengths.
 * @param text - normalised document text.
 * @param kind - used to give scanned PDFs a specific message.
 * @throws AppError SCANNED_PDF, EMPTY_DOCUMENT or TEXT_TOO_LONG.
 */
export function assertTextBounds(text: string, kind: DocumentKind): void {
  if (kind === "pdf" && text.length < MIN_PDF_TEXT_CHARS) {
    throw new AppError(
      "SCANNED_PDF",
      "This PDF looks like a scanned image, so there is no text to read. Scanned documents (OCR) are not supported yet; please upload a text-based PDF, Word file or paste the text.",
    );
  }
  if (text.length < MIN_DOCUMENT_CHARS) {
    throw new AppError("EMPTY_DOCUMENT", "We could not find enough text in that document.");
  }
  if (text.length > MAX_TEXT_CHARS) {
    throw new AppError(
      "TEXT_TOO_LONG",
      "That document is longer than 120,000 characters. Please upload the relevant part.",
    );
  }
}

/**
 * Full upload pipeline: validate, extract, normalise and bound.
 * @param file - the uploaded file.
 * @returns the parsed document.
 * @throws AppError for every validation failure; never a raw parser error.
 */
export async function parseDocument(file: UploadedFile): Promise<ParsedDocument> {
  const kind = validateUpload(file);
  const text = normalizeDocumentText(await extractText(kind, file.bytes));
  assertTextBounds(text, kind);
  return { fileName: file.fileName, kind, text };
}
