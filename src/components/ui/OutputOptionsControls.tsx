"use client";

import { useId } from "react";
import type { OutputOptions } from "@/lib/schemas/document";
import { LanguageSelect } from "./LanguageSelect";

/** Language selector plus the plain-language toggle, shared by every model-backed view. */
export function OutputOptionsControls({
  value,
  onChange,
}: {
  value: OutputOptions;
  onChange: (options: OutputOptions) => void;
}) {
  const toggleId = useId();
  const hintId = useId();
  return (
    <div className="flex flex-wrap items-end gap-6">
      <LanguageSelect
        value={value.language}
        onChange={(language) => onChange({ ...value, language })}
      />
      <div className="flex min-h-11 items-center gap-3">
        <input
          id={toggleId}
          type="checkbox"
          role="switch"
          aria-describedby={hintId}
          checked={value.plainLanguage}
          onChange={(event) => onChange({ ...value, plainLanguage: event.target.checked })}
          className="size-5 accent-[var(--accent)]"
        />
        <div>
          <label htmlFor={toggleId} className="text-sm font-semibold">
            Plain language
          </label>
          <p id={hintId} className="text-xs text-muted">
            Shorter sentences and everyday words.
          </p>
        </div>
      </div>
    </div>
  );
}
