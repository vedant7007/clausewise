import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** Bordered surface for grouped content. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface p-5 sm:p-6", className)}
      {...props}
    />
  );
}
