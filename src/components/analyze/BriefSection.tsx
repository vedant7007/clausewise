import type { Brief } from "@/lib/schemas/analysis";

/** Plain-English brief: summary, purpose, parties and what the reader is agreeing to. */
export function BriefSection({ brief }: { brief: Brief }) {
  return (
    <section aria-labelledby="brief-heading" className="space-y-5">
      <h2 id="brief-heading" className="font-serif text-2xl font-semibold">
        Plain-English brief
      </h2>
      <p className="text-lg leading-relaxed">{brief.summary}</p>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">What it does</h3>
          <p className="mt-1">{brief.purpose}</p>
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">Parties</h3>
          <ul className="mt-1 space-y-1">
            {brief.parties.map((party) => (
              <li key={`${party.name}-${party.role}`}>
                <span className="font-semibold">{party.name}</span>{" "}
                <span className="text-muted">({party.role})</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">
            Read from the point of view of: <strong className="text-ink">{brief.userParty}</strong>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            What you are agreeing to
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            {brief.agreeingTo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
