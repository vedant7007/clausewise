import { Icon } from "@/components/ui/Icon";
import type { Evidence } from "@/lib/schemas/evidence";

/**
 * "Show source" disclosure revealing the exact verified quote and where it sits in the
 * document. Uses native details/summary, so it is keyboard and screen-reader accessible.
 */
export function EvidenceDisclosure({
  evidence,
  label = "Show source",
  defaultOpen = false,
}: {
  evidence: Evidence;
  label?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group mt-4 rounded-lg border border-line bg-paper open:border-accent/40"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold text-accent [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="transition group-open:rotate-90">
          ▸
        </span>
        {label}
      </summary>
      <div className="fade-in border-t border-line px-3 py-3">
        <blockquote className="whitespace-pre-wrap border-l-4 border-accent pl-3 font-serif text-[0.95rem] italic leading-relaxed">
          {evidence.quote}
        </blockquote>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Icon name="check" className="size-3.5 shrink-0 text-good" />
          Verified word-for-word in your document, characters{" "}
          {evidence.offset.toLocaleString("en-IN")}–
          {(evidence.offset + evidence.length).toLocaleString("en-IN")}.
        </p>
      </div>
    </details>
  );
}
