import { z } from "zod";

/** How many validation issues are reported back to the model in a repair prompt. */
const MAX_REPORTED_ISSUES = 12;

/**
 * Size and pattern keywords are enforced by Zod after the response arrives. Sending them to
 * the provider bloats constrained decoding (Gemini rejects such schemas as "too many states").
 */
const LOCAL_ONLY_KEYWORDS = new Set([
  "$schema",
  "minItems",
  "maxItems",
  "minLength",
  "maxLength",
  "pattern",
  "format",
]);

function stripLocalOnly(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripLocalOnly);
  if (node === null || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => !LOCAL_ONLY_KEYWORDS.has(key))
      .map(([key, child]) => [key, stripLocalOnly(child)]),
  );
}

/**
 * Converts a Zod schema into the structural JSON Schema sent to providers: types, enums,
 * required fields and descriptions. Length and pattern limits stay in Zod validation.
 * @param schema - a model output schema.
 */
export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return stripLocalOnly(z.toJSONSchema(schema, { io: "input" })) as Record<string, unknown>;
}

/** Outcome of validating raw model text. `problem` is phrased for a repair prompt. */
export type ValidationOutcome<T> = { success: true; data: T } | { success: false; problem: string };

/**
 * Parses raw model text as JSON (tolerating a markdown fence) and validates it.
 * @param schema - expected output schema.
 * @param raw - text returned by a provider.
 * @returns the data, or a readable list of problems. Never throws.
 */
export function validateOutput<T>(schema: z.ZodType<T>, raw: string): ValidationOutcome<T> {
  let json: unknown;
  try {
    json = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return { success: false, problem: "- (root): response was not valid JSON" };
  }
  const result = schema.safeParse(json);
  if (result.success) return { success: true, data: result.data };
  const problem = result.error.issues
    .slice(0, MAX_REPORTED_ISSUES)
    .map((issue) => `- ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  return { success: false, problem };
}
