import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "ClauseWise provides legal information, not legal advice.",
};

const SECTIONS: readonly { heading: string; body: string[] }[] = [
  {
    heading: "Information, not legal advice",
    body: [
      "ClauseWise helps you read and understand legal documents. It provides general legal information only. It is not a law firm, it is not a lawyer, and it does not give legal advice.",
      "Using ClauseWise does not create a lawyer-client relationship. Nothing it shows you is a recommendation about what you should do in your situation.",
    ],
  },
  {
    heading: "Automated analysis can be wrong",
    body: [
      "Explanations, tilt labels, risk levels and suggestions are produced with the help of a generative language model and may be incomplete, out of date or incorrect. ClauseWise checks that every quote it shows appears word-for-word in your document, but it cannot guarantee that its interpretation of that quote is right.",
      "The balance score is a simple, transparent calculation over clause labels. It is a reading aid, not a legal assessment of fairness or enforceability.",
    ],
  },
  {
    heading: "Laws differ by place and change over time",
    body: [
      "Whether a clause is lawful or enforceable depends on the law where you are and on facts outside the document. ClauseWise does not know your full circumstances and does not check local law.",
    ],
  },
  {
    heading: "Talk to a qualified professional",
    body: [
      "Before you sign, refuse to sign, negotiate, or take any legal step, consult a qualified lawyer. If you cannot afford one, a legal aid service in your area may be able to help. The Lawyer Prep Pack is designed to make that conversation faster and cheaper.",
    ],
  },
  {
    heading: "Your document and privacy",
    body: [
      "Documents are processed in memory for a single request and are not stored on our servers. Before any text is sent to the language model, emails, phone numbers, Aadhaar-like and PAN-like numbers and long account-style numbers are masked. The rest of the document, including names and addresses, is sent to the model provider for processing. Do not upload documents you are not permitted to share.",
    ],
  },
];

export default function DisclaimerPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-serif text-4xl font-semibold">Disclaimer</h1>
        <p className="mt-3 text-lg text-muted">
          Please read this before relying on anything ClauseWise tells you.
        </p>
      </header>
      {SECTIONS.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="font-serif text-2xl font-semibold">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
