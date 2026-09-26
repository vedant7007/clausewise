"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS } from "./nav-items";

/**
 * Primary navigation. The current page is marked with aria-current. On narrow screens the
 * links collapse behind a disclosure button; choosing a link closes it.
 */
export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold sm:hidden"
      >
        <Icon name={open ? "x" : "menu"} className="size-5" />
        Menu
      </button>
      <ul
        id={listId}
        className={cn(
          "flex-col gap-1 sm:static sm:flex sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none",
          open
            ? "absolute inset-x-0 top-full z-40 flex border-b border-line bg-surface px-4 py-3 shadow-soft"
            : "hidden",
        )}
      >
        {NAV_ITEMS.map(({ href, label }) => {
          const current = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors",
                  current
                    ? "bg-accent-soft text-accent"
                    : "text-ink hover:bg-paper hover:text-accent",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
