import { z } from "zod";
import { DocumentTextSchema, OutputOptionsSchema, SampleIdSchema } from "./document";
import { EvidenceSchema, GroundingSchema, QuoteSchema } from "./evidence";

export const ChangeTypeSchema = z.enum(["ADDED", "REMOVED", "MODIFIED"]);
export type ChangeType = z.infer<typeof ChangeTypeSchema>;

export const ImportanceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type Importance = z.infer<typeof ImportanceSchema>;

const NamedDocumentSchema = z.object({
  name: z.string().trim().min(1).max(255),
  text: DocumentTextSchema,
});

/** Compare two user documents, or one document against a bundled fair baseline. */
export const CompareRequestSchema = OutputOptionsSchema.extend({
  left: NamedDocumentSchema,
  right: z.discriminatedUnion("mode", [
    NamedDocumentSchema.extend({ mode: z.literal("document") }),
    z.object({ mode: z.literal("baseline"), baseline: SampleIdSchema }),
  ]),
});
export type CompareRequest = z.infer<typeof CompareRequestSchema>;

export const ModelDifferenceSchema = z.object({
  topic: z.string().trim().min(1),
  change: ChangeTypeSchema.describe("ADDED: only in B. REMOVED: only in A. MODIFIED: in both"),
  importance: ImportanceSchema,
  whatChanged: z.string().trim().min(1),
  whatItMeansForYou: z.string().trim().min(1),
  leftQuote: QuoteSchema.nullable().describe("Verbatim quote from document A, or null if absent"),
  rightQuote: QuoteSchema.nullable().describe("Verbatim quote from document B, or null if absent"),
});
export type ModelDifference = z.infer<typeof ModelDifferenceSchema>;

export const CompareModelOutputSchema = z.object({
  summary: z.string().trim().min(1),
  differences: z.array(ModelDifferenceSchema).max(25),
});
export type CompareModelOutput = z.infer<typeof CompareModelOutputSchema>;

export const DifferenceSchema = ModelDifferenceSchema.omit({
  leftQuote: true,
  rightQuote: true,
}).extend({
  id: z.string(),
  leftEvidence: EvidenceSchema.nullable(),
  rightEvidence: EvidenceSchema.nullable(),
});
export type Difference = z.infer<typeof DifferenceSchema>;

export const CompareResultSchema = z.object({
  leftName: z.string(),
  rightName: z.string(),
  summary: z.string(),
  differences: z.array(DifferenceSchema),
  grounding: GroundingSchema,
  redactionCount: z.number().int().nonnegative(),
  injectionsIgnored: z.number().int().nonnegative(),
});
export type CompareResult = z.infer<typeof CompareResultSchema>;
