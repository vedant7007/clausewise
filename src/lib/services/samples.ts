import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SampleId } from "@/lib/schemas/document";

const DATA_DIR = path.join(process.cwd(), "src", "data");

/**
 * Reads a bundled sample document. Files are traced into the serverless bundle through
 * `outputFileTracingIncludes` in next.config.
 * @param id - sample identifier.
 * @throws when the bundled file is missing, which indicates a build problem.
 */
export async function readSample(id: SampleId): Promise<string> {
  return readFile(path.join(DATA_DIR, "samples", `${id}.txt`), "utf8");
}

/**
 * Reads a bundled fair-baseline document for comparison.
 * @param id - baseline identifier; matches the sample document types.
 */
export async function readBaseline(id: SampleId): Promise<string> {
  return readFile(path.join(DATA_DIR, "baselines", `${id}.txt`), "utf8");
}
