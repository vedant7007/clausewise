import { ClientError, errorFromResponse, postForNdjson, postJson } from "@/lib/client/api-client";
import { fileStem } from "@/lib/client/download";
import { pluralize } from "@/lib/utils/format";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("errorFromResponse", () => {
  it("uses the server's user-safe message", async () => {
    const response = Response.json(
      { error: { code: "RATE_LIMITED", message: "Wait 30 seconds." } },
      { status: 429 },
    );
    expect(await errorFromResponse(response)).toMatchObject({
      code: "RATE_LIMITED",
      message: "Wait 30 seconds.",
    });
  });

  it("explains a platform 413 without a JSON body", async () => {
    const error = await errorFromResponse(
      new Response("Request Entity Too Large", { status: 413 }),
    );
    expect(error.code).toBe("FILE_TOO_LARGE");
  });

  it("falls back to a generic message for non-JSON errors", async () => {
    const error = await errorFromResponse(new Response("<html>", { status: 502 }));
    expect(error.message).toMatch(/could not reach/);
  });
});

describe("postJson", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ok: true })),
    );
    await expect(postJson("/api/x", {})).resolves.toEqual({ ok: true });
  });

  it("throws a ClientError on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("offline"))),
    );
    await expect(postJson("/api/x", {})).rejects.toBeInstanceOf(ClientError);
  });
});

describe("postForNdjson", () => {
  it("parses events split across chunk boundaries", async () => {
    const chunks = ['{"type":"stage","st', 'age":"parsing"}\n{"type":"res', 'ult"}'];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(body)),
    );
    const events: unknown[] = [];
    await postForNdjson("/api/analyze", new FormData(), (event) => events.push(event));
    expect(events).toEqual([{ type: "stage", stage: "parsing" }, { type: "result" }]);
  });

  it("throws the server error for a failed request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: { code: "INVALID_INPUT", message: "Bad file." } }, { status: 400 }),
      ),
    );
    await expect(postForNdjson("/api/analyze", new FormData(), () => {})).rejects.toThrow(
      "Bad file.",
    );
  });
});

describe("small formatters", () => {
  it("builds safe file stems", () => {
    expect(fileStem("Leave & Licence Agreement (2026)!")).toBe("leave-licence-agreement-2026");
    expect(fileStem("!!!")).toBe("clausewise");
  });

  it("pluralises counts", () => {
    expect(pluralize(1, "claim")).toBe("1 claim");
    expect(pluralize(3, "claim")).toBe("3 claims");
    expect(pluralize(2, "party", "parties")).toBe("2 parties");
  });
});
