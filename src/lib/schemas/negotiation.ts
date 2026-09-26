import { z } from "zod";
import { MAX_QUOTE_CHARS } from "@/lib/constants";
import { OutputOptionsSchema } from "./document";

const MAX_NEGOTIABLE_CLAUSES = 15;

export const NegotiateRequestSchema = OutputOptionsSchema.extend({
  clauses: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        title: z.string().min(1).max(200),
        quote: z.string().min(1).max(MAX_QUOTE_CHARS),
        tiltReason: z.string().min(1).max(500),
      }),
    )
    .min(1)
    .max(MAX_NEGOTIABLE_CLAUSES),
});
export type NegotiateRequest = z.infer<typeof NegotiateRequestSchema>;

export const NegotiationItemSchema = z.object({
  clauseId: z.string().describe("The id of the clause this suggestion is for"),
  rewrite: z.string().trim().min(1).describe("A fairer rewrite of the clause"),
  message: z.string().trim().min(1).describe("A short, polite, ready-to-send negotiation message"),
});
export type NegotiationItem = z.infer<typeof NegotiationItemSchema>;

export const NegotiationModelOutputSchema = z.object({
  items: z.array(NegotiationItemSchema).max(MAX_NEGOTIABLE_CLAUSES),
});
export type NegotiationModelOutput = z.infer<typeof NegotiationModelOutputSchema>;
