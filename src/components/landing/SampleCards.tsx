import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { SAMPLE_CATALOG } from "@/data/sample-catalog";
import { DOCUMENT_TYPE_LABELS } from "@/lib/utils/format";

/** Inviting cards that start a live analysis of a bundled sample. */
export function SampleCards() {
  return (
    <section
      id="samples"
      aria-labelledby="samples-heading"
      className="reveal scroll-mt-24 space-y-6"
    >
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Try it now</p>
        <h2 id="samples-heading" className="font-serif text-3xl font-semibold sm:text-4xl">
          Try a sample
        </h2>
        <p className="measure text-muted">
          Realistic documents with the kind of clauses people sign every day. No upload needed.
        </p>
      </div>
      <ul className="grid gap-5 md:grid-cols-3">
        {SAMPLE_CATALOG.map((sample) => (
          <li key={sample.id}>
            <Link
              href={`/analyze?sample=${sample.id}`}
              className="lift group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 hover:border-accent"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon name="file" className="size-5" />
                </span>
                <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-muted">
                  {DOCUMENT_TYPE_LABELS[sample.id]}
                </span>
              </span>
              <span className="mt-5 font-serif text-xl font-semibold">{sample.title}</span>
              <span className="mt-2 flex-1 text-muted">{sample.description}</span>
              <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-accent">
                Analyse this sample
                <span aria-hidden="true" className="transition group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
