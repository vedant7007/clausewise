import { Badge } from "@/components/ui/Badge";
import type { Grounding } from "@/lib/schemas/evidence";
import { pluralize } from "@/lib/utils/format";

/**
 * Shows how many model claims were verified against the document, and how many were dropped.
 */
export function GroundedBadge({ grounding }: { grounding: Grounding }) {
  const dropped = grounding.total - grounding.verified;
  return (
    <div>
      <Badge tone={dropped === 0 ? "good" : "info"} icon="shield">
        Grounded: {grounding.verified}/{grounding.total} claims verified
      </Badge>
      {dropped > 0 && (
        <p className="mt-1 text-xs text-muted">
          {pluralize(dropped, "claim")} {dropped === 1 ? "was" : "were"} hidden because the quoted
          text could not be found in your document.
        </p>
      )}
    </div>
  );
}
