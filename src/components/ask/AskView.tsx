"use client";

import { FIELD_CLASS } from "@/components/ui/field";
import { useId, useState } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { NoDocumentState } from "@/components/session/NoDocumentState";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { OutputOptionsControls } from "@/components/ui/OutputOptionsControls";
import { Spinner } from "@/components/ui/Spinner";
import { ClientError, postJson } from "@/lib/client/api-client";
import { MAX_QUESTION_CHARS, MIN_QUESTION_CHARS } from "@/lib/constants";
import type { OutputOptions } from "@/lib/schemas/document";
import type { AnswerResult } from "@/lib/schemas/qa";
import { AnswerCard } from "./AnswerCard";

const EXAMPLES = [
  "How much notice do I need to give to leave?",
  "What happens to my deposit when I move out?",
  "Can the other party change the terms later?",
  "Should I sue if they keep my deposit?",
];

/** Grounded Q&A over the document in the current session. */
export function AskView() {
  const { session } = useSession();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<OutputOptions>({ language: "en", plainLanguage: false });
  const [history, setHistory] = useState<{ question: string; answer: AnswerResult }[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const countId = useId();

  if (!session) {
    return (
      <NoDocumentState purpose="Grounded Q&A answers questions using only the text of your document." />
    );
  }

  const trimmed = question.trim();
  const valid = trimmed.length >= MIN_QUESTION_CHARS && trimmed.length <= MAX_QUESTION_CHARS;

  const ask = async (text: string) => {
    setPending(true);
    setError(null);
    try {
      const answer = await postJson<AnswerResult>("/api/ask", {
        ...options,
        question: text,
        documentText: session.document.text,
      });
      setHistory((items) => [{ question: text, answer }, ...items]);
      setQuestion("");
    } catch (caught) {
      setError(caught instanceof ClientError ? caught.message : "Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Ask about your document</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Answers come only from <strong className="text-ink">{session.document.name}</strong>, with
          the exact passages quoted. If the document does not say, ClauseWise tells you so instead
          of guessing. It will not advise you on legal strategy.
        </p>
      </div>

      <form
        className="space-y-4 rounded-xl border border-line bg-surface p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid && !pending) void ask(trimmed);
        }}
      >
        <label htmlFor={inputId} className="block font-semibold">
          Your question
        </label>
        <textarea
          id={inputId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_QUESTION_CHARS}
          rows={3}
          aria-describedby={countId}
          className={`${FIELD_CLASS} p-3`}
        />
        <p id={countId} className="text-xs text-muted">
          {trimmed.length}/{MAX_QUESTION_CHARS} characters
        </p>
        <div className="flex flex-wrap gap-2" aria-label="Example questions" role="group">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuestion(example)}
              className="min-h-11 rounded-full border border-line px-3 text-sm hover:border-accent"
            >
              {example}
            </button>
          ))}
        </div>
        <OutputOptionsControls value={options} onChange={setOptions} />
        <Button type="submit" disabled={!valid || pending}>
          {pending ? <Spinner className="size-4" /> : null}
          {pending ? "Finding the answer…" : "Ask"}
        </Button>
      </form>

      <div aria-live="polite" className="space-y-4">
        {error && (
          <ErrorState
            title="We could not answer that"
            message={error}
            actions={
              <Button onClick={() => void ask(trimmed)} disabled={!valid || pending}>
                Try again
              </Button>
            }
          />
        )}
        {history.map((item, index) => (
          <AnswerCard
            key={`${history.length - index}`}
            question={item.question}
            answer={item.answer}
          />
        ))}
      </div>
    </div>
  );
}
