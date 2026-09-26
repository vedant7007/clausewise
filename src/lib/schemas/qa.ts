import { z } from "zod";
import { MAX_QUESTION_CHARS, MIN_QUESTION_CHARS } from "@/lib/constants";
import { DocumentTextSchema, OutputOptionsSchema } from "./document";
import { EvidenceSchema, GroundingSchema, QuoteSchema } from "./evidence";

export const ConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const AnswerStatusSchema = z.enum(["ANSWERED", "NOT_IN_DOCUMENT", "LEGAL_ADVICE_REFUSED"]);
export type AnswerStatus = z.infer<typeof AnswerStatusSchema>;

export const AskRequestSchema = OutputOptionsSchema.extend({
  documentText: DocumentTextSchema,
  question: z.string().trim().min(MIN_QUESTION_CHARS).max(MAX_QUESTION_CHARS),
});
export type AskRequest = z.infer<typeof AskRequestSchema>;

export const AnswerModelOutputSchema = z.object({
  status: AnswerStatusSchema,
  answer: z.string().trim().min(1),
  quotes: z.array(QuoteSchema).max(5),
  confidence: ConfidenceSchema,
});
export type AnswerModelOutput = z.infer<typeof AnswerModelOutputSchema>;

export const AnswerResultSchema = z.object({
  status: AnswerStatusSchema,
  answer: z.string(),
  evidence: z.array(EvidenceSchema),
  confidence: ConfidenceSchema,
  grounding: GroundingSchema,
  injectionsIgnored: z.number().int().nonnegative(),
});
export type AnswerResult = z.infer<typeof AnswerResultSchema>;
