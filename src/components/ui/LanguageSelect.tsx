"use client";

import { FIELD_CLASS } from "./field";
import { useId } from "react";
import type { Language } from "@/lib/schemas/document";

const LANGUAGES: readonly { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "te", label: "తెలుగు (Telugu)" },
];

/** Labelled select for the language of explanations. */
export function LanguageSelect({
  value,
  onChange,
}: {
  value: Language;
  onChange: (language: Language) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        Explain in
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as Language)}
        className={FIELD_CLASS}
      >
        {LANGUAGES.map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
      </select>
    </div>
  );
}
