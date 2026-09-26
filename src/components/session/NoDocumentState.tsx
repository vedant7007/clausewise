import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SAMPLE_CATALOG } from "@/data/sample-catalog";

/** Shown by pages that need an analysed document when none is loaded in this tab. */
export function NoDocumentState({ purpose }: { purpose: string }) {
  return (
    <EmptyState
      title="Analyse a document first"
      action={
        <>
          <Link href="/analyze" className={buttonClasses("primary")}>
            Upload a document
          </Link>
          {SAMPLE_CATALOG.map((sample) => (
            <Link
              key={sample.id}
              href={`/analyze?sample=${sample.id}`}
              className={buttonClasses("secondary")}
            >
              Try the {sample.title.toLowerCase()}
            </Link>
          ))}
        </>
      }
    >
      {purpose} Documents are kept only in this browser tab, so reloading the page clears them.
    </EmptyState>
  );
}
