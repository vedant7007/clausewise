import type { AnalysisResult } from "./analysis";
import type { SampleId } from "./document";

/** Progress stages reported to the UI while an analysis runs. */
export const ANALYSIS_STAGES = ["parsing", "redacting", "analyzing", "verifying"] as const;
export type AnalysisStage = (typeof ANALYSIS_STAGES)[number];

/** The document the analysis ran on, returned so the browser can hold it in memory. */
export interface SessionDocument {
  name: string;
  text: string;
  sampleId: SampleId | null;
}

/** Events streamed by POST /api/analyze, one JSON object per line. */
export type AnalyzeEvent =
  | { type: "stage"; stage: AnalysisStage }
  | { type: "result"; document: SessionDocument; result: AnalysisResult }
  | { type: "error"; code: string; message: string };
