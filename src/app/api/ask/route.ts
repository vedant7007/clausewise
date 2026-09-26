import { handleModelRoute } from "@/lib/http/model-route";
import { AskRequestSchema } from "@/lib/schemas/qa";
import { answerQuestion } from "@/lib/services/ask-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Answers a question using only the supplied document. */
export async function POST(request: Request): Promise<Response> {
  return handleModelRoute(request, AskRequestSchema, answerQuestion);
}
