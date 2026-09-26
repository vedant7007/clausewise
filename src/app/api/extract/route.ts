import { AppError } from "@/lib/errors";
import { MAX_FORM_BODY_BYTES, readFormLimited } from "@/lib/http/body-limit";
import { errorResponse, rateLimitResponse } from "@/lib/http/responses";
import { parseDocument } from "@/lib/parsers/document-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Validates an uploaded file and returns its text, for the compare view. Nothing is stored. */
export async function POST(request: Request): Promise<Response> {
  const limited = rateLimitResponse(request);
  if (limited) return limited;
  try {
    const form = await readFormLimited(request, MAX_FORM_BODY_BYTES);
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError("INVALID_INPUT", "Attach one file.");
    const parsed = await parseDocument({
      fileName: file.name,
      mimeType: file.type,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    return Response.json(
      { name: parsed.fileName, text: parsed.text },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
