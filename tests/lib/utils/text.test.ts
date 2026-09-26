import { hasElisionMarker, normalizeDocumentText, truncateMiddle } from "@/lib/utils/text";

describe("normalizeDocumentText", () => {
  it("unifies newlines, strips NULs and collapses blank lines", () => {
    expect(normalizeDocumentText("a\r\nb\u0000\n\n\n\nc  \n")).toBe("a\nb\n\nc");
  });
});

describe("truncateMiddle", () => {
  const lines = Array.from(
    { length: 400 },
    (_, i) => `Clause ${i + 1}: the parties agree to term ${i + 1}.`,
  );
  const long = lines.join("\n");

  it("returns short text unchanged", () => {
    expect(truncateMiddle("short", 100)).toEqual({
      text: "short",
      truncated: false,
      omittedChars: 0,
    });
  });

  it("keeps the head and tail and marks the gap", () => {
    const bounded = truncateMiddle(long, 4_000);
    expect(bounded.truncated).toBe(true);
    expect(bounded.text.startsWith("Clause 1:")).toBe(true);
    expect(bounded.text.endsWith("term 400.")).toBe(true);
    expect(hasElisionMarker(bounded.text)).toBe(true);
    expect(bounded.omittedChars).toBeGreaterThan(0);
  });

  it("cuts on line boundaries rather than mid-clause", () => {
    const [head, tail] = truncateMiddle(long, 4_000).text.split(/\n\n\[\.\.\..*\.\.\.\]\n\n/);
    expect(head).toMatch(/\.$/);
    expect(tail).toMatch(/^Clause \d+:/);
  });

  it("stays within the budget plus the marker", () => {
    const bounded = truncateMiddle(long, 4_000);
    expect(bounded.text.length).toBeLessThanOrEqual(4_000 + 80);
  });
});
