"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { ADVERSE_TILTS } from "@/lib/analysis/clause-weights";
import { ClientError, postJson } from "@/lib/client/api-client";
import type { Clause } from "@/lib/schemas/analysis";
import type { OutputOptions } from "@/lib/schemas/document";
import type { NegotiationItem } from "@/lib/schemas/negotiation";
import { NegotiationCard } from "./NegotiationCard";

/** Most adverse clauses first, capped to what one request accepts. */
const MAX_CLAUSES = 15;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; items: NegotiationItem[] };

/** On-demand negotiation kit for every clause that tilts against the reader. */
export function NegotiationPanel({
  clauses,
  options,
}: {
  clauses: readonly Clause[];
  options: OutputOptions;
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  const adverse = useMemo(
    () =>
      clauses
        .filter((clause) => ADVERSE_TILTS.has(clause.tilt))
        .sort(
          (a, b) =>
            Number(b.tilt === "HEAVILY_FAVORS_COUNTERPARTY") -
            Number(a.tilt === "HEAVILY_FAVORS_COUNTERPARTY"),
        )
        .slice(0, MAX_CLAUSES),
    [clauses],
  );
  const byId = useMemo(() => new Map(adverse.map((clause) => [clause.id, clause])), [adverse]);

  if (adverse.length === 0) {
    return (
      <p className="text-muted">
        No verified clauses tilt against you, so there is nothing to negotiate.
      </p>
    );
  }

  const generate = async () => {
    setState({ status: "loading" });
    try {
      const { items } = await postJson<{ items: NegotiationItem[] }>("/api/negotiate", {
        ...options,
        clauses: adverse.map(({ id, title, evidence, tiltReason }) => ({
          id,
          title,
          quote: evidence.quote,
          tiltReason,
        })),
      });
      setState({ status: "done", items });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof ClientError ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-5" aria-live="polite" aria-busy={state.status === "loading"}>
      <p className="max-w-3xl text-muted">
        {adverse.length} {adverse.length === 1 ? "clause tilts" : "clauses tilt"} against you. Get a
        fairer rewrite and a polite message for each. These are suggestions to discuss, not legal
        advice.
      </p>
      {state.status === "idle" && <Button onClick={generate}>Draft my negotiation kit</Button>}
      {state.status === "loading" && (
        <p className="flex items-center gap-3 font-semibold">
          <Spinner className="text-accent" /> Drafting fairer wording and messages…
        </p>
      )}
      {state.status === "error" && (
        <ErrorState
          title="We could not draft the kit"
          message={state.message}
          actions={<Button onClick={generate}>Try again</Button>}
        />
      )}
      {state.status === "done" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {state.items.map((item) => {
            const clause = byId.get(item.clauseId);
            return clause ? (
              <NegotiationCard key={item.clauseId} clause={clause} item={item} />
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
