import { Badge } from "@/components/ui/Badge";
import type { Risk } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils/cn";
import { SEVERITY_DISPLAY } from "@/lib/utils/format";
import { EvidenceDisclosure } from "./EvidenceDisclosure";

const EDGE: Record<Risk["severity"], string> = {
  HIGH: "border-l-bad",
  MEDIUM: "border-l-warn",
  LOW: "border-l-line",
  INFO: "border-l-info",
};

/**
 * One risk: what the clause says, what could go wrong, who it hurts and a next step.
 * Severity is given as a text label and icon; the coloured edge only reinforces it.
 */
export function RiskCard({ risk }: { risk: Risk }) {
  const severity = SEVERITY_DISPLAY[risk.severity];
  return (
    <article
      aria-labelledby={`${risk.id}-title`}
      className={cn("rounded-xl border border-l-4 border-line bg-surface p-5", EDGE[risk.severity])}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={severity.tone}>{severity.label}</Badge>
        <h3 id={`${risk.id}-title`} className="font-serif text-lg font-semibold">
          {risk.title}
        </h3>
      </div>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-muted">What it says</dt>
          <dd className="mt-0.5">{risk.whatItSays}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">What could go wrong</dt>
          <dd className="mt-0.5">{risk.whatCouldGoWrong}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">Who it hurts</dt>
          <dd className="mt-0.5">{risk.whoItHurts}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">What you can do</dt>
          <dd className="mt-0.5">{risk.recommendedAction}</dd>
        </div>
      </dl>
      <EvidenceDisclosure evidence={risk.evidence} />
    </article>
  );
}
