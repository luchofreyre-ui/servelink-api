import type { NextConfig } from "next";

const CONTENT_SECURITY_POLICY = `
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://m.media-amazon.com https://images-na.ssl-images-amazon.com;
font-src 'self' data:;
connect-src 'self'
  https://servelink-api-production.up.railway.app
  https://www.nustandardcleaning.com
  https://nustandardcleaning.com
  https://servelink-web.vercel.app
  http://localhost:3001
  http://127.0.0.1:3001;
frame-ancestors 'none';
`.replace(/\n/g, " ");

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
};

export default nextConfig;
