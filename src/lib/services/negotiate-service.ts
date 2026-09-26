import type { AIManager } from "@/lib/ai/ai-manager";
import { buildNegotiatePrompt } from "@/lib/prompts/negotiate";
import {
  type NegotiateRequest,
  type NegotiationItem,
  NegotiationModelOutputSchema,
} from "@/lib/schemas/negotiation";
import { createRedactor, restorePiiDeep } from "@/lib/security/pii-redactor";

/**
 * Drafts a fairer rewrite and a polite request message for each adverse clause. Clause text
 * is redacted before inference and restored afterwards; suggestions for clause ids that were
 * not requested are discarded.
 * @param request - adverse clauses and output options.
 * @param manager - AI manager.
 * @returns one suggestion per requested clause the model covered, in request order.
 * @throws AppError from the AI manager.
 */
export async function draftNegotiation(
  request: NegotiateRequest,
  manager: AIManager,
): Promise<NegotiationItem[]> {
  const redactor = createRedactor();
  const clauses = request.clauses.map((clause) => ({
    ...clause,
    quote: redactor.redact(clause.quote),
  }));

  const raw = await manager.generate({
    ...buildNegotiatePrompt(clauses, request),
    schema: NegotiationModelOutputSchema,
  });
  const byId = new Map(
    restorePiiDeep(raw, redactor.tokens).items.map((item) => [item.clauseId, item]),
  );
  return request.clauses
    .map((clause) => byId.get(clause.id))
    .filter((item): item is NegotiationItem => item !== undefined);
}
