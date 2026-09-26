import { obligationsToMarkdown, prepPackToMarkdown } from "@/lib/export/markdown";
import { RENTAL_RESULT } from "../../helpers/fixtures";

describe("obligationsToMarkdown", () => {
  it("renders a checklist that keeps relative deadlines and cites the source", () => {
    const markdown = obligationsToMarkdown(RENTAL_RESULT.obligations, "Lease");
    expect(markdown).toMatch(/^# Obligations and deadlines: Lease/);
    expect(markdown.match(/^- \[ \] /gm)).toHaveLength(RENTAL_RESULT.obligations.length);
    expect(markdown).toContain('Source: "');
    expect(markdown).toContain("not legal advice");
  });
});

describe("prepPackToMarkdown", () => {
  it("includes every prep section and numbered questions", () => {
    const markdown = prepPackToMarkdown(RENTAL_RESULT, "lease.pdf");
    for (const heading of [
      "## Case summary",
      "## Questions to ask a lawyer",
      "## Key risks",
      "## Information gaps in the document",
      "## Documents to bring",
    ]) {
      expect(markdown).toContain(heading);
    }
    expect(markdown).toContain("1. ");
    expect(markdown).toContain(`Balance score: ${RENTAL_RESULT.balance.score}/100`);
  });
});
