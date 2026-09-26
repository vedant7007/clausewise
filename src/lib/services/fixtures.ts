import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { type AnalysisResult, AnalysisResultSchema } from "@/lib/schemas/analysis";
import type { SampleId } from "@/lib/schemas/document";

const FIXTURE_DIR = path.join(process.cwd(), "src", "data", "fixtures");

/**
 * Loads the saved analysis of a bundled sample, used only when the live model is unavailable.
 * The result is always marked `source: "fixture"` so it is never shown as a live result.
 * @param id - sample identifier.
 * @returns the validated fixture, or null if it is missing or invalid.
 */
export async function loadFixture(id: SampleId): Promise<AnalysisResult | null> {
  try {
    const json: unknown = JSON.parse(await readFile(path.join(FIXTURE_DIR, `${id}.json`), "utf8"));
    const parsed = AnalysisResultSchema.safeParse(json);
    return parsed.success ? { ...parsed.data, source: "fixture" } : null;
  } catch {
    return null;
  }
}
