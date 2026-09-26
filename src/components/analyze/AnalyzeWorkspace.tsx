"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { StageProgress } from "@/components/analysis/StageProgress";
import { useSession } from "@/components/session/SessionProvider";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { type AnalysisSource, useAnalysis } from "@/hooks/use-analysis";
import { type OutputOptions, SampleIdSchema } from "@/lib/schemas/document";
import { AnalysisResults } from "./AnalysisResults";
import { DocumentPicker } from "./DocumentPicker";

const DEFAULT_OPTIONS: OutputOptions = { language: "en", plainLanguage: false };

/** Upload, progress, error and result states for a single document analysis. */
export function AnalyzeWorkspace() {
  const { session, setSession } = useSession();
  const { status, run, retry, reset } = useAnalysis();
  const searchParams = useSearchParams();
  const autoStarted = useRef(false);

  const start = (source: AnalysisSource) => void run(source, DEFAULT_OPTIONS);

  useEffect(() => {
    const sample = SampleIdSchema.safeParse(searchParams.get("sample"));
    if (!sample.success || autoStarted.current) return;
    autoStarted.current = true;
    void run({ kind: "sample", sampleId: sample.data }, DEFAULT_OPTIONS);
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
      <AnalysisResults
        session={session}
        onReset={() => {
          setSession(null);
          reset();
        }}
      />
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
      <DocumentPicker onSubmit={start} />
    </div>
  );
}
