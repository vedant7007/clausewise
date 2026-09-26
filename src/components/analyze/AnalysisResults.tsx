"use client";

import { BalanceMeter } from "@/components/analysis/BalanceMeter";
import { ClauseCard } from "@/components/analysis/ClauseCard";
import { GroundedBadge } from "@/components/analysis/GroundedBadge";
import type { Session } from "@/components/session/SessionProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DOCUMENT_TYPE_LABELS } from "@/lib/utils/format";
import { AnalysisNotices } from "./AnalysisNotices";
import { BriefSection } from "./BriefSection";

/** Full analysis view for the current session. */
export function AnalysisResults({ session, onReset }: { session: Session; onReset: () => void }) {
  const { document, result } = session;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            {DOCUMENT_TYPE_LABELS[result.brief.documentType]}
          </p>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{result.brief.title}</h1>
          <p className="mt-1 text-sm text-muted">{document.name}</p>
        </div>
        <Button variant="secondary" onClick={onReset}>
          Analyse another document
        </Button>
      </div>

      <AnalysisNotices result={result} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <BriefSection brief={result.brief} />
        </Card>
        <Card className="space-y-5">
          <BalanceMeter balance={result.balance} />
          <GroundedBadge grounding={result.grounding} />
        </Card>
      </div>

      <section aria-labelledby="clauses-heading" className="space-y-4">
        <h2 id="clauses-heading" className="font-serif text-2xl font-semibold">
          Clause ledger
        </h2>
        <p className="text-muted">
          Every material clause, with who it favours. Open &ldquo;Show source&rdquo; to see the
          exact wording in your document.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {result.clauses.map((clause) => (
            <ClauseCard key={clause.id} clause={clause} />
          ))}
        </div>
      </section>
    </div>
  );
}
