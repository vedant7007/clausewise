import "server-only";
import { getAIManager } from "@/lib/ai";
import { AppError } from "@/lib/errors";
import type { AnalyzeInput } from "@/lib/http/analyze-input";
import { parseDocument } from "@/lib/parsers/document-parser";
import type { AnalysisResult } from "@/lib/schemas/analysis";
import type { AnalyzeEvent, SessionDocument } from "@/lib/schemas/analyze-stream";
import { SAMPLE_CATALOG } from "@/data/sample-catalog";
import { analyzeDocument } from "./analyze-service";
import { loadFixture } from "./fixtures";
import { readSample } from "./samples";

/** Failures where a saved sample analysis may stand in for the live model. */
const FIXTURE_ELIGIBLE_CODES = new Set(["AI_UNAVAILABLE", "SERVICE_MISCONFIGURED"]);

async function resolveDocument(input: AnalyzeInput): Promise<SessionDocument> {
  const { source } = input;
  if (source.kind === "sample") {
    const entry = SAMPLE_CATALOG.find((sample) => sample.id === source.sampleId);
    return {
      name: entry?.fileName ?? source.sampleId,
      text: await readSample(source.sampleId),
      sampleId: source.sampleId,
    };
  }
  if (source.kind === "text") return { name: source.name, text: source.text, sampleId: null };

  const parsed = await parseDocument({
    fileName: source.file.name,
    mimeType: source.file.type,
    bytes: new Uint8Array(await source.file.arrayBuffer()),
  });
  return { name: parsed.fileName, text: parsed.text, sampleId: null };
}

async function analyzeWithFallback(
  document: SessionDocument,
  input: AnalyzeInput,
  emit: (event: AnalyzeEvent) => void,
): Promise<AnalysisResult> {
  try {
    return await analyzeDocument(document.text, input.options, getAIManager(), (stage) =>
      emit({ type: "stage", stage }),
    );
  } catch (error) {
    const eligible = error instanceof AppError && FIXTURE_ELIGIBLE_CODES.has(error.code);
    if (!eligible || !document.sampleId) throw error;
    const fixture = await loadFixture(document.sampleId);
    if (!fixture) throw error;
    console.warn(`[analyze] serving saved analysis for sample ${document.sampleId}`);
    return fixture;
  }
}

/**
 * Handles one analysis request end to end, emitting staged progress then the result.
 * Saved fixtures are used only for bundled samples and only when the model is unavailable.
 * @param input - validated request input.
 * @param emit - stream writer.
 * @throws AppError for parse failures and unrecoverable model failures.
 */
export async function runAnalyzeRequest(
  input: AnalyzeInput,
  emit: (event: AnalyzeEvent) => void,
): Promise<void> {
  emit({ type: "stage", stage: "parsing" });
  const document = await resolveDocument(input);
  const result = await analyzeWithFallback(document, input, emit);
  emit({ type: "result", document, result });
}
