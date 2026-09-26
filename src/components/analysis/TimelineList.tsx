"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { downloadText, fileStem } from "@/lib/client/download";
import { buildIcs } from "@/lib/export/ics";
import { obligationsToMarkdown } from "@/lib/export/markdown";
import type { Obligation } from "@/lib/schemas/analysis";
import { EvidenceDisclosure } from "./EvidenceDisclosure";

/** Obligations and deadlines, with calendar (.ics) and checklist (Markdown) exports. */
export function TimelineList({
  obligations,
  title,
}: {
  obligations: readonly Obligation[];
  title: string;
}) {
  const dated = obligations.filter((item) => item.dueDate !== null).length;

  if (obligations.length === 0) {
    return (
      <p className="text-muted">
        No verified obligations or deadlines were found in this document.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          disabled={dated === 0}
          aria-describedby="ics-hint"
          onClick={() =>
            downloadText(
              `${fileStem(title)}-deadlines.ics`,
              buildIcs(obligations, title),
              "text/calendar",
            )
          }
        >
          <Icon name="download" className="size-4" />
          Add dated deadlines to calendar (.ics)
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            downloadText(
              `${fileStem(title)}-checklist.md`,
              obligationsToMarkdown(obligations, title),
              "text/markdown",
            )
          }
        >
          <Icon name="download" className="size-4" />
          Download checklist (.md)
        </Button>
        <p id="ics-hint" className="w-full text-xs text-muted">
          {dated === 0
            ? "This document has no calendar dates, only relative deadlines, so there is nothing to add to a calendar. The checklist keeps every deadline in the document's own words."
            : `${dated} of ${obligations.length} deadlines have a calendar date and will be added. Relative deadlines stay in the checklist.`}
        </p>
      </div>

      <ol className="relative space-y-4 border-l-2 border-line pl-6">
        {obligations.map((item) => (
          <li key={item.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[33px] top-1.5 size-4 rounded-full border-2 border-accent bg-surface"
            />
            <article
              className="rounded-xl border border-line bg-surface p-5"
              aria-labelledby={`${item.id}-title`}
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-accent">
                <Icon name="clock" className="size-4" />
                {item.deadline}
                {item.dueDate && <span className="text-muted">({item.dueDate})</span>}
              </p>
              <h3 id={`${item.id}-title`} className="mt-1 font-semibold">
                {item.party}: {item.action}
              </h3>
              <p className="mt-1 text-sm">
                <span className="font-semibold text-muted">If missed: </span>
                {item.consequence}
              </p>
              <EvidenceDisclosure evidence={item.evidence} />
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
