import { answerQuestion } from "@/lib/services/ask-service";
import { compareDocuments } from "@/lib/services/compare-service";
import { draftNegotiation } from "@/lib/services/negotiate-service";
import { fakeManager } from "../../helpers/fixtures";

const DOC =
  "The Employee shall give 90 days notice. Contact hr@corp.example for leave. Salary is paid monthly in arrears.";
const OPTIONS = { language: "en", plainLanguage: false } as const;

describe("answerQuestion", () => {
  it("keeps verified quotes and redacts the question", async () => {
    const { manager, generate } = fakeManager({
      status: "ANSWERED",
      answer: "You must give 90 days notice.",
      quotes: ["The Employee shall give 90 days notice.", "a quote that is not in the document"],
      confidence: "HIGH",
    });
    const result = await answerQuestion(
      { ...OPTIONS, documentText: DOC, question: "Can I email me@home.example about notice?" },
      manager,
    );
    expect(generate.mock.calls[0]![0].prompt).not.toContain("me@home.example");
    expect(result.evidence).toHaveLength(1);
    expect(result.grounding).toEqual({ verified: 1, total: 2 });
    expect(result.confidence).toBe("HIGH");
  });

  it("downgrades confidence when an answer has no verifiable support", async () => {
    const { manager } = fakeManager({
      status: "ANSWERED",
      answer: "Yes.",
      quotes: ["invented text"],
      confidence: "HIGH",
    });
    const result = await answerQuestion(
      { ...OPTIONS, documentText: DOC, question: "Bonus?" },
      manager,
    );
    expect(result.confidence).toBe("LOW");
  });

  it("passes through a legal-advice refusal", async () => {
    const { manager } = fakeManager({
      status: "LEGAL_ADVICE_REFUSED",
      answer: "Please consult a lawyer.",
      quotes: [],
      confidence: "HIGH",
    });
    const result = await answerQuestion(
      { ...OPTIONS, documentText: DOC, question: "Should I sue?" },
      manager,
    );
    expect(result.status).toBe("LEGAL_ADVICE_REFUSED");
    expect(result.evidence).toEqual([]);
  });
});

describe("compareDocuments", () => {
  const left = { name: "A", text: "Notice period is 90 days. Rent increases 15% yearly." };
  const right = { name: "B", text: "Notice period is 30 days. Security deposit is two months." };

  it("keeps differences whose quotes are all verified, sorted by importance", async () => {
    const { manager } = fakeManager({
      summary: "A is stricter.",
      differences: [
        {
          topic: "Deposit",
          change: "ADDED",
          importance: "LOW",
          whatChanged: "B sets a deposit.",
          whatItMeansForYou: "x",
          leftQuote: null,
          rightQuote: "Security deposit is two months.",
        },
        {
          topic: "Notice",
          change: "MODIFIED",
          importance: "HIGH",
          whatChanged: "Longer notice in A.",
          whatItMeansForYou: "x",
          leftQuote: "Notice period is 90 days.",
          rightQuote: "Notice period is 30 days.",
        },
        {
          topic: "Invented",
          change: "MODIFIED",
          importance: "HIGH",
          whatChanged: "x",
          whatItMeansForYou: "x",
          leftQuote: "Rent increases 15% yearly.",
          rightQuote: "Rent is frozen for five years.",
        },
      ],
    });
    const result = await compareDocuments(left, right, "another version", OPTIONS, manager);
    expect(result.differences.map((difference) => difference.topic)).toEqual(["Notice", "Deposit"]);
    expect(result.grounding).toEqual({ verified: 2, total: 3 });
    expect(result.differences[0]!.leftEvidence?.quote).toBe("Notice period is 90 days");
  });
});

describe("draftNegotiation", () => {
  it("returns suggestions in request order and ignores unknown clause ids", async () => {
    const { manager, generate } = fakeManager({
      items: [
        { clauseId: "c2", rewrite: "Fair two", message: "Hello two" },
        { clauseId: "unknown", rewrite: "x", message: "x" },
        { clauseId: "c1", rewrite: "Fair one, email [EMAIL_1]", message: "Hello one" },
      ],
    });
    const items = await draftNegotiation(
      {
        ...OPTIONS,
        clauses: [
          {
            id: "c1",
            title: "One",
            quote: "Notify owner@flat.example within 3 days.",
            tiltReason: "Short",
          },
          { id: "c2", title: "Two", quote: "Deposit is forfeited.", tiltReason: "Harsh" },
        ],
      },
      manager,
    );
    expect(items.map((item) => item.clauseId)).toEqual(["c1", "c2"]);
    expect(items[0]!.rewrite).toBe("Fair one, email owner@flat.example");
    expect(generate.mock.calls[0]![0].prompt).not.toContain("owner@flat.example");
  });
});
