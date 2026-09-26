import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const IS = [
  "A careful first read, in plain language",
  "A way to spot one-sided clauses and deadlines",
  "Preparation for negotiating or meeting a lawyer",
];

const IS_NOT = [
  "Legal advice or a lawyer",
  "A judgement on whether a clause is lawful where you live",
  "A reason to sign without asking questions",
];

/** Honest statement of scope: information, not legal advice. */
export function NotAdvice() {
  return (
    <section
      aria-labelledby="scope-heading"
      className="reveal grid gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]"
    >
      <div className="space-y-4">
        <h2 id="scope-heading" className="font-serif text-3xl font-semibold">
          Information, not legal advice
        </h2>
        <p className="measure text-muted">
          ClauseWise helps you understand a document. It can misread a clause, and it does not know
          your full situation. For any decision, talk to a qualified lawyer or a legal aid service.
        </p>
        <Link
          href="/disclaimer"
          className="inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4"
        >
          Read the full disclaimer
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="font-semibold">ClauseWise is</h3>
          <ul className="mt-3 space-y-2">
            {IS.map((item) => (
              <li key={item} className="flex gap-2">
                <Icon name="check" className="mt-1 size-4 shrink-0 text-good" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">ClauseWise is not</h3>
          <ul className="mt-3 space-y-2">
            {IS_NOT.map((item) => (
              <li key={item} className="flex gap-2">
                <Icon name="x" className="mt-1 size-4 shrink-0 text-bad" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
