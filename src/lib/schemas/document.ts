import { z } from "zod";
import { MAX_TEXT_CHARS, MIN_DOCUMENT_CHARS } from "@/lib/constants";

export const DocumentTypeSchema = z.enum([
  "rental",
  "employment",
  "nda",
  "loan",
  "service",
  "other",
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentKindSchema = z.enum(["pdf", "docx", "txt", "md"]);
export type DocumentKind = z.infer<typeof DocumentKindSchema>;

export const LanguageSchema = z.enum(["en", "hi", "te"]);
export type Language = z.infer<typeof LanguageSchema>;

/** Bundled sample documents; the same ids name the fair baselines. */
export const SampleIdSchema = z.enum(["rental", "employment", "nda"]);
export type SampleId = z.infer<typeof SampleIdSchema>;

/** Document text carried in a request, bounded so a body can never be oversized. */
export const DocumentTextSchema = z.string().trim().min(MIN_DOCUMENT_CHARS).max(MAX_TEXT_CHARS);

/** Output preferences that every model-backed request accepts. */
export const OutputOptionsSchema = z.object({
  language: LanguageSchema.default("en"),
  plainLanguage: z.boolean().default(false),
});
export type OutputOptions = z.infer<typeof OutputOptionsSchema>;

/** A document after upload validation and text extraction. */
export const ParsedDocumentSchema = z.object({
  fileName: z.string().min(1).max(255),
  kind: DocumentKindSchema,
  text: DocumentTextSchema,
});
export type ParsedDocument = z.infer<typeof ParsedDocumentSchema>;
