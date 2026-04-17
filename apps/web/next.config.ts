import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

/** Allow browser `fetch` to the configured API origin (preview/staging APIs not in the static CSP list). */
function apiOriginForConnectSrc(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) return null;
  try {
    const withScheme = raw.startsWith("http") ? raw : `https://${raw}`;
    const u = new URL(withScheme.replace(/\/+$/, ""));
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

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

const CONNECT_SRC_PARTS = [
  "'self'",
  "https://servelink-api-production.up.railway.app",
  "https://www.nustandardcleaning.com",
  "https://nustandardcleaning.com",
  "https://servelink-web.vercel.app",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  ...(apiOriginForConnectSrc() ? [apiOriginForConnectSrc() as string] : []),
];

const CONTENT_SECURITY_POLICY =
  `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://m.media-amazon.com https://images-na.ssl-images-amazon.com; font-src 'self' data:; connect-src ${CONNECT_SRC_PARTS.join(" ")}; frame-ancestors 'none';`;

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
