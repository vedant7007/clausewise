"use client";

import { useCallback, useRef, useState } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { ClientError, postForNdjson } from "@/lib/client/api-client";
import type { AnalysisStage, AnalyzeEvent } from "@/lib/schemas/analyze-stream";
import type { OutputOptions, SampleId } from "@/lib/schemas/document";

/** What the user asked to analyse. */
export type AnalysisSource =
  | { kind: "file"; file: File }
  | { kind: "sample"; sampleId: SampleId }
  | { kind: "text"; text: string };

type Status =
  | { state: "idle" }
  | { state: "running"; stage: AnalysisStage }
  | { state: "error"; error: ClientError };

const INCOMPLETE = new ClientError(
  "INCOMPLETE",
  "The analysis stopped before it finished. Please try again.",
);

function toForm(source: AnalysisSource, options: OutputOptions): FormData {
  const form = new FormData();
  if (source.kind === "file") form.append("file", source.file);
  if (source.kind === "sample") form.append("sampleId", source.sampleId);
  if (source.kind === "text") form.append("text", source.text);
  form.append("language", options.language);
  form.append("plainLanguage", String(options.plainLanguage));
  return form;
}

/**
 * Runs an analysis against the streaming API and stores the result in the session.
 * @returns the current status, a `run` function and a `retry` that repeats the last request.
 */
export function useAnalysis() {
  const { setSession } = useSession();
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const last = useRef<{ source: AnalysisSource; options: OutputOptions } | null>(null);
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(
    async (source: AnalysisSource, options: OutputOptions) => {
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      last.current = { source, options };
      setStatus({ state: "running", stage: "parsing" });

      let finished = false;
      try {
        await postForNdjson<AnalyzeEvent>(
          "/api/analyze",
          toForm(source, options),
          (event) => {
            if (event.type === "stage") setStatus({ state: "running", stage: event.stage });
            if (event.type === "error") throw new ClientError(event.code, event.message);
            if (event.type === "result") {
              finished = true;
              setSession({ document: event.document, result: event.result });
              setStatus({ state: "idle" });
            }
          },
          abort.signal,
        );
        if (!finished) throw INCOMPLETE;
      } catch (error) {
        if (abort.signal.aborted) return;
        setStatus({ state: "error", error: error instanceof ClientError ? error : INCOMPLETE });
      }
    },
    [setSession],
  );

  const retry = useCallback(() => {
    if (last.current) void run(last.current.source, last.current.options);
  }, [run]);

  const reset = useCallback(() => {
    controller.current?.abort();
    setStatus({ state: "idle" });
  }, []);

  return { status, run, retry, reset };
}
