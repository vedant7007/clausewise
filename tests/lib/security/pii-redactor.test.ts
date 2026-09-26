import { redactPii, restorePii, restorePiiDeep } from "@/lib/security/pii-redactor";

describe("redactPii", () => {
  it("masks email addresses", () => {
    const { text, count } = redactPii("Contact priya.k+lease@example.co.in for repairs.");
    expect(text).toBe("Contact [EMAIL_1] for repairs.");
    expect(count).toBe(1);
  });

  it("masks Indian mobile numbers with and without country code", () => {
    const { text } = redactPii("Call +91 98765 43210 or 9123456789.");
    expect(text).toBe("Call [PHONE_1] or [PHONE_2].");
  });

  it("masks Aadhaar-like 12-digit numbers, spaced or not", () => {
    const { text } = redactPii("Aadhaar 2345 6789 0123 and 234567890123.");
    expect(text).toBe("Aadhaar [AADHAAR_1] and [AADHAAR_2].");
  });

  it("masks PAN-like identifiers", () => {
    expect(redactPii("PAN: ABCDE1234F.").text).toBe("PAN: [PAN_1].");
  });

  it("masks long digit runs such as account numbers", () => {
    expect(redactPii("Account 00123456789012 at the bank.").text).toBe(
      "Account [NUMBER_1] at the bank.",
    );
  });

  it("does not touch ordinary numbers, amounts, dates or clause references", () => {
    const text =
      "Rent of Rs. 25,000 is due by 5 March 2026 under Clause 12.3; deposit Rs. 1,50,000 within 30 days.";
    expect(redactPii(text)).toMatchObject({ text, count: 0 });
  });

  it("reuses one token for a repeated value and counts every occurrence", () => {
    const { text, count, tokens } = redactPii("a@b.com wrote to a@b.com");
    expect(text).toBe("[EMAIL_1] wrote to [EMAIL_1]");
    expect(count).toBe(2);
    expect(tokens.size).toBe(1);
  });
});

describe("restorePii", () => {
  it("round-trips a redacted document exactly", () => {
    const original =
      "Tenant: R. Rao, rao@mail.com, +91 90000 11111, PAN ABCDE1234F, A/c 123456789012345.";
    const { text, tokens } = redactPii(original);
    expect(text).not.toContain("rao@mail.com");
    expect(restorePii(text, tokens)).toBe(original);
  });

  it("leaves unknown tokens in place", () => {
    expect(restorePii("see [EMAIL_9]", new Map([["[EMAIL_1]", "x@y.com"]]))).toBe("see [EMAIL_9]");
  });

  it("restores tokens throughout nested model output", () => {
    const { tokens } = redactPii("mail x@y.com");
    const output = { clauses: [{ quote: "notify [EMAIL_1]", n: 3 }], ok: true, none: null };
    expect(restorePiiDeep(output, tokens)).toEqual({
      clauses: [{ quote: "notify x@y.com", n: 3 }],
      ok: true,
      none: null,
    });
  });
});
