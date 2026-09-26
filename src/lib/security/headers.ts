/** A single HTTP response header, in the shape next.config `headers()` expects. */
export interface HeaderEntry {
  key: string;
  value: string;
}

/**
 * Builds the Content-Security-Policy. Next.js injects inline bootstrap scripts, so
 * `'unsafe-inline'` is required for scripts without a nonce; development also needs
 * `'unsafe-eval'` for fast refresh. Everything else is locked to the same origin.
 * @param isDevelopment - whether the dev server is running.
 */
export function buildContentSecurityPolicy(isDevelopment: boolean): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDevelopment) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/**
 * Security headers applied to every route.
 * @param isDevelopment - relaxes the CSP for the dev server only.
 */
export function securityHeaders(isDevelopment: boolean): HeaderEntry[] {
  return [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(isDevelopment) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  ];
}
