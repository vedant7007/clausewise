import { Badge } from "@/components/ui/Badge";
import type { Clause } from "@/lib/schemas/analysis";
import { CATEGORY_LABELS, TILT_DISPLAY } from "@/lib/utils/format";
import { EvidenceDisclosure } from "./EvidenceDisclosure";

/** One clause in the ledger: meaning, tilt with its reason, and verifiable source. */
export function ClauseCard({ clause }: { clause: Clause }) {
  const tilt = TILT_DISPLAY[clause.tilt];
  return (
    <article
      className="rounded-xl border border-line bg-surface p-5"
      aria-labelledby={`${clause.id}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 id={`${clause.id}-title`} className="font-serif text-lg font-semibold">
          {clause.title}
        </h3>
        <span className="rounded-md bg-paper px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
          {CATEGORY_LABELS[clause.category]}
        </span>
      </div>
      <p className="mt-2">{clause.meaning}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={tilt.tone}>{tilt.label}</Badge>
        <span className="text-sm text-muted">{clause.tiltReason}</span>
      </div>
      <EvidenceDisclosure evidence={clause.evidence} />
    </article>
  );
}
