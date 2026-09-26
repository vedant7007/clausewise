import { AnalysisModelOutputSchema, AnalysisResultSchema } from "@/lib/schemas/analysis";
import { CompareModelOutputSchema, CompareRequestSchema } from "@/lib/schemas/compare";
import { OutputOptionsSchema, ParsedDocumentSchema } from "@/lib/schemas/document";
import { NegotiateRequestSchema, NegotiationModelOutputSchema } from "@/lib/schemas/negotiation";
import { AnswerModelOutputSchema, AskRequestSchema } from "@/lib/schemas/qa";

const DOC = "This Rental Agreement is made between the Landlord and the Tenant for the flat.";

const modelAnalysis = {
  brief: {
    documentType: "rental",
    title: "Residential rental agreement",
    userParty: "Tenant",
    summary: "You rent a flat for 11 months.",
    purpose: "Sets the terms of renting the flat.",
    parties: [{ name: "A. Sharma", role: "Landlord" }],
    agreeingTo: ["Pay rent monthly"],
  },
  clauses: [
    {
      title: "Security deposit",
      category: "payment",
      meaning: "You pay three months of rent up front.",
      tilt: "FAVORS_COUNTERPARTY",
      tiltReason: "Deposit is high.",
      quote: "security deposit of three months",
    },
  ],
  risks: [
    {
      title: "Deposit deductions",
      severity: "HIGH",
      whatItSays: "Landlord may deduct any amount.",
      whatCouldGoWrong: "You lose most of the deposit.",
      whoItHurts: "Tenant",
      recommendedAction: "Ask for an itemised list.",
      quote: "deduct any amount",
    },
  ],
  obligations: [
    {
      party: "Tenant",
      action: "Pay rent",
      deadline: "by the 5th of each month",
      dueDate: null,
      consequence: "Late fee",
      quote: "on or before the 5th",
    },
  ],
  prep: {
    questions: ["Is the deposit cap legal here?"],
    informationGaps: [],
    documentsToBring: ["The agreement"],
    caseSummary: "An 11-month flat rental.",
  },
};

describe("OutputOptionsSchema", () => {
  it("applies defaults", () => {
    expect(OutputOptionsSchema.parse({})).toEqual({ language: "en", plainLanguage: false });
  });
  it("rejects an unknown language", () => {
    expect(OutputOptionsSchema.safeParse({ language: "fr" }).success).toBe(false);
  });
});

describe("ParsedDocumentSchema", () => {
  it("accepts a parsed document", () => {
    expect(
      ParsedDocumentSchema.safeParse({ fileName: "a.txt", kind: "txt", text: DOC }).success,
    ).toBe(true);
  });
  it("rejects text that is too short", () => {
    expect(
      ParsedDocumentSchema.safeParse({ fileName: "a.txt", kind: "txt", text: "hi" }).success,
    ).toBe(false);
  });
});

describe("AnalysisModelOutputSchema", () => {
  it("accepts a well-formed model response", () => {
    expect(AnalysisModelOutputSchema.safeParse(modelAnalysis).success).toBe(true);
  });
  it("rejects an unknown tilt", () => {
    const bad = structuredClone(modelAnalysis);
    bad.clauses[0]!.tilt = "SLIGHTLY_BAD";
    expect(AnalysisModelOutputSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects a malformed due date", () => {
    const bad = structuredClone(modelAnalysis) as { obligations: { dueDate: string | null }[] };
    bad.obligations[0]!.dueDate = "5th March";
    expect(AnalysisModelOutputSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects a clause without a quote", () => {
    const bad = structuredClone(modelAnalysis) as { clauses: Record<string, unknown>[] };
    delete bad.clauses[0]!.quote;
    expect(AnalysisModelOutputSchema.safeParse(bad).success).toBe(false);
  });
});

describe("AnalysisResultSchema", () => {
  it("rejects a balance score above 100", () => {
    const result = AnalysisResultSchema.safeParse({
      ...modelAnalysis,
      clauses: [],
      risks: [],
      obligations: [],
      balance: { score: 140, verdict: "x" },
      grounding: { verified: 0, total: 0 },
      redactionCount: 0,
      injectionsIgnored: 0,
      truncated: false,
      language: "en",
      source: "live",
    });
    expect(result.success).toBe(false);
  });
});

describe("AskRequestSchema", () => {
  it("accepts a question with a document", () => {
    expect(
      AskRequestSchema.safeParse({ documentText: DOC, question: "What is the rent?" }).success,
    ).toBe(true);
  });
  it("rejects a question over 1,000 characters", () => {
    const question = "a".repeat(1_001);
    expect(AskRequestSchema.safeParse({ documentText: DOC, question }).success).toBe(false);
  });
});

describe("AnswerModelOutputSchema", () => {
  it("accepts a refusal with no quotes", () => {
    const refusal = {
      status: "LEGAL_ADVICE_REFUSED",
      answer: "Please see a lawyer.",
      quotes: [],
      confidence: "HIGH",
    };
    expect(AnswerModelOutputSchema.safeParse(refusal).success).toBe(true);
  });
  it("rejects an unknown status", () => {
    const bad = { status: "MAYBE", answer: "x", quotes: [], confidence: "HIGH" };
    expect(AnswerModelOutputSchema.safeParse(bad).success).toBe(false);
  });
});

describe("CompareRequestSchema", () => {
  it("accepts a baseline comparison", () => {
    const request = {
      left: { name: "mine.txt", text: DOC },
      right: { mode: "baseline", baseline: "nda" },
    };
    expect(CompareRequestSchema.safeParse(request).success).toBe(true);
  });
  it("accepts a two-document comparison", () => {
    const request = {
      left: { name: "a.txt", text: DOC },
      right: { mode: "document", name: "b.txt", text: DOC },
    };
    expect(CompareRequestSchema.safeParse(request).success).toBe(true);
  });
  it("rejects an unknown baseline", () => {
    const request = {
      left: { name: "a.txt", text: DOC },
      right: { mode: "baseline", baseline: "loan" },
    };
    expect(CompareRequestSchema.safeParse(request).success).toBe(false);
  });
});

describe("CompareModelOutputSchema", () => {
  it("accepts a difference present only in one document", () => {
    const output = {
      summary: "B adds a penalty.",
      differences: [
        {
          topic: "Penalty",
          change: "ADDED",
          importance: "HIGH",
          whatChanged: "B adds a late fee.",
          whatItMeansForYou: "You pay more if late.",
          leftQuote: null,
          rightQuote: "late fee of 10%",
        },
      ],
    };
    expect(CompareModelOutputSchema.safeParse(output).success).toBe(true);
  });
});

describe("Negotiation schemas", () => {
  it("rejects an empty clause list", () => {
    expect(NegotiateRequestSchema.safeParse({ clauses: [] }).success).toBe(false);
  });
  it("accepts model suggestions", () => {
    const output = { items: [{ clauseId: "c1", rewrite: "Fairer text", message: "Hello," }] };
    expect(NegotiationModelOutputSchema.safeParse(output).success).toBe(true);
  });
});
