import { AppError } from "@/lib/errors";
import { MAX_FORM_BODY_BYTES, readFormLimited } from "./body-limit";
import {
  DocumentTextSchema,
  type OutputOptions,
  OutputOptionsSchema,
  type SampleId,
  SampleIdSchema,
} from "@/lib/schemas/document";

const PASTED_TEXT_NAME = "Pasted text";
const MAX_NAME_CHARS = 255;

/** Where the document to analyse comes from. */
export type AnalyzeSource =
  | { kind: "file"; file: File }
  | { kind: "sample"; sampleId: SampleId }
  | { kind: "text"; name: string; text: string };

/** Validated input for an analysis request. */
export interface AnalyzeInput {
  source: AnalyzeSource;
  options: OutputOptions;
}

/**
 * Reads and validates the multipart form for POST /api/analyze. Exactly one of `file`,
 * `sampleId` or `text` must be present.
 * @param request - incoming request.
 * @throws AppError PAYLOAD_TOO_LARGE or INVALID_INPUT.
 */
export async function readAnalyzeInput(request: Request): Promise<AnalyzeInput> {
  const form = await readFormLimited(request, MAX_FORM_BODY_BYTES);

  const options = OutputOptionsSchema.safeParse({
    language: form.get("language") ?? undefined,
    plainLanguage: form.get("plainLanguage") === "true",
  });
  if (!options.success) throw new AppError("INVALID_INPUT", "Unsupported output language.");

  const file = form.get("file");
  const sampleId = form.get("sampleId");
  const text = form.get("text");
  const provided = [file, sampleId, text].filter((value) => value !== null && value !== "");
  if (provided.length !== 1) {
    throw new AppError("INVALID_INPUT", "Provide exactly one document: a file, a sample or text.");
  }

  if (file instanceof File) return { source: { kind: "file", file }, options: options.data };

  if (sampleId !== null) {
    const parsed = SampleIdSchema.safeParse(sampleId);
    if (!parsed.success) throw new AppError("INVALID_INPUT", "Unknown sample document.");
    return { source: { kind: "sample", sampleId: parsed.data }, options: options.data };
  }

  const parsedText = DocumentTextSchema.safeParse(text);
  if (!parsedText.success) {
    throw new AppError("INVALID_INPUT", "Pasted text must be between 40 and 120,000 characters.");
  }
  const name = form.get("name");
  const displayName =
    typeof name === "string" && name.trim()
      ? name.trim().slice(0, MAX_NAME_CHARS)
      : PASTED_TEXT_NAME;
  return {
    source: { kind: "text", name: displayName, text: parsedText.data },
    options: options.data,
  };
}
