import { Badge } from "@/components/ui/Badge";
import type { AnswerResult, AnswerStatus, Confidence } from "@/lib/schemas/qa";
import type { Tone } from "@/lib/utils/format";

const STATUS: Record<AnswerStatus, { label: string; tone: Tone }> = {
  ANSWERED: { label: "Answered from your document", tone: "good" },
  NOT_IN_DOCUMENT: { label: "Not stated in your document", tone: "info" },
  LEGAL_ADVICE_REFUSED: { label: "Needs a lawyer", tone: "warn" },
};

const CONFIDENCE: Record<Confidence, Tone> = { HIGH: "good", MEDIUM: "warn", LOW: "bad" };

/** One question and its grounded answer, with every supporting quote verified. */
export function AnswerCard({ question, answer }: { question: string; answer: AnswerResult }) {
  const status = STATUS[answer.status];
  return (
    <article className="rounded-xl border border-line bg-surface p-5">
      <h3 className="font-semibold">
        <span className="text-muted">Q: </span>
        {question}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge tone={CONFIDENCE[answer.confidence]} icon={null}>
          Confidence: {answer.confidence.toLowerCase()}
        </Badge>
      </div>
      <p className="mt-3 whitespace-pre-wrap leading-relaxed">{answer.answer}</p>
      {answer.evidence.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">
            From your document
          </h4>
          {answer.evidence.map((evidence) => (
            <figure key={evidence.offset}>
              <blockquote className="whitespace-pre-wrap border-l-4 border-accent pl-3 font-serif italic">
                {evidence.quote}
              </blockquote>
              <figcaption className="mt-1 text-xs text-muted">
                Verified word-for-word, characters {evidence.offset.toLocaleString("en-IN")}–
                {(evidence.offset + evidence.length).toLocaleString("en-IN")}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {answer.grounding.total > answer.grounding.verified && (
        <p className="mt-3 text-xs text-muted">
          {answer.grounding.total - answer.grounding.verified} quoted passage(s) could not be found
          in your document and were hidden.
        </p>
      )}
    </article>
  );
}
