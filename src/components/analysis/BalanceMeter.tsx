import type { Balance } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber } from "./AnimatedNumber";

const MAX_SCORE = 100;
const GOOD_FROM = 60;
const WARN_FROM = 40;
const ARC_RADIUS = 80;
/** Length of a half circle of ARC_RADIUS, used to draw the filled portion of the arc. */
const ARC_LENGTH = Math.PI * ARC_RADIUS;

/** Plain-English reading of each score range, from the most to the least favourable. */
const EXPLANATIONS: readonly { min: number; text: string }[] = [
  { min: 80, text: "Most important clauses protect you or are fair to both sides." },
  { min: 60, text: "Mostly standard terms, with a few points worth checking." },
  { min: 40, text: "Several important clauses favour the other side." },
  { min: 0, text: "Many important clauses favour the other side. Read the risks before signing." },
];

function tone(score: number): { text: string; stroke: string } {
  if (score >= GOOD_FROM) return { text: "text-good", stroke: "stroke-good" };
  if (score >= WARN_FROM) return { text: "text-warn", stroke: "stroke-warn" };
  return { text: "text-bad", stroke: "stroke-bad" };
}

/**
 * Balance score as an accessible meter and the visual centrepiece of the analysis: a large
 * numeral, a text verdict and a plain explanation carry the meaning; the arc only reinforces it.
 */
export function BalanceMeter({ balance }: { balance: Balance }) {
  const { score, verdict } = balance;
  const headingId = "balance-heading";

  if (score === null) {
    return (
      <section aria-labelledby={headingId}>
        <h2 id={headingId} className="text-sm font-semibold uppercase tracking-wide text-muted">
          Balance score
        </h2>
        <p className="mt-2 text-lg font-semibold">{verdict}</p>
      </section>
    );
  }

  const colours = tone(score);
  const explanation = EXPLANATIONS.find(({ min }) => score >= min)?.text;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-sm font-semibold uppercase tracking-wide text-muted">
        Balance score
      </h2>
      <div
        role="meter"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={MAX_SCORE}
        aria-valuenow={score}
        aria-valuetext={`${score} out of ${MAX_SCORE}: ${verdict}`}
        className="relative mx-auto mt-3 w-full max-w-[240px]"
      >
        <svg viewBox="0 0 200 110" aria-hidden="true" focusable="false" className="w-full">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            className="stroke-line"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(score / MAX_SCORE) * ARC_LENGTH} ${ARC_LENGTH}`}
            className={cn(colours.stroke, "arc-grow")}
          />
        </svg>
        <p className="absolute inset-x-0 bottom-0 flex items-baseline justify-center gap-1">
          <span className={cn("font-serif text-5xl font-semibold tabular-nums", colours.text)}>
            <AnimatedNumber value={score} />
          </span>
          <span className="text-muted">/ {MAX_SCORE}</span>
        </p>
      </div>
      <p className="mt-3 text-center text-lg font-semibold">{verdict}</p>
      {explanation && <p className="mt-1 text-center text-sm text-muted">{explanation}</p>}
      <p className="mt-4 text-xs text-muted">
        Calculated by ClauseWise from each verified clause&apos;s tilt, weighted by how much that
        type of clause matters. The model does not choose this number.
      </p>
    </section>
  );
}
