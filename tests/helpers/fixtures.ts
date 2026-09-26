import rental from "@/data/fixtures/rental.json";
import { AnalysisResultSchema, type AnalysisResult } from "@/lib/schemas/analysis";
import type { AIManager } from "@/lib/ai/ai-manager";

/** A real, schema-validated analysis produced by the pipeline for the rental sample. */
export const RENTAL_RESULT: AnalysisResult = AnalysisResultSchema.parse(rental);

/**
 * Creates an AIManager stand-in whose `generate` resolves to the given outputs in order.
 * @param outputs - validated model outputs to return.
 */
export function fakeManager(...outputs: unknown[]) {
  const generate = vi.fn();
  for (const output of outputs) generate.mockResolvedValueOnce(output);
  return { manager: { generate } as unknown as AIManager, generate };
}
