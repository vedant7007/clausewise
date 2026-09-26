import type { OutputOptions } from "@/lib/schemas/document";
import { fenceUntrusted } from "@/lib/security/prompt-defense";
import { outputStyleInstruction, SYSTEM_POLICY } from "./system-policy";

const COMPARE_TASK = `TASK: Compare document A with document B for the reader, who is considering signing document A.

List the meaningful differences in obligations, money, rights, deadlines, liability and termination, most important first, usually 5 to 12. Ignore formatting and trivial wording.
- change: ADDED when the term appears only in B, REMOVED when it appears only in A, MODIFIED when both cover it differently.
- importance: HIGH, MEDIUM or LOW for the reader.
- whatChanged: one or two sentences describing the difference.
- whatItMeansForYou: the practical effect on the reader of signing A rather than B.
- leftQuote: verbatim text from A, or null if A has nothing on this topic.
- rightQuote: verbatim text from B, or null if B has nothing on this topic.
Also return a short overall summary.`;

/**
 * Builds the comparison prompt for two fenced documents.
 * @param left - redacted text of document A (the reader's document).
 * @param right - redacted text of document B (another version or a fair baseline).
 * @param rightLabel - how to describe document B to the model.
 * @param options - output language and reading level.
 */
export function buildComparePrompt(
  left: string,
  right: string,
  rightLabel: string,
  options: OutputOptions,
): { system: string; prompt: string } {
  return {
    system: `${SYSTEM_POLICY}\n\n${COMPARE_TASK}`,
    prompt: [
      outputStyleInstruction(options),
      `DOCUMENT A (the reader's document):\n${fenceUntrusted("A", left)}`,
      `DOCUMENT B (${rightLabel}):\n${fenceUntrusted("B", right)}`,
    ].join("\n\n"),
  };
}
