"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

const CONFIRMATION_MS = 2_000;

/** Copies text to the clipboard and confirms through a polite live region. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), CONFIRMATION_MS);
  };

  return (
    <>
      <Button variant="secondary" onClick={copy}>
        <Icon name={state === "copied" ? "check" : "copy"} className="size-4" />
        {state === "copied" ? "Copied" : label}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Copy failed" : ""}
      </span>
    </>
  );
}
