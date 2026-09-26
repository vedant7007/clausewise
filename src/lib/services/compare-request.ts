import "server-only";
import type { AIManager } from "@/lib/ai/ai-manager";
import type { CompareRequest, CompareResult } from "@/lib/schemas/compare";
import { SAMPLE_CATALOG } from "@/data/sample-catalog";
import { compareDocuments, type CompareSide } from "./compare-service";
import { readBaseline } from "./samples";

/**
 * Resolves the right-hand side of a compare request (an uploaded document or a bundled fair
 * baseline) and runs the comparison.
 * @param request - validated compare request.
 * @param manager - AI manager.
 * @throws AppError from the AI manager.
 */
export async function compareWithRequest(
  request: CompareRequest,
  manager: AIManager,
): Promise<CompareResult> {
  const { right } = request;
  if (right.mode === "document") {
    return compareDocuments(request.left, right, "another version", request, manager);
  }
  const title =
    SAMPLE_CATALOG.find((sample) => sample.id === right.baseline)?.title ?? right.baseline;
  const baseline: CompareSide = {
    name: `Fair baseline: ${title}`,
    text: await readBaseline(right.baseline),
  };
  return compareDocuments(
    request.left,
    baseline,
    "a fair, balanced reference document of the same type",
    request,
    manager,
  );
}
