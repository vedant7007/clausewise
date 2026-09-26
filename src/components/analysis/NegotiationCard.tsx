import { CopyButton } from "@/components/ui/CopyButton";
import type { Clause } from "@/lib/schemas/analysis";
import type { NegotiationItem } from "@/lib/schemas/negotiation";
import { EvidenceDisclosure } from "./EvidenceDisclosure";

/** Suggested fairer wording and a ready-to-send message for one adverse clause. */
export function NegotiationCard({ clause, item }: { clause: Clause; item: NegotiationItem }) {
  return (
    <article
      className="rounded-xl border border-line bg-surface p-5"
      aria-labelledby={`${clause.id}-negotiate`}
    >
      <h3 id={`${clause.id}-negotiate`} className="font-serif text-lg font-semibold">
        {clause.title}
      </h3>
      <p className="mt-1 text-sm text-muted">{clause.tiltReason}</p>
      <EvidenceDisclosure evidence={clause.evidence} label="Show current wording" />

      <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-muted">
        Suggested fairer wording
      </h4>
      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-good-soft p-3 font-serif">
        {item.rewrite}
      </p>
      <div className="mt-2">
        <CopyButton text={item.rewrite} label="Copy wording" />
      </div>

      <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-muted">
        Message you could send
      </h4>
      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-paper p-3">{item.message}</p>
      <div className="mt-2">
        <CopyButton text={item.message} label="Copy message" />
      </div>
    </article>
  );
}
