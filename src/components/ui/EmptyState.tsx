import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** Placeholder shown when there is nothing to display yet, with a next step. */
export function EmptyState({
  icon = "file",
  title,
  children,
  action,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      <Icon name={icon} className="mx-auto size-8 text-muted" />
      <h2 className="mt-3 font-serif text-xl font-semibold">{title}</h2>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
