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
  "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://m.media-amazon.com https://images-na.ssl-images-amazon.com; font-src 'self' data:; connect-src 'self' http://localhost:3001 http://127.0.0.1:3001; frame-ancestors 'none';";

const nextConfig: NextConfig = {
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
