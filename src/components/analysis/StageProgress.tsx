import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { ANALYSIS_STAGES, type AnalysisStage } from "@/lib/schemas/analyze-stream";
import { cn } from "@/lib/utils/cn";

const STAGE_LABELS: Record<AnalysisStage, string> = {
  parsing: "Reading your document",
  redacting: "Masking personal details before analysis",
  analyzing: "Analysing clauses, risks and deadlines (usually 30 to 60 seconds)",
  verifying: "Checking every quote against your document",
};

/** Staged progress list; the current stage is announced through a polite live region. */
export function StageProgress({ stage }: { stage: AnalysisStage }) {
  const currentIndex = ANALYSIS_STAGES.indexOf(stage);
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <h2 className="font-serif text-xl font-semibold">Analysing your document</h2>
      <p className="sr-only" role="status" aria-live="polite">
        {STAGE_LABELS[stage]}
      </p>
      <ol className="mt-4 space-y-3">
        {ANALYSIS_STAGES.map((item, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={item}
              className={cn("flex items-center gap-3", !done && !active && "text-muted")}
            >
              {done && <Icon name="check" className="size-5 text-good" />}
              {active && <Spinner className="text-accent" />}
              {!done && !active && (
                <span aria-hidden="true" className="size-5 rounded-full border-2 border-line" />
              )}
              <span className={cn(active && "font-semibold")}>
                {STAGE_LABELS[item]}
                <span className="sr-only">
                  {done ? " (done)" : active ? " (in progress)" : " (waiting)"}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
