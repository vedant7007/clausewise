import { Icon, type IconName } from "@/components/ui/Icon";
import type { AnalysisResult } from "@/lib/schemas/analysis";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format";

function Notice({
  icon,
  tone,
  children,
}: {
  icon: IconName;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <li className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", tone)}>
      <Icon name={icon} className="mt-0.5 size-4 shrink-0" />
      <span className="text-ink">{children}</span>
    </li>
  );
}

/** Safety and provenance notices for an analysis: saved result, redactions, injections, truncation. */
export function AnalysisNotices({ result }: { result: AnalysisResult }) {
  return (
    <ul className="space-y-2" aria-label="About this analysis">
      {result.source === "fixture" && (
        <Notice icon="alert" tone="border-warn/40 bg-warn-soft text-warn">
          <strong>
            Showing a saved analysis of this sample document because the live model is unavailable.
          </strong>{" "}
          It was produced earlier by the same pipeline and is not a live result.
        </Notice>
      )}
      <Notice icon="shield" tone="border-line bg-surface text-accent">
        {result.redactionCount > 0
          ? `${pluralize(result.redactionCount, "personal detail")} redacted before analysis.`
          : "No personal details such as phone numbers or ID numbers were found to redact."}{" "}
        Your document was processed in memory and not stored.
      </Notice>
      {result.injectionsIgnored > 0 && (
        <Notice icon="shield" tone="border-line bg-surface text-warn">
          {pluralize(result.injectionsIgnored, "suspicious instruction")} in the document{" "}
          {result.injectionsIgnored === 1 ? "was" : "were"} ignored. Text that tries to steer an
          automated reviewer is treated as part of the document, never as a command.
        </Notice>
      )}
      {result.truncated && (
        <Notice icon="info" tone="border-line bg-surface text-info">
          This document is long, so the middle section was shortened before analysis. The beginning
          and end were read in full.
        </Notice>
      )}
    </ul>
  );
}
