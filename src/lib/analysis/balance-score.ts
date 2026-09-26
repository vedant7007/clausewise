import type { Balance, ClauseCategory, Tilt } from "@/lib/schemas/analysis";
import { BALANCE_BANDS, CATEGORY_WEIGHTS, TILT_POINTS, UNSCORED_VERDICT } from "./clause-weights";

const MIN_SCORE = 0;
const MAX_SCORE = 100;

/** The two clause fields the score depends on. */
export interface ScorableClause {
  category: ClauseCategory;
  tilt: Tilt;
}

/**
 * Maps a score to its verdict text.
 * @param score - 0 to 100; out-of-range values are clamped.
 */
export function verdictFor(score: number): string {
  const clamped = Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
  const band = BALANCE_BANDS.find(({ min }) => clamped >= min);
  return band?.verdict ?? UNSCORED_VERDICT;
}

/**
 * Computes the balance score deterministically: a category-weighted average of tilt points,
 * rounded and clamped to 0–100. The model never produces the score.
 * @param clauses - verified clauses.
 * @returns the score and verdict, or a null score when there is nothing to score.
 */
export function computeBalance(clauses: readonly ScorableClause[]): Balance {
  if (clauses.length === 0) return { score: null, verdict: UNSCORED_VERDICT };

  let weighted = 0;
  let totalWeight = 0;
  for (const { category, tilt } of clauses) {
    const weight = CATEGORY_WEIGHTS[category];
    weighted += weight * TILT_POINTS[tilt];
    totalWeight += weight;
  }
  const score = Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(weighted / totalWeight)));
  return { score, verdict: verdictFor(score) };
}
