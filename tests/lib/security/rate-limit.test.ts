import { clientKey, SlidingWindowRateLimiter } from "@/lib/security/rate-limit";

describe("SlidingWindowRateLimiter", () => {
  let now = 0;
  const limiter = () => new SlidingWindowRateLimiter(3, 60_000, () => now);

  beforeEach(() => {
    now = 1_000_000;
  });

  it("allows requests under the limit and counts down", () => {
    const rl = limiter();
    expect(rl.check("ip").remaining).toBe(2);
    expect(rl.check("ip").remaining).toBe(1);
    expect(rl.check("ip")).toMatchObject({ allowed: true, remaining: 0 });
  });

  it("blocks over the limit with a Retry-After", () => {
    const rl = limiter();
    for (let i = 0; i < 3; i += 1) rl.check("ip");
    now += 20_000;
    expect(rl.check("ip")).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 40 });
  });

  it("allows again once the window slides past old requests", () => {
    const rl = limiter();
    for (let i = 0; i < 3; i += 1) rl.check("ip");
    now += 60_001;
    expect(rl.check("ip").allowed).toBe(true);
  });

  it("tracks clients independently", () => {
    const rl = limiter();
    for (let i = 0; i < 3; i += 1) rl.check("a");
    expect(rl.check("b").allowed).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.1" }))).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip, then a shared bucket", () => {
    expect(clientKey(new Headers({ "x-real-ip": "2.2.2.2" }))).toBe("2.2.2.2");
    expect(clientKey(new Headers())).toBe("anonymous");
  });
});
