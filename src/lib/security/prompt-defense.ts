/**
 * Phrases that try to steer the model from inside a document. Legal text almost never
 * addresses an AI system, so matches are counted, reported to the user and neutralised by
 * the instruction hierarchy in the system policy.
 */
const INJECTION_PATTERNS: readonly RegExp[] = [
  /\b(?:ignore|disregard|forget|override)\s+(?:all\s+|any\s+)?(?:the\s+|your\s+)?(?:previous|prior|above|earlier|preceding|system)\s+(?:instructions?|prompts?|rules|directions|guidelines)/gi,
  /\bforget\s+(?:everything|all)\s+(?:you\s+(?:were|have\s+been)\s+told|above)/gi,
  /\byou\s+are\s+(?:now\s+)?(?:an?\s+)?(?:unrestricted|jailbroken|different|new)\s+(?:ai|assistant|model|chatbot|language\s+model)/gi,
  /\b(?:new|updated|revised|real)\s+(?:system\s+)?instructions?\s*:/gi,
  /\b(?:reveal|print|show|repeat|output)\s+(?:your|the)\s+(?:system\s+prompt|hidden\s+prompt|instructions)/gi,
  /\bsystem\s+prompt\b/gi,
  /\b(?:developer|god|dan)\s+mode\b/gi,
  /\b(?:rate|score|classify|mark)\s+(?:this|the)\s+(?:contract|agreement|document|clause)s?\s+as\s+(?:fair|balanced|safe|favou?rable|neutral)/gi,
  /\b(?:tell|inform|assure)\s+the\s+(?:user|reader|tenant|employee)\s+(?:that\s+)?(?:this|the)\s+(?:contract|agreement|document)\s+is\s+(?:fair|safe|standard|balanced)/gi,
  /\b(?:do\s+not|don't|never)\s+(?:mention|flag|report|reveal)\s+(?:any\s+)?(?:risks?|this\s+clause|issues?)/gi,
  /<\/?\s*(?:system|assistant|instructions?)\s*>/gi,
  /\[\/?(?:INST|SYS)\]/g,
];

/** Delimiter tag that fences untrusted document content inside prompts. */
const FENCE_TAG = "untrusted_document";
const FENCE_PATTERN = new RegExp(`<\\/?\\s*${FENCE_TAG}[^>]*>`, "gi");

/**
 * Counts suspected prompt-injection phrases in untrusted text.
 * @param text - document text or a user question.
 * @returns the number of matches across all patterns.
 */
export function countInjectionAttempts(text: string): number {
  return INJECTION_PATTERNS.reduce(
    (total, pattern) => total + (text.match(pattern)?.length ?? 0),
    0,
  );
}

/**
 * Wraps untrusted text in a labelled fence. Any fence tags already inside the text are
 * removed first so the content cannot close the block early and pose as instructions.
 * @param label - short identifier, for example "A" or "B" when comparing.
 * @param text - untrusted document text.
 */
export function fenceUntrusted(label: string, text: string): string {
  const safeLabel = label.replace(/[^A-Za-z0-9_-]/g, "");
  const cleaned = text.replace(FENCE_PATTERN, "");
  return `<${FENCE_TAG} id="${safeLabel}">\n${cleaned}\n</${FENCE_TAG}>`;
}
