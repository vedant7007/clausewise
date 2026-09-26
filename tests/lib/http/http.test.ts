import { z } from "zod";
import { AppError } from "@/lib/errors";
import { readAnalyzeInput } from "@/lib/http/analyze-input";
import { ndjsonResponse } from "@/lib/http/ndjson";
import { errorResponse, readJsonBody } from "@/lib/http/responses";

const TEXT = "This agreement is between the landlord and the tenant for the flat at 402.";

function formRequest(fields: Record<string, string | File>, headers: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return new Request("http://test/api/analyze", { method: "POST", body: form, headers });
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  return promise.then(
    () => "none",
    (error: unknown) => (error instanceof AppError ? error.code : "other"),
  );
}

describe("readAnalyzeInput", () => {
  it("accepts a sample with default options", async () => {
    const input = await readAnalyzeInput(formRequest({ sampleId: "nda" }));
    expect(input).toEqual({
      source: { kind: "sample", sampleId: "nda" },
      options: { language: "en", plainLanguage: false },
    });
  });

  it("accepts pasted text with a display name and options", async () => {
    const input = await readAnalyzeInput(
      formRequest({ text: TEXT, name: "lease.pdf", language: "te", plainLanguage: "true" }),
    );
    expect(input.source).toEqual({ kind: "text", name: "lease.pdf", text: TEXT });
    expect(input.options).toEqual({ language: "te", plainLanguage: true });
  });

  it("accepts a file upload", async () => {
    const file = new File([TEXT], "lease.txt", { type: "text/plain" });
    const input = await readAnalyzeInput(formRequest({ file }));
    expect(input.source.kind).toBe("file");
  });

  it("rejects zero or several documents", async () => {
    expect(await codeOf(readAnalyzeInput(formRequest({})))).toBe("INVALID_INPUT");
    expect(await codeOf(readAnalyzeInput(formRequest({ sampleId: "nda", text: TEXT })))).toBe(
      "INVALID_INPUT",
    );
  });

  it("rejects unknown samples, languages and too-short text", async () => {
    expect(await codeOf(readAnalyzeInput(formRequest({ sampleId: "loan" })))).toBe("INVALID_INPUT");
    expect(await codeOf(readAnalyzeInput(formRequest({ sampleId: "nda", language: "fr" })))).toBe(
      "INVALID_INPUT",
    );
    expect(await codeOf(readAnalyzeInput(formRequest({ text: "short" })))).toBe("INVALID_INPUT");
  });

  it("rejects a declared body over the upload limit before reading it", async () => {
    const request = formRequest(
      { sampleId: "nda" },
      { "content-length": String(20 * 1024 * 1024) },
    );
    expect(await codeOf(readAnalyzeInput(request))).toBe("FILE_TOO_LARGE");
  });
});

describe("errorResponse", () => {
  it("returns the code and user-safe message with the mapped status", async () => {
    const response = errorResponse(new AppError("SCANNED_PDF", "Looks scanned."));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: { code: "SCANNED_PDF", message: "Looks scanned." },
    });
  });

  it("never leaks internal error details", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = errorResponse(new Error("GEMINI_API_KEY missing at stack frame 3"));
    const body = JSON.stringify(await response.json());
    expect(response.status).toBe(500);
    expect(body).not.toMatch(/GEMINI|stack/);
    spy.mockRestore();
  });
});

describe("readJsonBody", () => {
  const schema = z.object({ question: z.string().min(3) });

  it("returns validated data", async () => {
    const request = new Request("http://test", { method: "POST", body: '{"question":"What?"}' });
    await expect(readJsonBody(request, schema)).resolves.toEqual({ question: "What?" });
  });

  it("names the invalid field", async () => {
    const request = new Request("http://test", { method: "POST", body: '{"question":"?"}' });
    await expect(readJsonBody(request, schema)).rejects.toThrow(/Invalid question/);
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("http://test", { method: "POST", body: "{nope" });
    await expect(readJsonBody(request, schema)).rejects.toThrow(/valid JSON/);
  });
});

describe("ndjsonResponse", () => {
  it("streams one JSON object per line and closes", async () => {
    const response = ndjsonResponse<{ n: number }>(async (emit) => {
      emit({ n: 1 });
      emit({ n: 2 });
    });
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(await response.text()).toBe('{"n":1}\n{"n":2}\n');
  });

  it("turns a failure into a final user-safe error event", async () => {
    const response = ndjsonResponse(async (emit) => {
      emit({ type: "stage" });
      throw new AppError("AI_UNAVAILABLE", "Try again soon.");
    });
    const lines = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as unknown);
    expect(lines.at(-1)).toEqual({
      type: "error",
      code: "AI_UNAVAILABLE",
      message: "Try again soon.",
    });
  });
});
