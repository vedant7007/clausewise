import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/lib/utils/format";
import { Icon, type IconName } from "./Icon";

const TONES: Record<Tone, string> = {
  good: "bg-good-soft text-good border-good/30",
  neutral: "bg-paper text-muted border-line",
  warn: "bg-warn-soft text-warn border-warn/30",
  bad: "bg-bad-soft text-bad border-bad/30",
  info: "bg-info-soft text-info border-info/30",
};

const TONE_ICONS: Record<Tone, IconName> = {
  good: "check",
  neutral: "minus",
  warn: "alert",
  bad: "octagon",
  info: "info",
};

/**
 * Status label. Meaning is carried by the text and icon; colour only reinforces it.
 */
export function Badge({
  tone,
  children,
  icon = TONE_ICONS[tone],
  className,
}: {
  tone: Tone;
  children: ReactNode;
  icon?: IconName | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} className="size-3.5" />}
      {children}
    </span>
  );
}
