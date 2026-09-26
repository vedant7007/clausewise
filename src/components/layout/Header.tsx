import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { NavLinks } from "./NavLinks";

/** Site header with wordmark and primary navigation. */
export function Header() {
  return (
    <header className="border-b border-line bg-surface print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 font-serif text-xl font-semibold"
        >
          <Icon name="scale" className="size-6 text-accent" />
          ClauseWise
        </Link>
        <nav aria-label="Primary">
          <NavLinks />
        </nav>
      </div>
    </header>
  );
}
