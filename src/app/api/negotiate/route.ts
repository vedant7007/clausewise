import { handleModelRoute } from "@/lib/http/model-route";
import { NegotiateRequestSchema } from "@/lib/schemas/negotiation";
import { draftNegotiation } from "@/lib/services/negotiate-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Drafts fairer rewrites and polite request messages for adverse clauses. */
export async function POST(request: Request): Promise<Response> {
  return handleModelRoute(request, NegotiateRequestSchema, async (body, manager) => ({
    items: await draftNegotiation(body, manager),
  }));
}
