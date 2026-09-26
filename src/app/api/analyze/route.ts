import { isAIConfigured } from "@/lib/ai";
import { AppError } from "@/lib/errors";
import { readAnalyzeInput } from "@/lib/http/analyze-input";
import { ndjsonResponse } from "@/lib/http/ndjson";
import { errorResponse, rateLimitResponse } from "@/lib/http/responses";
import type { AnalyzeEvent } from "@/lib/schemas/analyze-stream";
import { runAnalyzeRequest } from "@/lib/services/analyze-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Room for a streamed analysis (about 35s), a retry, a fallback provider and a repair call. */
export const maxDuration = 300;

/** Analyses an uploaded file, pasted text or bundled sample, streaming staged progress. */
export async function POST(request: Request): Promise<Response> {
  const limited = rateLimitResponse(request);
  if (limited) return limited;

  try {
    const input = await readAnalyzeInput(request);
    if (input.source.kind !== "sample" && !isAIConfigured()) {
      throw new AppError("SERVICE_MISCONFIGURED", "The analysis service is not configured.");
    }
    return ndjsonResponse<AnalyzeEvent>((emit) => runAnalyzeRequest(input, emit));
  } catch (error) {
    return errorResponse(error);
  }
}
