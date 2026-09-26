"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { SAMPLE_CATALOG } from "@/data/sample-catalog";
import { MAX_TEXT_CHARS, MIN_DOCUMENT_CHARS } from "@/lib/constants";
import type { AnalysisSource } from "@/hooks/use-analysis";

/** Lets the user upload a file, paste text, or pick a bundled sample. */
export function DocumentPicker({ onSubmit }: { onSubmit: (source: AnalysisSource) => void }) {
  const [text, setText] = useState("");
  const textId = useId();
  const countId = useId();
  const trimmed = text.trim().length;
  const textValid = trimmed >= MIN_DOCUMENT_CHARS && trimmed <= MAX_TEXT_CHARS;

  return (
    <div className="space-y-6">
      <FileDropzone onFile={(file) => onSubmit({ kind: "file", file })} />

      <details className="rounded-xl border border-line bg-surface">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 font-semibold">
          Or paste the text instead
        </summary>
        <form
          className="space-y-3 border-t border-line p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (textValid) onSubmit({ kind: "text", text });
          }}
        >
          <label htmlFor={textId} className="block text-sm font-semibold">
            Document text
          </label>
          <textarea
            id={textId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-describedby={countId}
            rows={8}
            maxLength={MAX_TEXT_CHARS}
            className="w-full rounded-lg border border-line bg-paper p-3 text-sm"
          />
          <p id={countId} className="text-xs text-muted">
            {trimmed.toLocaleString("en-IN")} characters. Minimum {MIN_DOCUMENT_CHARS}, maximum{" "}
            {MAX_TEXT_CHARS.toLocaleString("en-IN")}.
          </p>
          <Button type="submit" disabled={!textValid}>
            Analyse pasted text
          </Button>
        </form>
      </details>

      <section aria-labelledby="samples-heading">
        <h2 id="samples-heading" className="font-serif text-xl font-semibold">
          No document to hand? Try a sample
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {SAMPLE_CATALOG.map((sample) => (
            <li key={sample.id}>
              <button
                type="button"
                onClick={() => onSubmit({ kind: "sample", sampleId: sample.id })}
                className="h-full w-full rounded-xl border border-line bg-surface p-4 text-left transition hover:border-accent"
              >
                <span className="block font-semibold">{sample.title}</span>
                <span className="mt-1 block text-sm text-muted">{sample.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
