"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { ClientError, errorFromResponse } from "@/lib/client/api-client";

/** A document chosen for comparison. */
export interface NamedText {
  name: string;
  text: string;
}

async function extractFile(file: File): Promise<NamedText> {
  const form = new FormData();
  form.append("file", file);
  let response: Response;
  try {
    response = await fetch("/api/extract", { method: "POST", body: form });
  } catch {
    throw new ClientError("NETWORK", "We could not upload that file. Check your connection.");
  }
  if (!response.ok) throw await errorFromResponse(response);
  return (await response.json()) as NamedText;
}

/** Holds one side of a comparison: shows the chosen document or an upload control. */
export function DocumentSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: NamedText | null;
  onChange: (value: NamedText | null) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (value) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
        <p className="flex items-center gap-2 font-semibold">
          <Icon name="file" className="size-5 text-accent" />
          {value.name}
        </p>
        <Button variant="ghost" onClick={() => onChange(null)} aria-label={`Replace ${label}`}>
          Replace
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2" aria-busy={pending}>
      <FileDropzone
        label={`Choose ${label}`}
        disabled={pending}
        onFile={async (file) => {
          setPending(true);
          setError(null);
          try {
            onChange(await extractFile(file));
          } catch (caught) {
            setError(caught instanceof ClientError ? caught.message : "Please try another file.");
          } finally {
            setPending(false);
          }
        }}
      />
      <div role="status" aria-live="polite" className="text-sm">
        {pending && (
          <span className="flex items-center gap-2">
            <Spinner className="size-4 text-accent" /> Reading the file…
          </span>
        )}
        {error && <span className="text-bad">{error}</span>}
      </div>
    </div>
  );
}
