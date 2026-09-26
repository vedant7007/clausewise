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
    <details open={defaultOpen} className="group mt-3 rounded-lg border border-line bg-paper">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold text-accent [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="transition group-open:rotate-90">
          ▸
        </span>
        {label}
      </summary>
      <div className="border-t border-line px-3 py-3">
        <blockquote className="whitespace-pre-wrap border-l-4 border-accent pl-3 font-serif text-[0.95rem] italic">
          {evidence.quote}
        </blockquote>
        <p className="mt-2 text-xs text-muted">
          Verified word-for-word in your document, characters{" "}
          {evidence.offset.toLocaleString("en-IN")}–
          {(evidence.offset + evidence.length).toLocaleString("en-IN")}.
        </p>
      </div>
    </details>
  );
}
