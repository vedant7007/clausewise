import { z } from "zod";
import { AIManager } from "@/lib/ai/ai-manager";
import { toJsonSchema } from "@/lib/ai/structured-output";
import { type AIProvider, type GenerateRequest, ProviderError } from "@/lib/ai/provider";
import { AppError } from "@/lib/errors";

const Schema = z.object({ answer: z.string(), score: z.number() });
const task = { system: "sys", prompt: "prompt", schema: Schema };
const VALID = JSON.stringify({ answer: "yes", score: 1 });

type Step = string | ProviderError | "hang";

function scriptedProvider(id: string, steps: Step[]) {
  const calls: GenerateRequest[] = [];
  const provider: AIProvider = {
    id,
    model: `${id}-model`,
    async ping() {},
    async generateJson(request) {
      calls.push(request);
      const step = steps.shift() ?? new ProviderError("server", "exhausted");
      if (step === "hang") {
        return new Promise((_, reject) =>
          request.signal.addEventListener("abort", () => reject(new Error("aborted"))),
        );
      }
      if (step instanceof ProviderError) throw step;
      return step;
    },
  };
  return { provider, calls };
}

const fast = { sleep: async () => {}, random: () => 0 };

describe("AIManager", () => {
  it("returns validated output on first success", async () => {
    const { provider } = scriptedProvider("p", [VALID]);
    await expect(new AIManager([provider], fast).generate(task)).resolves.toEqual({
      answer: "yes",
      score: 1,
    });
  });

  it("accepts JSON wrapped in a markdown code fence", async () => {
    const { provider } = scriptedProvider("p", ["```json\n" + VALID + "\n```"]);
    await expect(new AIManager([provider], fast).generate(task)).resolves.toMatchObject({
      answer: "yes",
    });
  });

  it("retries transient failures with exponential backoff", async () => {
    const sleeps: number[] = [];
    const { provider, calls } = scriptedProvider("p", [
      new ProviderError("server", "500"),
      new ProviderError("rate_limit", "429"),
      VALID,
    ]);
    const manager = new AIManager([provider], {
      sleep: async (ms) => void sleeps.push(ms),
      random: () => 0,
    });
    await manager.generate(task);
    expect(calls).toHaveLength(3);
    expect(sleeps).toEqual([400, 800]);
  });

  it("stops retrying after the maximum and falls back to the next provider", async () => {
    const failing = scriptedProvider("a", [
      new ProviderError("server", "1"),
      new ProviderError("server", "2"),
      new ProviderError("server", "3"),
    ]);
    const backup = scriptedProvider("b", [VALID]);
    await expect(
      new AIManager([failing.provider, backup.provider], fast).generate(task),
    ).resolves.toBeDefined();
    expect(failing.calls).toHaveLength(3);
    expect(backup.calls).toHaveLength(1);
  });

  it("does not retry a spent quota; it falls back immediately", async () => {
    const primary = scriptedProvider("a", [new ProviderError("quota", "quota")]);
    const backup = scriptedProvider("b", [VALID]);
    await new AIManager([primary.provider, backup.provider], fast).generate(task);
    expect(primary.calls).toHaveLength(1);
  });

  it("throws a user-safe AI_UNAVAILABLE when every provider fails", async () => {
    const { provider } = scriptedProvider("gemini", [new ProviderError("auth", "bad key")]);
    const error = await new AIManager([provider], fast).generate(task).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("AI_UNAVAILABLE");
    expect((error as AppError).message).not.toMatch(/gemini|key/i);
  });

  it("repairs invalid output once, feeding back the validation error", async () => {
    const { provider, calls } = scriptedProvider("p", [JSON.stringify({ answer: "yes" }), VALID]);
    await expect(new AIManager([provider], fast).generate(task)).resolves.toMatchObject({
      score: 1,
    });
    expect(calls[1]!.prompt).toContain("score");
    expect(calls[1]!.prompt).toContain("did not match the required JSON schema");
  });

  it("gives up with AI_INVALID_OUTPUT after one failed repair", async () => {
    const { provider, calls } = scriptedProvider("p", ["not json", "{}"]);
    const error = await new AIManager([provider], fast).generate(task).catch((e: unknown) => e);
    expect((error as AppError).code).toBe("AI_INVALID_OUTPUT");
    expect(calls).toHaveLength(2);
  });

  it("aborts a hanging call at the timeout and classifies it as a timeout", async () => {
    const { provider, calls } = scriptedProvider("p", ["hang", VALID]);
    const manager = new AIManager([provider], { ...fast, timeoutMs: 10 });
    await expect(manager.generate(task)).resolves.toMatchObject({ answer: "yes" });
    expect(calls[0]!.signal.aborted).toBe(true);
  });

  it("keeps a slow call alive while it keeps streaming, up to the hard cap", async () => {
    const streaming: AIProvider = {
      id: "s",
      model: "s-model",
      async ping() {},
      async generateJson({ onActivity }) {
        for (let i = 0; i < 5; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 8));
          onActivity?.();
        }
        return VALID;
      },
    };
    const manager = new AIManager([streaming], { ...fast, timeoutMs: 20, maxCallMs: 1_000 });
    await expect(manager.generate(task)).resolves.toMatchObject({ answer: "yes" });
  });

  it("aborts a streaming call that exceeds the hard cap", async () => {
    const { provider, calls } = scriptedProvider("p", ["hang", VALID]);
    const chatty: AIProvider = {
      ...provider,
      async generateJson(request) {
        const timer = setInterval(() => request.onActivity?.(), 5);
        try {
          return await provider.generateJson(request);
        } finally {
          clearInterval(timer);
        }
      },
    };
    const manager = new AIManager([chatty], { ...fast, timeoutMs: 20, maxCallMs: 60 });
    await expect(manager.generate(task)).resolves.toMatchObject({ answer: "yes" });
    expect(calls[0]!.signal.aborted).toBe(true);
  });

  it("refuses to start without providers", () => {
    expect(() => new AIManager([])).toThrow(AppError);
  });

  it("exposes model names for the health check", () => {
    const { provider } = scriptedProvider("p", []);
    expect(new AIManager([provider]).models).toEqual(["p-model"]);
  });
});

describe("toJsonSchema", () => {
  it("produces an object schema without the $schema key", () => {
    const schema = toJsonSchema(Schema);
    expect(schema).not.toHaveProperty("$schema");
    expect(schema).toMatchObject({ type: "object", required: ["answer", "score"] });
  });
});

describe("validateOutput", () => {
  it("ignores a reasoning model's thinking block before the JSON", async () => {
    const { validateOutput } = await import("@/lib/ai/structured-output");
    const raw = `<think>The user wants JSON.</think>\n${VALID}`;
    expect(validateOutput(Schema, raw)).toEqual({
      success: true,
      data: { answer: "yes", score: 1 },
    });
  });
});
