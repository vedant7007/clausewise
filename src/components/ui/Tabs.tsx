"use client";

import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/** One tab and its panel. */
export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * WAI-ARIA tabs with automatic activation: arrow keys, Home and End move between tabs, and
 * only the active tab is in the tab order.
 */
export function Tabs({ items, label }: { items: readonly TabItem[]; label: string }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const next = (index + items.length) % items.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: items.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusTab(target);
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1 print:hidden"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={index === active}
            aria-controls={`${baseId}-panel-${item.id}`}
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={onKeyDown}
            className={cn(
              "min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors duration-200",
              index === active
                ? "bg-accent text-accent-ink shadow-soft"
                : "text-muted hover:bg-paper hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={index !== active}
          tabIndex={0}
          className="fade-in pt-6"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
