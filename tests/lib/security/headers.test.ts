import { buildContentSecurityPolicy, securityHeaders } from "@/lib/security/headers";

describe("securityHeaders", () => {
  const byKey = Object.fromEntries(securityHeaders(false).map(({ key, value }) => [key, value]));

  it("sets the required hardening headers", () => {
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  });

  it("forbids framing and plugins in the CSP", () => {
    const csp = byKey["Content-Security-Policy"];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self'");
  });

  it("only allows eval in development", () => {
    expect(buildContentSecurityPolicy(false)).not.toContain("unsafe-eval");
    expect(buildContentSecurityPolicy(true)).toContain("unsafe-eval");
  });
});
