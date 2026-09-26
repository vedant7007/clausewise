import type { z } from "zod";
import { getAIManager, isAIConfigured } from "@/lib/ai";
import type { AIManager } from "@/lib/ai/ai-manager";
import { AppError } from "@/lib/errors";
import { errorResponse, rateLimitResponse, readJsonBody } from "./responses";

/**
 * Shared handler for JSON, model-backed routes: rate limit, provider check, body validation,
 * one service call, and error mapping. Keeps each route file to a few lines.
 * @param request - incoming request.
 * @param schema - body schema.
 * @param service - business logic to run with the validated body.
 */
export async function handleModelRoute<Body, Result>(
  request: Request,
  schema: z.ZodType<Body>,
  service: (body: Body, manager: AIManager) => Promise<Result>,
): Promise<Response> {
  const limited = rateLimitResponse(request);
  if (limited) return limited;
  try {
    if (!isAIConfigured()) {
      throw new AppError("SERVICE_MISCONFIGURED", "The analysis service is not configured.");
    }
    const body = await readJsonBody(request, schema);
    const result = await service(body, getAIManager());
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
