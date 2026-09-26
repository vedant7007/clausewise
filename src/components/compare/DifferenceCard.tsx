import { EvidenceDisclosure } from "@/components/analysis/EvidenceDisclosure";
import { Badge } from "@/components/ui/Badge";
import type { IconName } from "@/components/ui/Icon";
import type { ChangeType, Difference, Importance } from "@/lib/schemas/compare";
import type { Tone } from "@/lib/utils/format";

const CHANGE: Record<ChangeType, { label: string; icon: IconName }> = {
  ADDED: { label: "Only in document B", icon: "arrowUp" },
  REMOVED: { label: "Only in your document", icon: "arrowDown" },
  MODIFIED: { label: "Different in each", icon: "minus" },
};

const IMPORTANCE: Record<Importance, { label: string; tone: Tone }> = {
  HIGH: { label: "High importance", tone: "bad" },
  MEDIUM: { label: "Medium importance", tone: "warn" },
  LOW: { label: "Low importance", tone: "neutral" },
};

/** One verified difference between two documents. */
export function DifferenceCard({
  difference,
  leftName,
  rightName,
}: {
  difference: Difference;
  leftName: string;
  rightName: string;
}) {
  const change = CHANGE[difference.change];
  const importance = IMPORTANCE[difference.importance];
  return (
    <article
      className="rounded-xl border border-line bg-surface p-5"
      aria-labelledby={`${difference.id}-title`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={importance.tone}>{importance.label}</Badge>
        <Badge tone="info" icon={change.icon}>
          {difference.change.charAt(0) + difference.change.slice(1).toLowerCase()}: {change.label}
        </Badge>
      </div>
      <h3 id={`${difference.id}-title`} className="mt-3 font-serif text-lg font-semibold">
        {difference.topic}
      </h3>
      <p className="mt-1">{difference.whatChanged}</p>
      <p className="mt-3 rounded-lg bg-accent-soft p-3 text-sm">
        <strong>What this means for you: </strong>
        {difference.whatItMeansForYou}
      </p>
      <div className="grid gap-x-4 md:grid-cols-2">
        {difference.leftEvidence && (
          <EvidenceDisclosure
            evidence={difference.leftEvidence}
            label={`Show wording in ${leftName}`}
          />
        )}
        {difference.rightEvidence && (
          <EvidenceDisclosure
            evidence={difference.rightEvidence}
            label={`Show wording in ${rightName}`}
          />
        )}
      </div>
    </article>
  );
}
