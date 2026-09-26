import {
  createEvidenceVerifier,
  normalizeForMatch,
  verifyItems,
} from "@/lib/analysis/evidence-verifier";

const SOURCE = [
  "RENTAL AGREEMENT",
  "",
  "3. SECURITY DEPOSIT. The Tenant shall pay a security deposit of Rs. 1,50,000 (three",
  "months' rent) which the Landlord may   deduct from at his sole discretion.",
  "",
  "7. TERMINATION. The Landlord may terminate this agreement with 15 days’ notice.",
].join("\n");

const verifier = createEvidenceVerifier(SOURCE);

describe("normalizeForMatch", () => {
  it("lower-cases, collapses whitespace and maps offsets back", () => {
    const { text, offsets } = normalizeForMatch("  A \n\t B");
    expect(text).toBe("a b");
    expect(offsets).toEqual([2, 3, 7]);
  });
});

describe("createEvidenceVerifier", () => {
  it("verifies an exact quote and returns the source span", () => {
    const evidence = verifier.locate("The Landlord may terminate this agreement");
    expect(evidence).not.toBeNull();
    expect(SOURCE.slice(evidence!.offset, evidence!.offset + evidence!.length)).toBe(
      "The Landlord may terminate this agreement",
    );
  });

  it("tolerates case, line breaks and repeated spaces", () => {
    const evidence = verifier.locate(
      "rs. 1,50,000 (THREE months' rent) which the landlord may deduct",
    );
    expect(evidence).not.toBeNull();
    expect(evidence!.quote).toContain("(three\nmonths' rent)");
    expect(evidence!.quote).toContain("may   deduct");
  });

  it("tolerates curly versus straight apostrophes", () => {
    expect(verifier.locate("with 15 days' notice")).not.toBeNull();
  });

  it("strips wrapping quotes and ellipses the model adds", () => {
    expect(verifier.locate('"...security deposit of Rs. 1,50,000..."')).not.toBeNull();
  });

  it("rejects a fabricated quote", () => {
    expect(verifier.locate("The Tenant may terminate at any time without notice")).toBeNull();
  });

  it("rejects a paraphrase with partial overlap", () => {
    expect(verifier.locate("The Landlord may terminate this lease with 15 days notice")).toBeNull();
  });

  it("rejects quotes too short to be meaningful evidence", () => {
    expect(verifier.locate("the")).toBeNull();
  });

  it("reports the correct character offset", () => {
    const quote = "TERMINATION. The Landlord";
    expect(verifier.locate(quote)).toEqual({
      quote,
      offset: SOURCE.indexOf(quote),
      length: quote.length,
    });
  });
});

describe("verifyItems", () => {
  it("keeps verified items, drops unverified ones and counts both", () => {
    const items = [
      { title: "Deposit", quote: "security deposit of Rs. 1,50,000" },
      { title: "Invented", quote: "tenant receives free parking forever" },
      { title: "Termination", quote: "may terminate this agreement with 15 days" },
    ];
    const result = verifyItems(items, verifier, "clause");
    expect(result.verified).toBe(2);
    expect(result.total).toBe(3);
    expect(result.items.map((item) => item.title)).toEqual(["Deposit", "Termination"]);
    expect(result.items.map((item) => item.id)).toEqual(["clause-1", "clause-2"]);
    expect(result.items[0]).not.toHaveProperty("quote");
  });

  it("handles an empty list", () => {
    expect(verifyItems([], verifier, "risk")).toEqual({ items: [], verified: 0, total: 0 });
  });
});
