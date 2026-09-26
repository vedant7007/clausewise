"use client";

import Link from "next/link";
import { BalanceMeter } from "@/components/analysis/BalanceMeter";
import { ClauseCard } from "@/components/analysis/ClauseCard";
import { GroundedBadge } from "@/components/analysis/GroundedBadge";
import { NegotiationPanel } from "@/components/analysis/NegotiationPanel";
import { RiskCard } from "@/components/analysis/RiskCard";
import { TimelineList } from "@/components/analysis/TimelineList";
import type { Session } from "@/components/session/SessionProvider";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { DOCUMENT_TYPE_LABELS, pluralize } from "@/lib/utils/format";
import { AnalysisNotices } from "./AnalysisNotices";
import { BriefSection } from "./BriefSection";

/** Full analysis view for the current session, organised into tabs. */
export function AnalysisResults({ session, onReset }: { session: Session; onReset: () => void }) {
  const { document, result } = session;
  const options = { language: result.language, plainLanguage: false };
  const highRisks = result.risks.filter((risk) => risk.severity === "HIGH").length;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <BriefSection brief={result.brief} />
          </Card>
          <Card className="space-y-5">
            <BalanceMeter balance={result.balance} />
            <GroundedBadge grounding={result.grounding} />
            <p className="text-sm">
              {pluralize(result.clauses.length, "clause")} reviewed,{" "}
              {pluralize(highRisks, "high risk")} found.
            </p>
          </Card>
        </div>
      ),
    },
    {
      id: "clauses",
      label: `Clauses (${result.clauses.length})`,
      content: (
        <section aria-labelledby="clauses-heading" className="space-y-4">
          <h2 id="clauses-heading" className="font-serif text-2xl font-semibold">
            Clause ledger
          </h2>
          <p className="text-muted">
            Every material clause and who it favours. Open a card&apos;s source to see the exact
            wording.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {result.clauses.map((clause) => (
              <ClauseCard key={clause.id} clause={clause} />
            ))}
          </div>
        </section>
      ),
    },
    {
      id: "risks",
      label: `Risks (${result.risks.length})`,
      content: (
        <section aria-labelledby="risks-heading" className="space-y-4">
          <h2 id="risks-heading" className="font-serif text-2xl font-semibold">
            Risk radar
          </h2>
          {result.risks.length === 0 ? (
            <p className="text-muted">No verified risks were found.</p>
          ) : (
            <div className="space-y-4">
              {result.risks.map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          )}
        </section>
      ),
    },
    {
      id: "deadlines",
      label: `Deadlines (${result.obligations.length})`,
      content: (
        <section aria-labelledby="deadlines-heading" className="space-y-4">
          <h2 id="deadlines-heading" className="font-serif text-2xl font-semibold">
            Obligations and deadlines
          </h2>
          <TimelineList obligations={result.obligations} title={result.brief.title} />
        </section>
      ),
    },
    {
      id: "negotiate",
      label: "Negotiate",
      content: (
        <section aria-labelledby="negotiate-heading" className="space-y-4">
          <h2 id="negotiate-heading" className="font-serif text-2xl font-semibold">
            Negotiation kit
          </h2>
          <NegotiationPanel clauses={result.clauses} options={options} />
        </section>
      ),
    },
  ];

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
        <div className="flex flex-wrap gap-2">
          <Link href="/ask" className={buttonClasses("secondary")}>
            Ask a question
          </Link>
          <Link href="/prep" className={buttonClasses("secondary")}>
            Lawyer prep pack
          </Link>
          <Button variant="ghost" onClick={onReset}>
            Analyse another document
          </Button>
        </div>
      </div>

      <AnalysisNotices result={result} />
      <Tabs items={tabs} label="Analysis sections" />
    </div>
  );
}
