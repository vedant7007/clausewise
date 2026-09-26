import { checkAIReachability } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports whether the analysis model is reachable. Returns no key state, provider names or
 * error details; "not_configured" and "unreachable" both surface as a degraded status.
 */
export async function GET(): Promise<Response> {
  const ai = await checkAIReachability();
  return Response.json(
    { status: ai === "reachable" ? "ok" : "degraded", ai, time: new Date().toISOString() },
    { status: ai === "reachable" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
