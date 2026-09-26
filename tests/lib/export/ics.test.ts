import { buildIcs, escapeIcsText, foldIcsLine } from "@/lib/export/ics";
import type { Obligation } from "@/lib/schemas/analysis";

const obligation = (overrides: Partial<Obligation>): Obligation => ({
  id: "obligation-1",
  party: "Tenant",
  action: "Pay rent",
  deadline: "on or before 5 April 2026",
  dueDate: "2026-04-05",
  consequence: "Late fee",
  evidence: { quote: "rent, due; now", offset: 10, length: 14 },
  ...overrides,
});

const NOW = new Date("2026-09-26T10:20:30.000Z");

describe("escapeIcsText", () => {
  it("escapes backslashes, semicolons, commas and newlines", () => {
    expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("foldIcsLine", () => {
  it("leaves short lines alone", () => {
    expect(foldIcsLine("SUMMARY:short")).toBe("SUMMARY:short");
  });

  it("folds long lines at 75 octets with CRLF and a space", () => {
    const folded = foldIcsLine(`DESCRIPTION:${"x".repeat(200)}`);
    const lines = folded.split("\r\n");
    expect(lines.length).toBeGreaterThan(2);
    expect(lines.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(lines.slice(1).every((line) => line.startsWith(" "))).toBe(true);
  });

  it("never splits a multi-byte character", () => {
    const folded = foldIcsLine(`SUMMARY:${"किराया".repeat(20)}`);
    expect(folded.split("\r\n ").join("")).toBe(`SUMMARY:${"किराया".repeat(20)}`);
  });
});

describe("buildIcs", () => {
  const ics = buildIcs(
    [obligation({}), obligation({ id: "obligation-2", dueDate: null, deadline: "within 30 days" })],
    "Lease, flat 402",
    NOW,
  );

  it("wraps events in a valid VCALENDAR with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/\n/);
  });

  it("creates all-day events only for absolute dates", () => {
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260405");
    expect(ics).toContain("DTEND;VALUE=DATE:20260406");
    expect(ics).toContain("DTSTAMP:20260926T102030Z");
    expect(ics).toContain("UID:obligation-1-20260405@clausewise");
  });

  it("escapes commas and semicolons in text fields", () => {
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("Lease\\, flat 402");
    expect(unfolded).toContain("rent\\, due\\; now");
  });

  it("produces an empty calendar when no deadline has a date", () => {
    const empty = buildIcs([obligation({ dueDate: null })], "Doc", NOW);
    expect(empty).not.toContain("BEGIN:VEVENT");
  });
});
