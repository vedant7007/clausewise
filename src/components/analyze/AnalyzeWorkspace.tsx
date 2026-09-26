"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StageProgress } from "@/components/analysis/StageProgress";
import { type Session, useSession } from "@/components/session/SessionProvider";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { OutputOptionsControls } from "@/components/ui/OutputOptionsControls";
import { type AnalysisSource, useAnalysis } from "@/hooks/use-analysis";
import { toSampleId } from "@/data/sample-catalog";
import type { OutputOptions } from "@/lib/schemas/document";
import { AnalysisResults } from "./AnalysisResults";
import { DocumentPicker } from "./DocumentPicker";

const DEFAULT_OPTIONS: OutputOptions = { language: "en", plainLanguage: false };

/** Re-runs a session's document: samples by id (so saved fallbacks still apply), others as text. */
function sourceFor(session: Session): AnalysisSource {
  const { document } = session;
  return document.sampleId
    ? { kind: "sample", sampleId: document.sampleId }
    : { kind: "text", text: document.text, name: document.name };
}

/** Upload, progress, error and result states for a single document analysis. */
export function AnalyzeWorkspace() {
  const { session, setSession } = useSession();
  const { status, run, retry, reset } = useAnalysis();
  const [options, setOptions] = useState<OutputOptions>(DEFAULT_OPTIONS);
  const searchParams = useSearchParams();
  const autoStarted = useRef(false);

  useEffect(() => {
    const sampleId = toSampleId(searchParams.get("sample"));
    if (!sampleId || autoStarted.current) return;
    autoStarted.current = true;
    void run({ kind: "sample", sampleId }, DEFAULT_OPTIONS);
  }, [searchParams, run]);

  if (status.state === "running") return <StageProgress stage={status.stage} />;

  if (status.state === "error") {
    return (
      <ErrorState
        title="We could not analyse that document"
        message={status.error.message}
        actions={
          <>
            <Button onClick={retry}>Try again</Button>
            <Button variant="secondary" onClick={reset}>
              Choose a different document
            </Button>
          </>
        }
      />
    );
  }

  if (session) {
    return (
      <div className="space-y-6">
        <AnalysisResults
          session={session}
          onReset={() => {
            setSession(null);
            reset();
          }}
        />
        <section
          aria-labelledby="reexplain-heading"
          className="rounded-xl border border-line bg-surface p-5 print:hidden"
        >
          <h2 id="reexplain-heading" className="font-serif text-xl font-semibold">
            Explain it differently
          </h2>
          <p className="mt-1 text-sm text-muted">
            Re-run this analysis in simpler words or in Hindi or Telugu. Legal terms keep the
            English word in brackets.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <OutputOptionsControls value={options} onChange={setOptions} />
            <Button onClick={() => void run(sourceFor(session), options)}>Re-explain</Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Analyse a document</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Upload a rental agreement, job offer, NDA, loan paper or service contract. Personal
          details are masked before analysis, and nothing is stored.
        </p>
      </div>
      <div className="rounded-xl border border-line bg-surface p-5">
        <OutputOptionsControls value={options} onChange={setOptions} />
      </div>
      <DocumentPicker onSubmit={(source) => void run(source, options)} />
    </div>
  );
}
