import type { ClauseCategory, Tilt } from "@/lib/schemas/analysis";

/**
 * How much each clause category moves the balance score. Categories that decide who pays,
 * who bears losses and how you can leave weigh most; boilerplate weighs least.
 */
export const CATEGORY_WEIGHTS: Readonly<Record<ClauseCategory, number>> = {
  liability: 1.75,
  indemnity: 1.75,
  termination: 1.5,
  payment: 1.5,
  penalty: 1.5,
  renewal: 1.0,
  confidentiality: 1.0,
  notice: 0.75,
  jurisdiction: 0.75,
  other: 0.5,
};

/**
 * Points (0–100) a clause contributes from the reader's side. A neutral clause is fair,
 * so it scores well but below one that actively protects the reader.
 */
export const TILT_POINTS: Readonly<Record<Tilt, number>> = {
  FAVORS_YOU: 100,
  NEUTRAL: 75,
  FAVORS_COUNTERPARTY: 30,
  HEAVILY_FAVORS_COUNTERPARTY: 0,
};

/** Verdict bands, checked from the top; each applies at or above its minimum score. */
export const BALANCE_BANDS: readonly { min: number; verdict: string }[] = [
  { min: 80, verdict: "Favourable to you" },
  { min: 60, verdict: "Broadly balanced" },
  { min: 40, verdict: "Leans against you" },
  { min: 20, verdict: "Tilted against you" },
  { min: 0, verdict: "Heavily one-sided against you" },
];

/** Verdict shown when no verified clauses are available to score. */
export const UNSCORED_VERDICT = "Not enough verified clauses to score";

/** Tilt values that make a clause worth negotiating. */
export const ADVERSE_TILTS: ReadonlySet<Tilt> = new Set([
  "FAVORS_COUNTERPARTY",
  "HEAVILY_FAVORS_COUNTERPARTY",
]);
