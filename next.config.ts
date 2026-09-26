import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["mammoth"],
  outputFileTracingIncludes: {
    "/api/**": ["./src/data/samples/**", "./src/data/baselines/**", "./src/data/fixtures/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default nextConfig;
