"use client";

import { type DragEvent, useId, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "./Icon";

const ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown";

/**
 * File picker with drag-and-drop. The visible label wraps a real file input, so it works
 * with keyboard, screen readers and touch without extra scripting.
 */
export function FileDropzone({
  onFile,
  disabled,
  label = "Choose a document",
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  label?: string;
}) {
  const inputId = useId();
  const hintId = useId();
  const [dragging, setDragging] = useState(false);

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  };

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-surface px-6 py-10 text-center transition focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[var(--focus)]",
        dragging ? "border-accent bg-accent-soft" : "border-line hover:border-accent",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <Icon name="upload" className="size-8 text-accent" />
      <span className="font-semibold">{label}</span>
      <span id={hintId} className="text-sm text-muted">
        Drag a file here or browse. PDF, Word (.docx), .txt or .md, up to 8 MB.
      </span>
      <input
        id={inputId}
        type="file"
        accept={ACCEPT}
        disabled={disabled}
        aria-describedby={hintId}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}
