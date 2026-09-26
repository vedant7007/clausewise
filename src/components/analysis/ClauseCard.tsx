import { Badge } from "@/components/ui/Badge";
import type { Clause } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils/cn";
import { CATEGORY_LABELS, TILT_DISPLAY, type Tone } from "@/lib/utils/format";
import { EvidenceDisclosure } from "./EvidenceDisclosure";

/** Coloured leading edge that reinforces, but never replaces, the tilt label. */
const EDGE: Record<Tone, string> = {
  good: "border-l-good",
  neutral: "border-l-line",
  warn: "border-l-warn",
  bad: "border-l-bad",
  info: "border-l-info",
};

/** One clause in the ledger: tilt first, then meaning and reason, then verifiable source. */
export function ClauseCard({ clause }: { clause: Clause }) {
  const tilt = TILT_DISPLAY[clause.tilt];
  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-l-4 border-line bg-surface p-5",
        EDGE[tilt.tone],
      )}
      aria-labelledby={`${clause.id}-title`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone={tilt.tone}>{tilt.label}</Badge>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {CATEGORY_LABELS[clause.category]}
        </span>
      </div>
      <h3 id={`${clause.id}-title`} className="mt-3 font-serif text-lg font-semibold">
        {clause.title}
      </h3>
      <p className="mt-1.5">{clause.meaning}</p>
      <p className="mt-2 text-sm text-muted">
        <span className="font-semibold text-ink">Why: </span>
        {clause.tiltReason}
      </p>
      <div className="mt-auto">
        <EvidenceDisclosure evidence={clause.evidence} />
      </div>
    </article>
  );
}
