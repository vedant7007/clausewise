import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SAMPLE_CATALOG } from "@/data/sample-catalog";

const PILLARS: readonly { icon: IconName; title: string; body: string }[] = [
  {
    icon: "scale",
    title: "See which way it tilts",
    body: "Every clause is marked as favouring you, neutral, or favouring the other side, and rolled into a balance score calculated by ClauseWise, not guessed by the model.",
  },
  {
    icon: "shield",
    title: "Every claim has a receipt",
    body: "Each finding carries a quote that is checked word-for-word against your document. Anything that cannot be found is dropped and counted, never shown.",
  },
  {
    icon: "eye",
    title: "Private by design",
    body: "Phone numbers, emails, Aadhaar-like and PAN-like numbers are masked before analysis. Documents live in memory for one request and are never stored.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="max-w-3xl space-y-6 pt-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          Legal information for everyone
        </p>
        <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-6xl">
          Know what you&apos;re signing.
        </h1>
        <p className="text-lg text-muted sm:text-xl">
          About to sign a rental agreement, job offer, NDA or loan paper, but can&apos;t afford a
          lawyer for a first read? ClauseWise explains it in plain English, shows which clauses tilt
          against you, and gets you ready to negotiate or to walk into a lawyer&apos;s office
          prepared.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/analyze" className={buttonClasses("primary", "px-6 text-base")}>
            <Icon name="upload" className="size-5" />
            Analyse your document
          </Link>
          <Link href="/disclaimer" className={buttonClasses("secondary", "px-6 text-base")}>
            What ClauseWise is not
          </Link>
        </div>
      </section>

      <section aria-labelledby="samples-heading" className="space-y-4">
        <h2 id="samples-heading" className="font-serif text-2xl font-semibold">
          Try a sample
        </h2>
        <p className="text-muted">
          Realistic documents with the kind of clauses people sign every day.
        </p>
        <ul className="grid gap-4 md:grid-cols-3">
          {SAMPLE_CATALOG.map((sample) => (
            <li key={sample.id}>
              <Link
                href={`/analyze?sample=${sample.id}`}
                className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition hover:border-accent"
              >
                <Icon name="file" className="size-6 text-accent" />
                <span className="mt-3 font-serif text-lg font-semibold">{sample.title}</span>
                <span className="mt-1 flex-1 text-sm text-muted">{sample.description}</span>
                <span className="mt-4 text-sm font-semibold text-accent">
                  Analyse this sample →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className="space-y-6">
        <h2 id="how-heading" className="font-serif text-2xl font-semibold">
          Built to be trusted with a contract
        </h2>
        <ul className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className="border-t-2 border-accent pt-4">
              <Icon name={pillar.icon} className="size-6 text-accent" />
              <h3 className="mt-3 font-serif text-lg font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-muted">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
