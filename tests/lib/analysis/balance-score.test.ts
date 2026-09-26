import { computeBalance, verdictFor } from "@/lib/analysis/balance-score";
import { UNSCORED_VERDICT } from "@/lib/analysis/clause-weights";
import type { ClauseCategory, Tilt } from "@/lib/schemas/analysis";

const clause = (tilt: Tilt, category: ClauseCategory = "payment") => ({ tilt, category });

describe("computeBalance", () => {
  it("returns a null score for no clauses", () => {
    expect(computeBalance([])).toEqual({ score: null, verdict: UNSCORED_VERDICT });
  });

  it("scores an all-favourable document at 100", () => {
    expect(computeBalance([clause("FAVORS_YOU"), clause("FAVORS_YOU", "termination")])).toEqual({
      score: 100,
      verdict: "Favourable to you",
    });
  });

  it("scores an all-adverse document at 0", () => {
    const clauses = [
      clause("HEAVILY_FAVORS_COUNTERPARTY"),
      clause("HEAVILY_FAVORS_COUNTERPARTY", "liability"),
    ];
    expect(computeBalance(clauses)).toEqual({ score: 0, verdict: "Heavily one-sided against you" });
  });

  it("treats a fully neutral document as broadly balanced", () => {
    expect(computeBalance([clause("NEUTRAL"), clause("NEUTRAL", "notice")])).toEqual({
      score: 75,
      verdict: "Broadly balanced",
    });
  });

  it("weights high-impact categories more than boilerplate", () => {
    const adverseLiability = computeBalance([
      clause("HEAVILY_FAVORS_COUNTERPARTY", "liability"),
      clause("FAVORS_YOU", "other"),
    ]);
    const adverseBoilerplate = computeBalance([
      clause("HEAVILY_FAVORS_COUNTERPARTY", "other"),
      clause("FAVORS_YOU", "liability"),
    ]);
    expect(adverseLiability.score).toBe(22);
    expect(adverseBoilerplate.score).toBe(78);
  });

  it("is deterministic for the same input", () => {
    const clauses = [clause("FAVORS_COUNTERPARTY", "renewal"), clause("NEUTRAL", "jurisdiction")];
    expect(computeBalance(clauses)).toEqual(computeBalance([...clauses]));
  });
});

describe("verdictFor", () => {
  it("clamps out-of-range scores", () => {
    expect(verdictFor(150)).toBe("Favourable to you");
    expect(verdictFor(-20)).toBe("Heavily one-sided against you");
  });

  it("applies band minimums inclusively", () => {
    expect(verdictFor(60)).toBe("Broadly balanced");
    expect(verdictFor(59)).toBe("Leans against you");
    expect(verdictFor(20)).toBe("Tilted against you");
  });
});
