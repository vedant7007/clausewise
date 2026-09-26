"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";

/** Route-level error boundary: a calm message and a way to recover, never a stack trace. */
export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="This page ran into a problem"
      message="Something unexpected happened while showing this page. Your document was not stored, so nothing has been lost on our side."
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <Link href="/" className={buttonClasses("secondary")}>
            Go to the home page
          </Link>
        </>
      }
    />
  );
}
