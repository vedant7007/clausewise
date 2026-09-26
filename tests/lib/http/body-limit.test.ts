import { AppError } from "@/lib/errors";
import { readBodyLimited, readFormLimited } from "@/lib/http/body-limit";
import { readJsonBody } from "@/lib/http/responses";
import { z } from "zod";

function streamOf(chunks: number[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const size of chunks) controller.enqueue(new Uint8Array(size));
      controller.close();
    },
  });
}

const post = (body: BodyInit, headers: Record<string, string> = {}) =>
  new Request("http://test/api", { method: "POST", body, headers, duplex: "half" } as RequestInit);

async function codeOf(promise: Promise<unknown>): Promise<string> {
  return promise.then(
    () => "none",
    (error: unknown) => (error instanceof AppError ? `${error.code}:${error.status}` : "other"),
  );
}

describe("readBodyLimited", () => {
  it("returns a body within the limit", async () => {
    const body = await readBodyLimited(post("hello"), 10);
    expect(new TextDecoder().decode(body)).toBe("hello");
  });

  it("rejects a declared Content-Length over the limit with 413 before reading", async () => {
    const request = post("x", { "content-length": "5000" });
    expect(await codeOf(readBodyLimited(request, 100))).toBe("PAYLOAD_TOO_LARGE:413");
  });

  it("cuts off a streamed body without Content-Length once it crosses the limit", async () => {
    expect(await codeOf(readBodyLimited(post(streamOf([60, 60, 60])), 100))).toBe(
      "PAYLOAD_TOO_LARGE:413",
    );
  });
});

describe("limits on parsed bodies", () => {
  it("rejects an oversized JSON body with 413", async () => {
    const huge = JSON.stringify({ text: "a".repeat(1_600_000) });
    expect(await codeOf(readJsonBody(post(huge), z.object({ text: z.string() })))).toBe(
      "PAYLOAD_TOO_LARGE:413",
    );
  });

  it("parses a multipart form within the limit", async () => {
    const form = new FormData();
    form.append("sampleId", "nda");
    const request = new Request("http://test/api", { method: "POST", body: form });
    expect((await readFormLimited(request, 10_000)).get("sampleId")).toBe("nda");
  });

  it("rejects a malformed form body", async () => {
    const request = post("not a form", { "content-type": "multipart/form-data; boundary=x" });
    expect(await codeOf(readFormLimited(request, 10_000))).toBe("INVALID_INPUT:400");
  });
});
