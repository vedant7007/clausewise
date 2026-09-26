import { MAX_FILE_BYTES } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import {
  DocumentTextSchema,
  type OutputOptions,
  OutputOptionsSchema,
  type SampleId,
  SampleIdSchema,
} from "@/lib/schemas/document";

/** Headroom for multipart boundaries and form fields around the file itself. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const PASTED_TEXT_NAME = "Pasted text";

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
 * @throws AppError FILE_TOO_LARGE or INVALID_INPUT.
 */
export async function readAnalyzeInput(request: Request): Promise<AnalyzeInput> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_FILE_BYTES + MULTIPART_OVERHEAD_BYTES) {
    throw new AppError(
      "FILE_TOO_LARGE",
      "That file is larger than 8 MB. Please upload a smaller one.",
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new AppError("INVALID_INPUT", "The request must be a multipart form.");
  }

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
  return {
    source: { kind: "text", name: PASTED_TEXT_NAME, text: parsedText.data },
    options: options.data,
  };
}
