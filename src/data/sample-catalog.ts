import type { SampleId } from "@/lib/schemas/document";

/** Display information for the bundled sample documents. */
export const SAMPLE_CATALOG: readonly {
  id: SampleId;
  fileName: string;
  title: string;
  description: string;
}[] = [
  {
    id: "rental",
    fileName: "Sample rental agreement.txt",
    title: "Rental agreement",
    description: "An 11-month flat licence with a six-month deposit and one-sided termination.",
  },
  {
    id: "employment",
    fileName: "Sample job offer.txt",
    title: "Job offer",
    description: "An offer letter with a training bond, bonus clawback and a global non-compete.",
  },
  {
    id: "nda",
    fileName: "Sample NDA.txt",
    title: "Non-disclosure agreement",
    description: "A 'mutual' NDA that binds only one side, with a hidden instruction inside.",
  },
];

/**
 * Narrows an untrusted string to a bundled sample id without pulling a validation library into
 * the browser bundle.
 * @param value - for example a URL parameter or a detected document type.
 * @returns the matching sample id, or undefined.
 */
export function toSampleId(value: string | null | undefined): SampleId | undefined {
  return SAMPLE_CATALOG.find((sample) => sample.id === value)?.id;
}
