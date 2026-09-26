"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const STORAGE_KEY = "clausewise:disclaimer-acknowledged";

function wasAcknowledged(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "yes";
  } catch {
    return false;
  }
}

function rememberAcknowledged(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "yes");
  } catch {
    // Storage can be unavailable (private mode); the notice simply shows again next visit.
  }
}

/**
 * First-run modal explaining that ClauseWise is informational only. Uses the native dialog
 * element, which traps focus, closes on Escape and restores focus when dismissed.
 */
export function FirstRunNotice() {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!wasAcknowledged()) dialog.current?.showModal();
  }, []);

  const close = () => {
    rememberAcknowledged();
    dialog.current?.close();
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="first-run-title"
      aria-describedby="first-run-body"
      onCancel={rememberAcknowledged}
      className="m-auto w-[min(92vw,34rem)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/50"
    >
      <div className="space-y-4 p-6">
        <Icon name="scale" className="size-8 text-accent" />
        <h2 id="first-run-title" className="font-serif text-2xl font-semibold">
          Before you start
        </h2>
        <div id="first-run-body" className="space-y-3">
          <p>
            ClauseWise helps you <strong>understand</strong> legal documents. It gives legal
            information, <strong>not legal advice</strong>, and it can make mistakes.
          </p>
          <p>
            Personal details like phone numbers and ID numbers are masked before analysis, and your
            document is never stored. For any decision, please talk to a qualified lawyer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={close} autoFocus>
            I understand
          </Button>
          <Link
            href="/disclaimer"
            onClick={close}
            className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-accent underline underline-offset-2"
          >
            Read the full disclaimer
          </Link>
        </div>
      </div>
    </dialog>
  );
}
