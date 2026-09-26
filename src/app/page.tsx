export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="font-serif text-4xl font-semibold">ClauseWise</h1>
      <p className="text-lg text-muted">Know what you&apos;re signing.</p>
      <p>
        A plain-English reader for rental agreements, job offers, NDAs and loan papers. It shows
        which clauses tilt against you, and backs every claim with a verified quote from your
        document. Informational only, not legal advice.
      </p>
    </main>
  );
}
