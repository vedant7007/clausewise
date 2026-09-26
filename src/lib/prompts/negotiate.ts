import type { NegotiateRequest } from "@/lib/schemas/negotiation";
import type { OutputOptions } from "@/lib/schemas/document";
import { fenceUntrusted } from "@/lib/security/prompt-defense";
import { outputStyleInstruction, SYSTEM_POLICY } from "./system-policy";

const NEGOTIATE_TASK = `TASK: Prepare a negotiation kit for clauses that tilt against the reader.

For every clause provided, return one item with the same clauseId:
- rewrite: a fairer version of the clause in clear contract language, balanced for both sides and realistic for the other party to accept. Keep amounts and parties unless changing them is the point.
- message: a short, polite, ready-to-send message (60 to 120 words) from the reader to the other party asking for the change, explaining the reason in plain terms. No threats, no legal conclusions, no placeholders other than the recipient's name if unknown.
These are suggestions for discussion, not legal advice.`;

/**
 * Builds the negotiation prompt from the clauses the reader wants to change.
 * @param clauses - adverse clauses with redacted quotes.
 * @param options - output language and reading level.
 */
export function buildNegotiatePrompt(
  clauses: NegotiateRequest["clauses"],
  options: OutputOptions,
): { system: string; prompt: string } {
  const listing = clauses
    .map(
      (clause) =>
        `clauseId: ${clause.id}\ntitle: ${clause.title}\nwhy it is unfavourable: ${clause.tiltReason}\ntext:\n${fenceUntrusted(clause.id, clause.quote)}`,
    )
    .join("\n\n");
  return {
    system: `${SYSTEM_POLICY}\n\n${NEGOTIATE_TASK}`,
    prompt: `${outputStyleInstruction(options)}\n\nCLAUSES:\n${listing}`,
  };
}
