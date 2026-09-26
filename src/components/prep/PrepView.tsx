"use client";

import { useSession } from "@/components/session/SessionProvider";
import { NoDocumentState } from "@/components/session/NoDocumentState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { downloadText, fileStem } from "@/lib/client/download";
import { prepPackToMarkdown } from "@/lib/export/markdown";
import { SEVERITY_DISPLAY } from "@/lib/utils/format";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="prep-section space-y-3">
      <h2 id={id} className="font-serif text-2xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Lawyer Prep Pack built from the session analysis, printable and exportable as Markdown. */
export function PrepView() {
  const { session } = useSession();
  if (!session) {
    return (
      <NoDocumentState purpose="The Lawyer Prep Pack is built from your document's analysis." />
    );
  }

  const { document, result } = session;
  const { brief, prep, balance, risks } = result;

  return (
    <article className="prep-pack mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Lawyer prep pack
        </p>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{brief.title}</h1>
        <p className="text-muted">
          {document.name} · Your role: {brief.userParty} · Balance score:{" "}
          {balance.score === null ? "not scored" : `${balance.score}/100`} ({balance.verdict})
        </p>
        <p className="text-sm">
          Take this to a lawyer or legal aid clinic to make the first meeting faster and cheaper. It
          is a summary of information, not legal advice.
        </p>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            onClick={() =>
              downloadText(
                `${fileStem(brief.title)}-lawyer-prep.md`,
                prepPackToMarkdown(result, document.name),
                "text/markdown",
              )
            }
          >
            <Icon name="download" className="size-4" />
            Download (.md)
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Icon name="print" className="size-4" />
            Print or save as PDF
          </Button>
        </div>
      </header>

      <Section id="summary" title="Case summary">
        <p className="whitespace-pre-wrap leading-relaxed">{prep.caseSummary}</p>
      </Section>

      <Section id="questions" title="Questions to ask your lawyer">
        <ol className="list-decimal space-y-2 pl-6">
          {prep.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </Section>

      <Section id="key-risks" title="Key risks">
        {risks.length === 0 ? (
          <p className="text-muted">No verified risks.</p>
        ) : (
          <ul className="space-y-2">
            {risks.map((risk) => (
              <li key={risk.id}>
                <strong>
                  {SEVERITY_DISPLAY[risk.severity].label}: {risk.title}.
                </strong>{" "}
                {risk.whatCouldGoWrong}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="gaps" title="Information gaps in the document">
        {prep.informationGaps.length === 0 ? (
          <p className="text-muted">None identified.</p>
        ) : (
          <ul className="list-disc space-y-1.5 pl-6">
            {prep.informationGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="bring" title="Documents to bring">
        <ul className="list-disc space-y-1.5 pl-6">
          {(prep.documentsToBring.length ? prep.documentsToBring : ["The document itself"]).map(
            (item) => (
              <li key={item}>{item}</li>
            ),
          )}
        </ul>
      </Section>

      <footer className="border-t border-line pt-4 text-sm text-muted">
        Prepared with ClauseWise. Legal information, not legal advice. Please confirm every point
        with a qualified lawyer.
      </footer>
    </article>
  );
}
