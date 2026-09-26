import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Error panel announced to screen readers, with a recovery path supplied by the caller.
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  actions,
}: {
  title?: string;
  message: string;
  actions?: ReactNode;
}) {
  return (
    <div role="alert" className="rounded-xl border border-bad/40 bg-bad-soft p-5 text-ink">
      <div className="flex items-start gap-3">
        <Icon name="octagon" className="mt-0.5 size-5 shrink-0 text-bad" />
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm">{message}</p>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
