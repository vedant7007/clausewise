import { Icon } from "@/components/ui/Icon";
import { ANALYSIS_STAGES, type AnalysisStage } from "@/lib/schemas/analyze-stream";
import { cn } from "@/lib/utils/cn";

const STAGE_LABELS: Record<AnalysisStage, string> = {
  parsing: "Reading your document",
  redacting: "Masking personal details before analysis",
  analyzing: "Analysing clauses, risks and deadlines (usually 30 to 60 seconds)",
  verifying: "Checking every quote against your document",
};

/** A placeholder block that mirrors real content while the analysis runs. */
function Bone({ className }: { className: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-lg bg-line/70", className)} />;
}

/**
 * Staged progress beside a skeleton of the results layout. The current stage is named in
 * the checklist and announced through a polite live region.
 */
export function StageProgress({ stage }: { stage: AnalysisStage }) {
  const currentIndex = ANALYSIS_STAGES.indexOf(stage);
  const percent = Math.round(((currentIndex + 1) / ANALYSIS_STAGES.length) * 100);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
        <h1 className="font-serif text-2xl font-semibold">Analysing your document</h1>
        <p className="sr-only" role="status" aria-live="polite">
          {STAGE_LABELS[stage]}
        </p>
        <div aria-hidden="true" className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <ol className="mt-5 space-y-4">
          {ANALYSIS_STAGES.map((item, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;
            return (
              <li
                key={item}
                className={cn("flex items-start gap-3", !done && !active && "text-muted")}
              >
                {done && <Icon name="check" className="mt-0.5 size-5 shrink-0 text-good" />}
                {active && (
                  <span
                    aria-hidden="true"
                    className="skeleton mt-1 size-3.5 shrink-0 rounded-full bg-accent"
                  />
                )}
                {!done && !active && (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-line"
                  />
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
      </section>

      <div className="space-y-4" aria-hidden="true">
        <Bone className="h-4 w-32" />
        <Bone className="h-9 w-3/4" />
        <Bone className="h-12 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
            <Bone className="h-6 w-1/2" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-11/12" />
            <Bone className="h-4 w-4/5" />
          </div>
          <div className="grid place-items-center rounded-2xl border border-line bg-surface p-5">
            <Bone className="size-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
