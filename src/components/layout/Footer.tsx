import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS } from "./nav-items";

const REPOSITORY_URL = "https://github.com/vedant7007/clausewise";

const linkClass =
  "inline-flex min-h-11 items-center hover:text-accent hover:underline underline-offset-4";

/** Site footer: product links, trust links, the legal notice and the stack it is built on. */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface print:hidden">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-serif text-xl font-semibold">
            <Icon name="scale" className="size-6 text-accent" /> ClauseWise
          </p>
          <p className="measure text-sm text-muted">
            ClauseWise explains documents; it does not give legal advice. For decisions, consult a
            qualified lawyer.
          </p>
          <p className="text-sm text-muted">
            Built with Next.js, TypeScript and Tailwind CSS. Analysis by Google Gemini, with Groq as
            a fallback.
          </p>
        </div>
        <nav aria-label="Footer: product">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Product</h2>
          <ul className="mt-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer: trust">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Trust</h2>
          <ul className="mt-2 text-sm">
            <li>
              <Link href="/disclaimer" className={linkClass}>
                Disclaimer
              </Link>
            </li>
            <li>
              <a href={`${REPOSITORY_URL}/blob/main/SECURITY.md`} className={linkClass}>
                Security policy
              </a>
            </li>
            <li>
              <a href={REPOSITORY_URL} className={linkClass}>
                Source code
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
