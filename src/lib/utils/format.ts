import type { ClauseCategory, Severity, Tilt } from "@/lib/schemas/analysis";
import type { DocumentType } from "@/lib/schemas/document";

/** Visual tone shared by badges and cards. Colour is always paired with text and an icon. */
export type Tone = "good" | "neutral" | "warn" | "bad" | "info";

/** Human labels and tone for each tilt value. */
export const TILT_DISPLAY: Record<Tilt, { label: string; tone: Tone }> = {
  FAVORS_YOU: { label: "Favours you", tone: "good" },
  NEUTRAL: { label: "Neutral", tone: "neutral" },
  FAVORS_COUNTERPARTY: { label: "Favours the other side", tone: "warn" },
  HEAVILY_FAVORS_COUNTERPARTY: { label: "Heavily favours the other side", tone: "bad" },
};

/** Human labels and tone for each risk severity. */
export const SEVERITY_DISPLAY: Record<Severity, { label: string; tone: Tone }> = {
  HIGH: { label: "High risk", tone: "bad" },
  MEDIUM: { label: "Medium risk", tone: "warn" },
  LOW: { label: "Low risk", tone: "neutral" },
  INFO: { label: "For information", tone: "info" },
};

/** Human labels for clause categories. */
export const CATEGORY_LABELS: Record<ClauseCategory, string> = {
  termination: "Termination",
  payment: "Payment",
  liability: "Liability",
  confidentiality: "Confidentiality",
  renewal: "Renewal",
  jurisdiction: "Jurisdiction",
  indemnity: "Indemnity",
  penalty: "Penalty",
  notice: "Notice",
  other: "Other",
};

/** Human labels for detected document types. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  rental: "Rental agreement",
  employment: "Employment document",
  nda: "Non-disclosure agreement",
  loan: "Loan document",
  service: "Service contract",
  other: "Legal document",
};

/**
 * Formats a count with a singular or plural noun.
 * @param count - how many.
 * @param singular - noun for one.
 * @param plural - noun for many; defaults to singular + "s".
 */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString("en-IN")} ${count === 1 ? singular : plural}`;
}
