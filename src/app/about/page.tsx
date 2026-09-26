import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "About",
  description: "Why ClauseWise exists, how it works, and why you can check its work.",
};

const PIPELINE: readonly { title: string; body: string }[] = [
  {
    title: "Read",
    body: "Your file is checked (type, size and real file signature), then its text is extracted.",
  },
  {
    title: "Protect",
    body: "Emails, phone numbers, Aadhaar-like and PAN-like numbers and account numbers are replaced with tokens.",
  },
  {
    title: "Analyse",
    body: "One request asks a language model for the brief, clauses, risks, deadlines and prep pack, in a strict format.",
  },
  {
    title: "Check",
    body: "Every quote is matched word for word against your document. Anything that cannot be found is dropped.",
  },
  {
    title: "Score",
    body: "The balance score is calculated by ClauseWise from the verified clauses, using a fixed formula.",
  },
];

const TRUST: readonly { icon: IconName; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "Personal details masked first",
    body: "Structured identifiers are removed before any text leaves our server, and restored only in what you see.",
  },
  {
    icon: "check",
    title: "Verified evidence",
    body: "Claims are shown only if their supporting quote exists in your document, with its exact position.",
  },
  {
    icon: "scale",
    title: "Deterministic scoring",
    body: "The model labels clauses; code computes the score. The same labels always give the same number.",
  },
  {
    icon: "eye",
    title: "No storage",
    body: "Documents live in memory for one request and in your browser tab. There is no database.",
  },
  {
    icon: "alert",
    title: "Prompt-injection defence",
    body: "Document text is treated strictly as data. Hidden instructions are ignored, counted and reported to you.",
  },
];

const LIMITS = [
  "It can misread a clause. Verification proves a quote exists, not that the interpretation is right.",
  "It does not check the law where you live, or know your circumstances.",
  "Scanned PDFs without a text layer are not supported yet.",
  "Names and addresses are sent to the model provider, because they are needed to explain who owes what.",
  "Very long documents are shortened in the middle; the beginning and end are always read.",
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="reveal space-y-5">
      <h2 id={id} className="font-serif text-3xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-4xl space-y-20">
      <header className="space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          About ClauseWise
        </p>
        <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">
          A careful first read, for people who cannot afford one
        </h1>
        <p className="measure text-lg text-muted">
          ClauseWise helps people understand, compare and act on the legal documents they are asked
          to sign. It gives information, not legal advice, and it shows its work.
        </p>
      </header>

      <Section id="problem" title="The problem">
        <div className="measure space-y-4 text-lg">
          <p>
            Priya has been offered a flat. The owner sends a nine-page agreement on WhatsApp and
            wants it signed tonight. Buried inside: a six-month deposit he may keep &ldquo;in his
            sole discretion&rdquo;, eviction on fifteen days&apos; notice while she is locked in for
            six months, and rent that can rise 15% with a week&apos;s warning.
          </p>
          <p className="text-muted">
            She is not careless. A lawyer for every agreement is simply out of reach, and nothing
            tells her which of these clauses are normal. Most rental agreements, job offers, NDAs
            and loan papers are signed exactly like this.
          </p>
        </div>
      </Section>

      <Section id="how" title="How it works">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PIPELINE.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-line bg-surface p-5">
              <span className="font-serif text-2xl font-semibold text-accent">{index + 1}</span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="measure text-muted">
          After that, everything else builds on the verified result: grounded questions and answers,
          comparison with another version or a fair baseline, a negotiation kit, and a prep pack for
          a lawyer.
        </p>
      </Section>

      <Section id="trust" title="Why you can trust what it shows">
        <ul className="grid gap-4 sm:grid-cols-2">
          {TRUST.map((item) => (
            <li
              key={item.title}
              className="flex gap-4 rounded-2xl border border-line bg-surface p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Icon name={item.icon} className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="providers" title="Built to keep working">
        <div className="measure space-y-4">
          <p>
            Free model tiers run out, and a tool that fails when someone needs it is not accessible.
            ClauseWise uses Google Gemini (<code>gemini-2.5-flash</code>) first, then other Gemini
            models that each have their own allowance, then Groq (<code>openai/gpt-oss-120b</code>)
            as an independent last resort.
          </p>
          <p className="text-muted">
            Whichever model answers, its output passes the same checks: strict format validation,
            personal-detail restoration and quote verification. If every model is unavailable, the
            sample documents show a clearly labelled saved analysis; your own documents never do.
          </p>
        </div>
      </Section>

      <Section id="limits" title="Limitations, honestly">
        <ul className="measure space-y-3">
          {LIMITS.map((limit) => (
            <li key={limit} className="flex gap-3">
              <Icon name="info" className="mt-1 size-4 shrink-0 text-info" />
              {limit}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="access" title="Accessibility">
        <p className="measure">
          ClauseWise aims for WCAG 2.1 AA. It is fully usable by keyboard, works with screen
          readers, respects reduced-motion and dark-mode settings, fits screens down to 360 pixels,
          and never uses colour alone to convey meaning. Explanations are available in English,
          Hindi and Telugu, with a plain-language mode.
        </p>
        <p>
          <Link
            href="/analyze"
            className="inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4"
          >
            Try it with your own document
          </Link>
        </p>
      </Section>
    </article>
  );
}
