import type { Balance } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils/cn";

const MAX_SCORE = 100;
const GOOD_FROM = 60;
const WARN_FROM = 40;

function toneClass(score: number): string {
  if (score >= GOOD_FROM) return "text-good";
  if (score >= WARN_FROM) return "text-warn";
  return "text-bad";
}

/**
 * Balance score as an accessible meter: a numeric label and a text verdict carry the
 * meaning, and the coloured bar only reinforces it.
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

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-sm font-semibold uppercase tracking-wide text-muted">
        Balance score
      </h2>
      <p className="mt-1 flex items-baseline gap-2">
        <span className={cn("font-serif text-5xl font-semibold", toneClass(score))}>{score}</span>
        <span className="text-muted">/ {MAX_SCORE}</span>
      </p>
      <p className="text-lg font-semibold">{verdict}</p>
      <div
        role="meter"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={MAX_SCORE}
        aria-valuenow={score}
        aria-valuetext={`${score} out of ${MAX_SCORE}: ${verdict}`}
        className="relative mt-3 h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-bad via-warn to-good opacity-90"
      >
        <span
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-ink shadow"
          style={{ left: `${score}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted" aria-hidden="true">
        <span>One-sided against you</span>
        <span>Balanced or better</span>
      </div>
      <p className="mt-3 text-xs text-muted">
        Calculated by ClauseWise from each verified clause&apos;s tilt, weighted by how much that
        type of clause matters. The model does not choose this number.
      </p>
    </section>
  );
}
