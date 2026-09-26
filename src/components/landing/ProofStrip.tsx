import { ClauseCategorySchema, TiltSchema } from "@/lib/schemas/analysis";
import { LanguageSchema } from "@/lib/schemas/document";

/** Facts derived from the shipped code, so the numbers can never drift from the product. */
const FACTS: readonly { value: string; label: string }[] = [
  { value: String(ClauseCategorySchema.options.length), label: "clause categories recognised" },
  { value: String(TiltSchema.options.length), label: "tilt levels, scored by code, not the model" },
  { value: "100%", label: "of claims shown are quote-verified" },
  { value: String(LanguageSchema.options.length), label: "languages: English, हिन्दी, తెలుగు" },
  { value: "0", label: "documents stored" },
];

/** A strip of true, code-derived facts about what ClauseWise does. */
export function ProofStrip() {
  return (
    <section aria-label="ClauseWise at a glance" className="reveal sm:-mt-12">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-5">
        {FACTS.map((fact) => (
          <div
            key={fact.label}
            className="flex flex-col bg-surface px-5 py-6 last:col-span-2 lg:last:col-span-1"
          >
            <dt className="order-2 mt-1 text-sm text-muted">{fact.label}</dt>
            <dd className="font-serif text-3xl font-semibold text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
