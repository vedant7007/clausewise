import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/** Persistent notice, shown on every page, that ClauseWise is not legal advice. */
export function DisclaimerBanner() {
  return (
    <aside
      aria-label="Legal notice"
      className="border-b border-line bg-warn-soft px-4 py-2 text-center text-sm text-ink print:hidden"
    >
      <Icon name="info" className="mr-1.5 inline size-4 align-[-3px] text-warn" />
      <strong>Informational only, not legal advice.</strong> Documents are processed in memory and
      never stored.{" "}
      <Link href="/disclaimer" className="font-semibold text-accent underline underline-offset-2">
        Read the disclaimer
      </Link>
    </aside>
  );
}
