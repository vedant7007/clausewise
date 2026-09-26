import { z } from "zod";
import { MAX_QUOTE_CHARS } from "@/lib/constants";

/** Verbatim excerpt the model must copy from the document to back a claim. */
export const QuoteSchema = z
  .string()
  .min(1)
  .max(MAX_QUOTE_CHARS)
  .describe("Exact, verbatim excerpt copied from the document that supports this item");

/** A quote that the deterministic verifier located in the source text. */
export const EvidenceSchema = z.object({
  quote: z.string(),
  offset: z.number().int().nonnegative(),
  length: z.number().int().positive(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

/** How many model claims survived verification. */
export const GroundingSchema = z.object({
  verified: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type Grounding = z.infer<typeof GroundingSchema>;
