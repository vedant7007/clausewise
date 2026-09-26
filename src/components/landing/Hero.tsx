import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** Landing hero: the problem, the promise, two ways in, and the privacy line. */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="grid gap-10 pt-6 sm:pt-12 lg:grid-cols-[1.25fr_1fr] lg:items-center"
    >
      <div className="space-y-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Legal information for everyone
        </p>
        <h1
          id="hero-heading"
          className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
        >
          You are about to sign something you cannot fully read.
        </h1>
        <p className="measure text-lg text-muted sm:text-xl">
          ClauseWise reads it with you: a plain-English brief, which clauses tilt against you, and
          every claim backed by the exact words from your document.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/analyze" className={buttonClasses("primary", "h-12 px-6 text-base")}>
            <Icon name="upload" className="size-5" />
            Analyse a document
          </Link>
          <Link href="#samples" className={buttonClasses("secondary", "h-12 px-6 text-base")}>
            Try a sample
          </Link>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Icon name="shield" className="size-4 shrink-0 text-accent" />
          Nothing is stored. Your document is processed in memory and personal details are masked
          before analysis.
        </p>
      </div>
      <HeroCard />
    </section>
  );
}

/** A compact, faithful preview of what a clause looks like in the ledger. */
function HeroCard() {
  return (
    <div
      aria-hidden="true"
      className="hidden rounded-2xl border border-line bg-surface p-6 shadow-soft lg:block"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Clause ledger</p>
      <p className="mt-3 font-serif text-xl font-semibold">Late fee for licence fee</p>
      <p className="mt-2 text-sm text-muted">
        Rs. 1,000 for every day of delay, with no upper limit.
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-bad/30 bg-bad-soft px-2.5 py-1 text-xs font-semibold text-bad">
        <Icon name="octagon" className="size-3.5" /> Heavily favours the other side
      </span>
      <blockquote className="mt-4 border-l-4 border-accent pl-3 font-serif text-sm italic">
        &ldquo;the Licensee shall pay a late fee of Rs. 1,000 for every day of delay, without any
        upper limit.&rdquo;
      </blockquote>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-good">
        <Icon name="check" className="size-3.5" /> Verified word-for-word in the document
      </p>
    </div>
  );
}
