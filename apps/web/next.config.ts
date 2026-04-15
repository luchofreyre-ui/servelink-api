import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

type ExecutableRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

function loadExecutableEncyclopediaRedirectsFromGeneratedFile(): ExecutableRedirect[] {
  const generatedPath = path.join(
    process.cwd(),
    "src/lib/encyclopedia/generated/executableEncyclopediaRedirects.json",
  );

  if (!fs.existsSync(generatedPath)) return [];

  return JSON.parse(fs.readFileSync(generatedPath, "utf8")) as ExecutableRedirect[];
}

const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://m.media-amazon.com https://images-na.ssl-images-amazon.com; font-src 'self' data:; connect-src 'self' https://servelink-api-production.up.railway.app https://www.nustandardcleaning.com https://nustandardcleaning.com https://servelink-web.vercel.app http://localhost:3001 http://127.0.0.1:3001; frame-ancestors 'none';";

/** Monorepo root (parent of `apps/web`) — stabilizes output file tracing when multiple lockfiles exist. */
const monorepoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
    ],
  },

  async redirects() {
    const redirects = loadExecutableEncyclopediaRedirectsFromGeneratedFile();

    return redirects.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: r.permanent,
    }));
  },
};

export default nextConfig;
