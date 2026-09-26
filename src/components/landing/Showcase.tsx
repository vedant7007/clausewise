import Link from "next/link";
import { BalanceMeter } from "@/components/analysis/BalanceMeter";
import { EvidenceDisclosure } from "@/components/analysis/EvidenceDisclosure";
import { Badge } from "@/components/ui/Badge";
import { Icon, type IconName } from "@/components/ui/Icon";
import rental from "@/data/fixtures/rental.json";
import { AnalysisResultSchema } from "@/lib/schemas/analysis";
import { TILT_DISPLAY } from "@/lib/utils/format";

/** The saved analysis of the bundled rental sample: real pipeline output, not invented data. */
const EXAMPLE = AnalysisResultSchema.parse(rental);
const ADVERSE_EXAMPLE =
  EXAMPLE.clauses.find((clause) => clause.tilt === "HEAVILY_FAVORS_COUNTERPARTY") ??
  EXAMPLE.clauses[0];

const MORE: readonly { icon: IconName; title: string; body: string }[] = [
  {
    icon: "shield",
    title: "Private before it is clever",
    body: "Emails, phone numbers, Aadhaar-like and PAN-like numbers are replaced with tokens before the model sees the text, then restored for you.",
  },
  {
    icon: "copy",
    title: "Negotiation kit",
    body: "For each unfair clause, fairer wording and a short, polite message you can send as it is.",
  },
  {
    icon: "message",
    title: "Answers only from your document",
    body: "Q&A that quotes its sources, says so when the document is silent, and declines to give legal advice.",
  },
  {
    icon: "file",
    title: "Compare against fair",
    body: "See what changed between two versions, or how yours differs from a balanced agreement of the same type.",
  },
];

function Pillar({
  eyebrow,
  title,
  why,
  children,
}: {
  eyebrow: string;
  title: string;
  why: string;
  children: React.ReactNode;
}) {
  return (
    <div className="reveal grid gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h3 className="font-serif text-2xl font-semibold sm:text-3xl">{title}</h3>
        <p className="measure text-muted">{why}</p>
      </div>
      <div className="rounded-2xl border border-line bg-paper p-5 sm:p-6">{children}</div>
    </div>
  );
}

/** Feature showcase leading with the two differentiators, rendered with real sample output. */
export function Showcase() {
  return (
    <section aria-labelledby="showcase-heading" className="space-y-8">
      <div className="reveal space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Why people trust it
        </p>
        <h2 id="showcase-heading" className="font-serif text-3xl font-semibold sm:text-4xl">
          Built so you can check its work
        </h2>
      </div>

      <Pillar
        eyebrow="The Tilt Meter"
        title="See at a glance which way the deal leans"
        why="Every clause is labelled as favouring you, neutral, or favouring the other side. ClauseWise then turns those labels into a score with a fixed, published formula. The model never picks the number, so the same clauses always give the same score."
      >
        <BalanceMeter balance={EXAMPLE.balance} />
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tilt levels">
          {Object.values(TILT_DISPLAY).map((tilt) => (
            <li key={tilt.label}>
              <Badge tone={tilt.tone}>{tilt.label}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Example: the saved analysis of the bundled rental sample.
        </p>
      </Pillar>

      {ADVERSE_EXAMPLE && (
        <Pillar
          eyebrow="Verified evidence"
          title="Every claim comes with a receipt"
          why="Language models can sound certain and still be wrong. ClauseWise makes the model quote your document for every clause, risk and answer, then checks each quote word for word. Anything it cannot find is hidden and counted, never shown as fact."
        >
          <p className="font-serif text-lg font-semibold">{ADVERSE_EXAMPLE.title}</p>
          <p className="mt-1 text-sm text-muted">{ADVERSE_EXAMPLE.meaning}</p>
          <div className="mt-3">
            <Badge tone={TILT_DISPLAY[ADVERSE_EXAMPLE.tilt].tone}>
              {TILT_DISPLAY[ADVERSE_EXAMPLE.tilt].label}
            </Badge>
          </div>
          <EvidenceDisclosure evidence={ADVERSE_EXAMPLE.evidence} defaultOpen />
        </Pillar>
      )}

      <ul className="grid gap-5 sm:grid-cols-2">
        {MORE.map((item) => (
          <li key={item.title} className="reveal rounded-2xl border border-line bg-surface p-6">
            <Icon name={item.icon} className="size-6 text-accent" />
            <h3 className="mt-3 font-serif text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-muted">{item.body}</p>
          </li>
        ))}
      </ul>
      <p className="reveal text-sm text-muted">
        Want the details?{" "}
        <Link href="/about" className="font-semibold text-accent underline underline-offset-4">
          Read how ClauseWise works
        </Link>
        .
      </p>
    </section>
  );
}
