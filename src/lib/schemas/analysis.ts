import { z } from "zod";
import { DocumentTypeSchema, LanguageSchema } from "./document";
import { EvidenceSchema, GroundingSchema, QuoteSchema } from "./evidence";

export const TiltSchema = z.enum([
  "FAVORS_YOU",
  "NEUTRAL",
  "FAVORS_COUNTERPARTY",
  "HEAVILY_FAVORS_COUNTERPARTY",
]);
export type Tilt = z.infer<typeof TiltSchema>;

export const ClauseCategorySchema = z.enum([
  "termination",
  "payment",
  "liability",
  "confidentiality",
  "renewal",
  "jurisdiction",
  "indemnity",
  "penalty",
  "notice",
  "other",
]);
export type ClauseCategory = z.infer<typeof ClauseCategorySchema>;

export const SeveritySchema = z.enum(["HIGH", "MEDIUM", "LOW", "INFO"]);
export type Severity = z.infer<typeof SeveritySchema>;

const text = z.string().trim().min(1);

export const PartySchema = z.object({ name: text, role: text });

export const BriefSchema = z.object({
  documentType: DocumentTypeSchema,
  title: text.describe("Short descriptive title of the document"),
  userParty: text.describe("The party the reader most likely is, for example Tenant or Employee"),
  summary: text.describe("Executive summary at an 8th-grade reading level"),
  purpose: text.describe("What this document does, in one or two sentences"),
  parties: z.array(PartySchema).min(1).max(8),
  agreeingTo: z.array(text).min(1).max(7).describe("Five bullets: what the reader agrees to"),
});
export type Brief = z.infer<typeof BriefSchema>;

export const ModelClauseSchema = z.object({
  title: text,
  // An unknown category is display metadata, so it degrades to "other" instead of failing.
  category: ClauseCategorySchema.catch("other"),
  meaning: text.describe("Plain-English meaning of the clause"),
  tilt: TiltSchema.describe("Who the clause favours, from the reader's point of view"),
  tiltReason: text.describe("One line explaining the tilt"),
  quote: QuoteSchema,
});

export const ModelRiskSchema = z.object({
  title: text,
  severity: SeveritySchema,
  whatItSays: text,
  whatCouldGoWrong: text.describe("A concrete, real-world consequence"),
  whoItHurts: text,
  recommendedAction: text,
  quote: QuoteSchema,
});

export const ModelObligationSchema = z.object({
  party: text.describe("Who must act"),
  action: text.describe("What they must do"),
  deadline: text.describe("The deadline exactly as the document states it, relative or absolute"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe("ISO date (YYYY-MM-DD) only when the document states an absolute date, else null"),
  consequence: text.describe("What happens if the deadline is missed"),
  quote: QuoteSchema,
});

export const PrepPackSchema = z.object({
  questions: z.array(text).min(1).max(8).describe("The most important questions to ask a lawyer"),
  informationGaps: z.array(text).max(10).describe("Things the document leaves unclear or missing"),
  documentsToBring: z.array(text).max(10),
  caseSummary: text.describe("A one-page neutral summary to hand to a lawyer"),
});
export type PrepPack = z.infer<typeof PrepPackSchema>;

/** The single consolidated object requested from the model for a document analysis. */
export const AnalysisModelOutputSchema = z.object({
  brief: BriefSchema,
  clauses: z.array(ModelClauseSchema).max(30),
  risks: z.array(ModelRiskSchema).max(20),
  obligations: z.array(ModelObligationSchema).max(20),
  prep: PrepPackSchema,
});
export type AnalysisModelOutput = z.infer<typeof AnalysisModelOutputSchema>;

const withEvidence = { id: z.string(), evidence: EvidenceSchema };
export const ClauseSchema = ModelClauseSchema.omit({ quote: true }).extend(withEvidence);
export type Clause = z.infer<typeof ClauseSchema>;
export const RiskSchema = ModelRiskSchema.omit({ quote: true }).extend(withEvidence);
export type Risk = z.infer<typeof RiskSchema>;
export const ObligationSchema = ModelObligationSchema.omit({ quote: true }).extend(withEvidence);
export type Obligation = z.infer<typeof ObligationSchema>;

export const BalanceSchema = z.object({
  score: z.number().int().min(0).max(100).nullable(),
  verdict: z.string(),
});
export type Balance = z.infer<typeof BalanceSchema>;

/** Verified, enriched analysis returned to the client. */
export const AnalysisResultSchema = z.object({
  brief: BriefSchema,
  clauses: z.array(ClauseSchema),
  risks: z.array(RiskSchema),
  obligations: z.array(ObligationSchema),
  prep: PrepPackSchema,
  balance: BalanceSchema,
  grounding: GroundingSchema,
  redactionCount: z.number().int().nonnegative(),
  injectionsIgnored: z.number().int().nonnegative(),
  truncated: z.boolean(),
  language: LanguageSchema,
  source: z.enum(["live", "fixture"]),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
