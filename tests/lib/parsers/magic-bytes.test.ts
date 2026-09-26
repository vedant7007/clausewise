import { looksLikeText, matchesKind, startsWithSignature } from "@/lib/parsers/magic-bytes";

const encode = (text: string) => new TextEncoder().encode(text);

describe("magic bytes", () => {
  it("recognises a PDF signature", () => {
    expect(matchesKind("pdf", encode("%PDF-1.7\n..."))).toBe(true);
  });

  it("rejects a PDF extension on non-PDF content", () => {
    expect(matchesKind("pdf", encode("<html>not a pdf</html>"))).toBe(false);
  });

  it("recognises a DOCX (ZIP) signature", () => {
    expect(matchesKind("docx", new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]))).toBe(true);
  });

  it("rejects a DOCX extension on a PDF", () => {
    expect(matchesKind("docx", encode("%PDF-1.4"))).toBe(false);
  });

  it("accepts UTF-8 text, including non-Latin scripts", () => {
    expect(matchesKind("txt", encode("किराया समझौता: rent is due monthly."))).toBe(true);
  });

  it("rejects binary content posing as text", () => {
    expect(looksLikeText(new Uint8Array([0x4d, 0x5a, 0x00, 0x90]))).toBe(false);
  });

  it("rejects invalid UTF-8", () => {
    expect(matchesKind("md", new Uint8Array([0xc3, 0x28, 0x41]))).toBe(false);
  });

  it("handles input shorter than the signature", () => {
    expect(startsWithSignature(new Uint8Array([0x25]), [0x25, 0x50])).toBe(false);
  });
});
