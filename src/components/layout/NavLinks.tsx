"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS } from "./nav-items";

/** Primary navigation links; the current page is marked with aria-current. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex flex-wrap items-center gap-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const current = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold",
                current ? "bg-accent-soft text-accent" : "text-ink hover:text-accent",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
