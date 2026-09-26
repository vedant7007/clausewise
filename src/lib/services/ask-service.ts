import type { AIManager } from "@/lib/ai/ai-manager";
import { createEvidenceVerifier } from "@/lib/analysis/evidence-verifier";
import { MODEL_CONTEXT_CHAR_BUDGET } from "@/lib/constants";
import { buildAskPrompt } from "@/lib/prompts/ask";
import type { Evidence } from "@/lib/schemas/evidence";
import { AnswerModelOutputSchema, type AnswerResult, type AskRequest } from "@/lib/schemas/qa";
import { createRedactor, restorePiiDeep } from "@/lib/security/pii-redactor";
import { countInjectionAttempts } from "@/lib/security/prompt-defense";
import { truncateMiddle } from "@/lib/utils/text";

/**
 * Answers a question strictly from the document. Quotes are verified against the original
 * text; if an answer claims support but none of its quotes can be found, confidence is
 * lowered to LOW so the UI never presents unsupported certainty.
 * @param request - validated question, document and output options.
 * @param manager - AI manager.
 * @returns the answer with verified evidence only.
 * @throws AppError from the AI manager.
 */
export async function answerQuestion(
  request: AskRequest,
  manager: AIManager,
): Promise<AnswerResult> {
  const redactor = createRedactor();
  const document = truncateMiddle(redactor.redact(request.documentText), MODEL_CONTEXT_CHAR_BUDGET);
  const question = redactor.redact(request.question);

  const raw = await manager.generate({
    ...buildAskPrompt(document.text, question, request),
    schema: AnswerModelOutputSchema,
  });
  const output = restorePiiDeep(raw, redactor.tokens);

  const verifier = createEvidenceVerifier(request.documentText);
  const evidence = output.quotes
    .map((quote) => verifier.locate(quote))
    .filter((item): item is Evidence => item !== null);
  const unsupported = output.status === "ANSWERED" && evidence.length === 0;

  return {
    status: output.status,
    answer: output.answer,
    evidence,
    confidence: unsupported ? "LOW" : output.confidence,
    grounding: { verified: evidence.length, total: output.quotes.length },
    injectionsIgnored:
      countInjectionAttempts(request.documentText) + countInjectionAttempts(request.question),
  };
}
