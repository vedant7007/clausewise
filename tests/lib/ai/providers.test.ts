import { GroqProvider } from "@/lib/ai/groq-provider";
import { kindFromStatus, ProviderError, toProviderError } from "@/lib/ai/provider";

vi.mock("server-only", () => ({}));

const request = (signal = new AbortController().signal) => ({
  system: "sys",
  prompt: "doc",
  jsonSchema: { type: "object" },
  signal,
});

function fakeFetch(status: number, body: unknown) {
  return vi.fn(
    async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status }),
  );
}

describe("kindFromStatus", () => {
  it("classifies HTTP failures", () => {
    expect(kindFromStatus(401)).toBe("auth");
    expect(kindFromStatus(403)).toBe("auth");
    expect(kindFromStatus(429, "Too many requests")).toBe("rate_limit");
    expect(kindFromStatus(429, "You exceeded your current quota, retry in 12s")).toBe("rate_limit");
    expect(kindFromStatus(429, "Quota exceeded: requests per day")).toBe("quota");
    expect(kindFromStatus(503)).toBe("server");
    expect(kindFromStatus(400)).toBe("bad_request");
  });
});

describe("toProviderError", () => {
  it("treats an aborted call as a timeout", () => {
    const controller = new AbortController();
    controller.abort();
    expect(toProviderError(new Error("x"), controller.signal).kind).toBe("timeout");
  });

  it("reads a status from SDK errors", () => {
    const error = Object.assign(new Error("daily quota exceeded"), { status: 429 });
    expect(toProviderError(error, new AbortController().signal).kind).toBe("quota");
  });

  it("treats unknown failures as network errors", () => {
    expect(toProviderError(new TypeError("fetch failed"), new AbortController().signal).kind).toBe(
      "network",
    );
  });
});

describe("GroqProvider", () => {
  it("returns message content and sends the schema in JSON mode", async () => {
    const fetchImpl = fakeFetch(200, { choices: [{ message: { content: '{"ok":true}' } }] });
    const provider = new GroqProvider("key", "test-model", fetchImpl);
    await expect(provider.generateJson(request())).resolves.toBe('{"ok":true}');
    const init = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init[1].body)) as {
      response_format: unknown;
      model: string;
      messages: { content: string }[];
    };
    expect(body.model).toBe("test-model");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0]!.content).toContain('{"type":"object"}');
  });

  it("maps HTTP errors to classified ProviderErrors", async () => {
    const provider = new GroqProvider("key", undefined, fakeFetch(401, "invalid api key"));
    const error = await provider.generateJson(request()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect((error as ProviderError).kind).toBe("auth");
  });

  it("rejects an empty completion", async () => {
    const provider = new GroqProvider("key", undefined, fakeFetch(200, { choices: [] }));
    await expect(provider.generateJson(request())).rejects.toMatchObject({ kind: "server" });
  });
});

describe("providersFromEnv", () => {
  it("orders Gemini first and Groq as fallback, using whichever keys exist", async () => {
    const { providersFromEnv } = await import("@/lib/ai");
    expect(providersFromEnv({ GROQ_API_KEY: "g" }).map((p) => p.model)).toEqual([
      "llama-3.3-70b-versatile",
    ]);
    expect(
      providersFromEnv({ GEMINI_API_KEY: "a", GROQ_API_KEY: "b" }).map((p) => p.model),
    ).toEqual(["gemini-2.5-flash", "llama-3.3-70b-versatile"]);
    expect(providersFromEnv({})).toEqual([]);
  });

  it("adds Gemini fallback models in order, without duplicates", async () => {
    const { providersFromEnv } = await import("@/lib/ai");
    const env = {
      GEMINI_API_KEY: "a",
      GEMINI_MODEL: "m1",
      GEMINI_FALLBACK_MODELS: " m2, m1 ,,m3 ",
    };
    expect(providersFromEnv(env).map((p) => p.model)).toEqual(["m1", "m2", "m3"]);
  });
});
