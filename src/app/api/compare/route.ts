import { handleModelRoute } from "@/lib/http/model-route";
import { CompareRequestSchema } from "@/lib/schemas/compare";
import { compareWithRequest } from "@/lib/services/compare-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Compares two documents, or one document against a bundled fair baseline. */
export async function POST(request: Request): Promise<Response> {
  return handleModelRoute(request, CompareRequestSchema, compareWithRequest);
}
