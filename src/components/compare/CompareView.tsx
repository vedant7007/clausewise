"use client";

import { FIELD_CLASS } from "@/components/ui/field";
import { useId, useState } from "react";
import { GroundedBadge } from "@/components/analysis/GroundedBadge";
import { useSession } from "@/components/session/SessionProvider";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { OutputOptionsControls } from "@/components/ui/OutputOptionsControls";
import { Spinner } from "@/components/ui/Spinner";
import { SAMPLE_CATALOG, toSampleId } from "@/data/sample-catalog";
import { ClientError, postJson } from "@/lib/client/api-client";
import type { CompareResult } from "@/lib/schemas/compare";
import type { OutputOptions, SampleId } from "@/lib/schemas/document";
import { pluralize } from "@/lib/utils/format";
import { DifferenceCard } from "./DifferenceCard";
import { DocumentSlot, type NamedText } from "./DocumentSlot";

type Mode = "baseline" | "document";

/** Side-by-side comparison of two documents, or of one document against a fair baseline. */
export function CompareView() {
  const { session } = useSession();
  const detected = toSampleId(session?.result.brief.documentType);
  const [left, setLeft] = useState<NamedText | null>(session ? session.document : null);
  const [mode, setMode] = useState<Mode>("baseline");
  const [baseline, setBaseline] = useState<SampleId>(detected ?? "rental");
  const [right, setRight] = useState<NamedText | null>(null);
  const [options, setOptions] = useState<OutputOptions>({ language: "en", plainLanguage: false });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const baselineId = useId();

  const ready = left !== null && (mode === "baseline" || right !== null);

  const compare = async () => {
    if (!left) return;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const rightSide =
        mode === "baseline" ? { mode, baseline } : { mode, name: right?.name, text: right?.text };
      setResult(
        await postJson<CompareResult>("/api/compare", { ...options, left, right: rightSide }),
      );
    } catch (caught) {
      setError(caught instanceof ClientError ? caught.message : "Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Compare documents</h1>
        <p className="mt-2 max-w-2xl text-muted">
          See what changed between two versions, or how your document differs from a fair, balanced
          reference of the same type.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="doc-a" className="space-y-3">
          <h2 id="doc-a" className="font-serif text-xl font-semibold">
            Document A: yours
          </h2>
          <DocumentSlot label="your document" value={left} onChange={setLeft} />
        </section>

        <section aria-labelledby="doc-b" className="space-y-3">
          <h2 id="doc-b" className="font-serif text-xl font-semibold">
            Document B
          </h2>
          <fieldset className="space-y-2">
            <legend className="sr-only">What to compare against</legend>
            {(
              [
                ["baseline", "A fair baseline for this type of document"],
                ["document", "Another version I upload"],
              ] as const
            ).map(([value, text]) => (
              <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="compare-mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="size-5 accent-[var(--accent)]"
                />
                {text}
              </label>
            ))}
          </fieldset>
          {mode === "baseline" ? (
            <div className="flex flex-col gap-1">
              <label htmlFor={baselineId} className="text-sm font-semibold">
                Baseline
              </label>
              <select
                id={baselineId}
                value={baseline}
                onChange={(event) => setBaseline(event.target.value as SampleId)}
                className={FIELD_CLASS}
              >
                {SAMPLE_CATALOG.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    Fair {sample.title.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <DocumentSlot label="the other version" value={right} onChange={setRight} />
          )}
        </section>
      </div>

      <div className="space-y-4 rounded-xl border border-line bg-surface p-5">
        <OutputOptionsControls value={options} onChange={setOptions} />
        <Button onClick={compare} disabled={!ready || pending}>
          {pending && <Spinner className="size-4" />}
          {pending ? "Comparing… (about 30 seconds)" : "Compare"}
        </Button>
      </div>

      <div aria-live="polite" className="space-y-4">
        {error && (
          <ErrorState
            title="We could not compare these"
            message={error}
            actions={<Button onClick={compare}>Try again</Button>}
          />
        )}
        {result && (
          <section aria-labelledby="differences-heading" className="space-y-4">
            <h2 id="differences-heading" className="font-serif text-2xl font-semibold">
              {pluralize(result.differences.length, "difference")} found
            </h2>
            <p className="text-lg">{result.summary}</p>
            <GroundedBadge grounding={result.grounding} />
            {result.redactionCount > 0 && (
              <p className="text-sm text-muted">
                {pluralize(result.redactionCount, "personal detail")} redacted before analysis.
              </p>
            )}
            {result.differences.map((difference) => (
              <DifferenceCard
                key={difference.id}
                difference={difference}
                leftName={result.leftName}
                rightName={result.rightName}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
