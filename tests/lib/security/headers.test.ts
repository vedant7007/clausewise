import { buildContentSecurityPolicy, createNonce, securityHeaders } from "@/lib/security/headers";

describe("securityHeaders", () => {
  const byKey = Object.fromEntries(securityHeaders().map(({ key, value }) => [key, value]));

  it("sets the required hardening headers", () => {
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  });
});

describe("buildContentSecurityPolicy", () => {
  const csp = buildContentSecurityPolicy("abc123", false);
  const directive = (name: string) =>
    csp.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";

  it("forbids framing and plugins", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self'");
  });

  it("allows scripts only by nonce in production, with no unsafe-inline or unsafe-eval", () => {
    expect(directive("script-src")).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(directive("style-src")).toBe("style-src 'self' 'nonce-abc123'");
  });

  it("only allows eval in development", () => {
    expect(buildContentSecurityPolicy("n", false)).not.toContain("unsafe-eval");
    expect(buildContentSecurityPolicy("n", true)).toContain("unsafe-eval");
  });
});

describe("createNonce", () => {
  it("returns a fresh 128-bit base64 value each time", () => {
    const first = createNonce();
    expect(Buffer.from(first, "base64")).toHaveLength(16);
    expect(createNonce()).not.toBe(first);
  });
});
