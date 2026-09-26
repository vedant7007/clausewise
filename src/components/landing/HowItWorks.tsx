import { Icon, type IconName } from "@/components/ui/Icon";

const STEPS: readonly { icon: IconName; title: string; body: string }[] = [
  {
    icon: "upload",
    title: "Upload",
    body: "A PDF, Word file, text or pasted clauses. Phone numbers, emails and ID numbers are masked before anything reaches the model.",
  },
  {
    icon: "scale",
    title: "Analyse",
    body: "A plain-English brief, every clause marked by who it favours, the risks ranked, and every deadline on a timeline.",
  },
  {
    icon: "message",
    title: "Act",
    body: "Ask questions answered only from the document, compare it with a fair version, draft polite pushback, or prepare for a lawyer.",
  },
];

/** Three-step overview of the product flow. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="reveal space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          How it works
        </p>
        <h2 id="how-heading" className="font-serif text-3xl font-semibold sm:text-4xl">
          From first read to a better deal
        </h2>
      </div>
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
                <Icon name={step.icon} className="size-5" />
              </span>
              <span className="text-sm font-semibold text-muted">Step {index + 1}</span>
            </div>
            <h3 className="mt-4 font-serif text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
