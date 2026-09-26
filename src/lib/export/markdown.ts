import type { AnalysisResult, Obligation } from "@/lib/schemas/analysis";
import { SEVERITY_DISPLAY } from "@/lib/utils/format";

const DISCLAIMER =
  "_Prepared with ClauseWise. This is legal information, not legal advice. Please confirm every point with a qualified lawyer._";

/** Collapses whitespace so quotes stay on one Markdown line. */
const inline = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * Renders obligations as a Markdown checklist, keeping relative deadlines in their own words.
 * @param obligations - verified obligations.
 * @param documentTitle - heading for the checklist.
 */
export function obligationsToMarkdown(
  obligations: readonly Obligation[],
  documentTitle: string,
): string {
  const items = obligations.map(
    (item) =>
      `- [ ] **${item.party}:** ${item.action}\n  - When: ${item.deadline}${item.dueDate ? ` (${item.dueDate})` : ""}\n  - If missed: ${item.consequence}\n  - Source: "${inline(item.evidence.quote)}"`,
  );
  return [`# Obligations and deadlines: ${documentTitle}`, "", ...items, "", DISCLAIMER, ""].join(
    "\n",
  );
}

/**
 * Renders the Lawyer Prep Pack: case summary, balance, key risks, questions, gaps and
 * documents to bring.
 * @param result - the verified analysis.
 * @param documentName - original file name.
 */
export function prepPackToMarkdown(result: AnalysisResult, documentName: string): string {
  const { brief, prep, balance, risks } = result;
  const list = (items: readonly string[], empty: string) =>
    items.length ? items.map((item) => `- ${item}`) : [`- ${empty}`];
  return [
    `# Lawyer Prep Pack: ${brief.title}`,
    "",
    `Document: ${documentName}  `,
    `Your role: ${brief.userParty}  `,
    `Balance score: ${balance.score === null ? "not scored" : `${balance.score}/100`} (${balance.verdict})`,
    "",
    "## Case summary",
    "",
    prep.caseSummary,
    "",
    "## Questions to ask a lawyer",
    "",
    ...prep.questions.map((question, index) => `${index + 1}. ${question}`),
    "",
    "## Key risks",
    "",
    ...list(
      risks.map(
        (risk) =>
          `**${SEVERITY_DISPLAY[risk.severity].label}: ${risk.title}.** ${risk.whatCouldGoWrong}`,
      ),
      "No verified risks.",
    ),
    "",
    "## Information gaps in the document",
    "",
    ...list(prep.informationGaps, "None identified."),
    "",
    "## Documents to bring",
    "",
    ...list(prep.documentsToBring, "The signed or draft document itself."),
    "",
    DISCLAIMER,
    "",
  ].join("\n");
}
