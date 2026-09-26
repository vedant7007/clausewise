import { AppError } from "@/lib/errors";
import type { AnalyzeEvent } from "@/lib/schemas/analyze-stream";

vi.mock("server-only", () => ({}));

const generate = vi.fn();
vi.mock("@/lib/ai", () => ({ getAIManager: () => ({ generate }) }));

const { runAnalyzeRequest } = await import("@/lib/services/analyze-request");
const OPTIONS = { language: "en", plainLanguage: false } as const;
const TEXT = "This agreement is between the landlord and the tenant for the flat at 402.";

async function run(source: Parameters<typeof runAnalyzeRequest>[0]["source"]) {
  const events: AnalyzeEvent[] = [];
  await runAnalyzeRequest({ source, options: OPTIONS }, (event) => events.push(event));
  return events;
}

beforeEach(() => {
  generate.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("runAnalyzeRequest", () => {
  it("serves the saved analysis for a bundled sample when the model is unavailable", async () => {
    generate.mockRejectedValue(new AppError("AI_UNAVAILABLE", "down"));
    const events = await run({ kind: "sample", sampleId: "nda" });
    const result = events.at(-1);
    expect(result?.type).toBe("result");
    if (result?.type !== "result") return;
    expect(result.result.source).toBe("fixture");
    expect(result.document.sampleId).toBe("nda");
    expect(result.document.text).toContain("MUTUAL NON-DISCLOSURE AGREEMENT");
  });

  it("never uses a saved analysis for the user's own documents", async () => {
    generate.mockRejectedValue(new AppError("AI_UNAVAILABLE", "down"));
    await expect(run({ kind: "text", name: "Pasted text", text: TEXT })).rejects.toMatchObject({
      code: "AI_UNAVAILABLE",
    });
  });

  it("does not hide invalid model output behind a fixture", async () => {
    generate.mockRejectedValue(new AppError("AI_INVALID_OUTPUT", "bad"));
    await expect(run({ kind: "sample", sampleId: "rental" })).rejects.toMatchObject({
      code: "AI_INVALID_OUTPUT",
    });
  });

  it("emits the parsing stage before any model work", async () => {
    generate.mockRejectedValue(new AppError("AI_UNAVAILABLE", "down"));
    const events = await run({ kind: "sample", sampleId: "employment" });
    expect(events[0]).toEqual({ type: "stage", stage: "parsing" });
  });
});
