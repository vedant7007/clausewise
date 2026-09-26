import type { AIManager } from "@/lib/ai/ai-manager";
import { createEvidenceVerifier } from "@/lib/analysis/evidence-verifier";
import { MODEL_CONTEXT_CHAR_BUDGET } from "@/lib/constants";
import { buildComparePrompt } from "@/lib/prompts/compare";
import {
  CompareModelOutputSchema,
  type CompareResult,
  type Difference,
  type Importance,
} from "@/lib/schemas/compare";
import type { OutputOptions } from "@/lib/schemas/document";
import { createRedactor, restorePiiDeep } from "@/lib/security/pii-redactor";
import { countInjectionAttempts } from "@/lib/security/prompt-defense";
import { truncateMiddle } from "@/lib/utils/text";

/** Each side gets half of the context budget. */
const SIDE_BUDGET = Math.floor(MODEL_CONTEXT_CHAR_BUDGET / 2);
const IMPORTANCE_ORDER: Record<Importance, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/** One side of a comparison. */
export interface CompareSide {
  name: string;
  text: string;
}

/**
 * Compares two documents. A difference is kept only if every quote it gives is found in the
 * matching document and it gives at least one quote; others are dropped and counted.
 * @param left - the reader's document.
 * @param right - another version, or a bundled fair baseline.
 * @param rightLabel - description of the right side for the model.
 * @param options - output language and reading level.
 * @param manager - AI manager.
 * @throws AppError from the AI manager.
 */
export async function compareDocuments(
  left: CompareSide,
  right: CompareSide,
  rightLabel: string,
  options: OutputOptions,
  manager: AIManager,
): Promise<CompareResult> {
  const redactor = createRedactor();
  const leftText = truncateMiddle(redactor.redact(left.text), SIDE_BUDGET).text;
  const rightText = truncateMiddle(redactor.redact(right.text), SIDE_BUDGET).text;

  const raw = await manager.generate({
    ...buildComparePrompt(leftText, rightText, rightLabel, options),
    schema: CompareModelOutputSchema,
  });
  const output = restorePiiDeep(raw, redactor.tokens);

  const leftVerifier = createEvidenceVerifier(left.text);
  const rightVerifier = createEvidenceVerifier(right.text);
  const differences: Difference[] = [];

  for (const { leftQuote, rightQuote, ...rest } of output.differences) {
    const leftEvidence = leftQuote ? leftVerifier.locate(leftQuote) : null;
    const rightEvidence = rightQuote ? rightVerifier.locate(rightQuote) : null;
    const allFound =
      Boolean(leftQuote) === Boolean(leftEvidence) &&
      Boolean(rightQuote) === Boolean(rightEvidence);
    if (!allFound || (!leftEvidence && !rightEvidence)) continue;
    differences.push({
      ...rest,
      id: `difference-${differences.length + 1}`,
      leftEvidence,
      rightEvidence,
    });
  }

  return {
    leftName: left.name,
    rightName: right.name,
    summary: output.summary,
    differences: differences.sort(
      (a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance],
    ),
    grounding: { verified: differences.length, total: output.differences.length },
    redactionCount: redactor.count,
    injectionsIgnored: countInjectionAttempts(left.text) + countInjectionAttempts(right.text),
  };
}
