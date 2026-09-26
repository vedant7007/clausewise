import Link from "next/link";

const REPOSITORY_URL = "https://github.com/vedant7007/clausewise";

/** Site footer with the legal notice, privacy statement and source link. */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          ClauseWise explains documents; it does not give legal advice. For decisions, consult a
          qualified lawyer.
        </p>
        <ul className="flex flex-wrap gap-4">
          <li>
            <Link href="/disclaimer" className="underline underline-offset-2 hover:text-accent">
              Disclaimer
            </Link>
          </li>
          <li>
            <a href={REPOSITORY_URL} className="underline underline-offset-2 hover:text-accent">
              Source code
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
