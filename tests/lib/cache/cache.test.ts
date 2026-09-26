import { analysisCacheKey } from "@/lib/cache/analysis-cache";
import { TtlLruCache } from "@/lib/cache/ttl-lru-cache";

describe("TtlLruCache", () => {
  let now = 0;
  const cache = () => new TtlLruCache<string>(2, 1_000, () => now);

  beforeEach(() => {
    now = 0;
  });

  it("returns a stored value on a hit", () => {
    const c = cache();
    c.set("a", "A");
    expect(c.get("a")).toBe("A");
  });

  it("returns undefined on a miss", () => {
    expect(cache().get("missing")).toBeUndefined();
  });

  it("evicts the least recently used entry when full", () => {
    const c = cache();
    c.set("a", "A");
    c.set("b", "B");
    c.get("a");
    c.set("c", "C");
    expect(c.get("b")).toBeUndefined();
    expect(c.get("a")).toBe("A");
    expect(c.get("c")).toBe("C");
    expect(c.size).toBe(2);
  });

  it("expires entries after the TTL", () => {
    const c = cache();
    c.set("a", "A");
    now = 999;
    expect(c.get("a")).toBe("A");
    now = 2_000;
    expect(c.get("a")).toBeUndefined();
    expect(c.size).toBe(0);
  });

  it("refreshes the TTL when a key is set again", () => {
    const c = cache();
    c.set("a", "A");
    now = 800;
    c.set("a", "A2");
    now = 1_500;
    expect(c.get("a")).toBe("A2");
  });
});

describe("analysisCacheKey", () => {
  const options = { language: "en", plainLanguage: false } as const;

  it("is a stable SHA-256 hex digest that never contains the text", () => {
    const key = analysisCacheKey("Rent is [NUMBER_1]", options);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(analysisCacheKey("Rent is [NUMBER_1]", options)).toBe(key);
  });

  it("differs by text, language and reading level", () => {
    const base = analysisCacheKey("text", options);
    expect(analysisCacheKey("text2", options)).not.toBe(base);
    expect(analysisCacheKey("text", { ...options, language: "te" })).not.toBe(base);
    expect(analysisCacheKey("text", { ...options, plainLanguage: true })).not.toBe(base);
  });
});
