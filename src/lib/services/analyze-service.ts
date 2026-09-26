import type { AIManager } from "@/lib/ai/ai-manager";
import { computeBalance } from "@/lib/analysis/balance-score";
import { createEvidenceVerifier, verifyItems } from "@/lib/analysis/evidence-verifier";
import { MODEL_CONTEXT_CHAR_BUDGET } from "@/lib/constants";
import { buildAnalyzePrompt } from "@/lib/prompts/analyze";
import {
  type AnalysisResult,
  AnalysisModelOutputSchema,
  type Severity,
} from "@/lib/schemas/analysis";
import type { AnalysisStage } from "@/lib/schemas/analyze-stream";
import type { OutputOptions } from "@/lib/schemas/document";
import { redactPii, restorePiiDeep } from "@/lib/security/pii-redactor";
import { countInjectionAttempts } from "@/lib/security/prompt-defense";
import { truncateMiddle } from "@/lib/utils/text";

const SEVERITY_ORDER: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INFO: 3 };

/**
 * Runs the full analysis pipeline: redact PII, count injection attempts, bound the context,
 * make one model call, restore PII, verify every quote, and score balance deterministically.
 * @param text - original document text (never stored).
 * @param options - output language and reading level.
 * @param manager - AI manager used for the single consolidated call.
 * @param onStage - progress callback.
 * @returns a verified analysis; unverified model claims are dropped and counted.
 * @throws AppError from the AI manager when the model is unavailable or output is invalid.
 */
export async function analyzeDocument(
  text: string,
  options: OutputOptions,
  manager: AIManager,
  onStage: (stage: AnalysisStage) => void = () => {},
): Promise<AnalysisResult> {
  onStage("redacting");
  const redaction = redactPii(text);
  const injectionsIgnored = countInjectionAttempts(text);
  const bounded = truncateMiddle(redaction.text, MODEL_CONTEXT_CHAR_BUDGET);

  onStage("analyzing");
  const raw = await manager.generate({
    ...buildAnalyzePrompt(bounded.text, options),
    schema: AnalysisModelOutputSchema,
  });

  onStage("verifying");
  const output = restorePiiDeep(raw, redaction.tokens);
  const verifier = createEvidenceVerifier(text);
  const clauses = verifyItems(output.clauses, verifier, "clause");
  const risks = verifyItems(output.risks, verifier, "risk");
  const obligations = verifyItems(output.obligations, verifier, "obligation");
  const groups = [clauses, risks, obligations];

  return {
    brief: output.brief,
    clauses: clauses.items,
    risks: [...risks.items].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    obligations: obligations.items,
    prep: output.prep,
    balance: computeBalance(clauses.items),
    grounding: {
      verified: groups.reduce((sum, group) => sum + group.verified, 0),
      total: groups.reduce((sum, group) => sum + group.total, 0),
    },
    redactionCount: redaction.count,
    injectionsIgnored,
    truncated: bounded.truncated,
    language: options.language,
    source: "live",
  };
}
