import { MAX_FILE_BYTES } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import {
  assertTextBounds,
  kindFromFileName,
  parseDocument,
  validateUpload,
} from "@/lib/parsers/document-parser";
import { buildPdf } from "../../helpers/pdf";

vi.mock("mammoth", () => ({
  extractRawText: vi.fn(async () => ({
    value: "EMPLOYMENT AGREEMENT\r\n\r\n\r\nThe Employee shall serve a notice period of 60 days.",
  })),
}));

const encode = (text: string) => new TextEncoder().encode(text);
const CONTRACT = "This Agreement is made between the Landlord and the Tenant. Rent is due monthly.";
const DOCX_BYTES = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return "none";
  } catch (error) {
    return error instanceof AppError ? error.code : "not-app-error";
  }
}

describe("kindFromFileName", () => {
  it("maps supported extensions case-insensitively", () => {
    expect(kindFromFileName("Lease.PDF")).toBe("pdf");
    expect(kindFromFileName("offer.docx")).toBe("docx");
    expect(kindFromFileName("notes.markdown")).toBe("md");
  });

  it("rejects unsupported and missing extensions", () => {
    expect(() => kindFromFileName("payload.exe")).toThrow(AppError);
    expect(() => kindFromFileName("README")).toThrow(AppError);
  });
});

describe("validateUpload", () => {
  it("rejects files over 8 MB", () => {
    const bytes = new Uint8Array(MAX_FILE_BYTES + 1);
    expect(() => validateUpload({ fileName: "a.txt", mimeType: "text/plain", bytes })).toThrow(
      /larger than 8 MB/,
    );
  });

  it("rejects an empty file", () => {
    const upload = { fileName: "a.txt", mimeType: "text/plain", bytes: new Uint8Array() };
    expect(() => validateUpload(upload)).toThrow(AppError);
  });

  it("rejects a MIME type that contradicts the extension", () => {
    const upload = { fileName: "a.pdf", mimeType: "image/png", bytes: buildPdf(CONTRACT) };
    expect(() => validateUpload(upload)).toThrow(/does not match its extension/);
  });

  it("rejects a renamed file whose magic bytes do not match", () => {
    const upload = { fileName: "lease.pdf", mimeType: "application/pdf", bytes: encode(CONTRACT) };
    expect(() => validateUpload(upload)).toThrow(/contents do not match/);
  });

  it("accepts a generic MIME type when magic bytes match", () => {
    const upload = { fileName: "a.docx", mimeType: "application/octet-stream", bytes: DOCX_BYTES };
    expect(validateUpload(upload)).toBe("docx");
  });
});

describe("assertTextBounds", () => {
  it("flags short PDFs as scanned", () => {
    expect(() => assertTextBounds("x".repeat(150), "pdf")).toThrow(/scanned/);
  });

  it("rejects text over 120,000 characters", () => {
    expect(() => assertTextBounds("x".repeat(120_001), "txt")).toThrow(/120,000/);
  });

  it("rejects near-empty text documents", () => {
    expect(() => assertTextBounds("hello", "txt")).toThrow(AppError);
  });
});

describe("parseDocument", () => {
  it("parses and normalises a text file", async () => {
    const bytes = encode(`${CONTRACT}\r\n\r\n\r\n\r\nSigned.   \r\n`);
    const parsed = await parseDocument({ fileName: "lease.txt", mimeType: "text/plain", bytes });
    expect(parsed.kind).toBe("txt");
    expect(parsed.text).toBe(`${CONTRACT}\n\nSigned.`);
  });

  it("extracts text from a real PDF", async () => {
    const text = `${CONTRACT} `.repeat(4);
    const parsed = await parseDocument({
      fileName: "lease.pdf",
      mimeType: "application/pdf",
      bytes: buildPdf(text),
    });
    expect(parsed.text).toContain("Rent is due monthly");
  });

  it("reports a PDF with no text layer as scanned", async () => {
    const upload = { fileName: "scan.pdf", mimeType: "application/pdf", bytes: buildPdf("") };
    expect(await codeOf(parseDocument(upload))).toBe("SCANNED_PDF");
  });

  it("reports a corrupt PDF as unreadable", async () => {
    const upload = {
      fileName: "bad.pdf",
      mimeType: "application/pdf",
      bytes: encode("%PDF-garbage"),
    };
    expect(await codeOf(parseDocument(upload))).toBe("UNSUPPORTED_FILE");
  });

  it("extracts DOCX text through mammoth", async () => {
    const upload = { fileName: "offer.docx", mimeType: "", bytes: DOCX_BYTES };
    const parsed = await parseDocument(upload);
    expect(parsed.text).toBe(
      "EMPLOYMENT AGREEMENT\n\nThe Employee shall serve a notice period of 60 days.",
    );
  });
});
