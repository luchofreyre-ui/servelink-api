import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

/**
 * next.config cannot import the manifest pipeline (path aliases / app graph).
 * Redirects are synced from buildExecutableEncyclopediaRedirects() into JSON:
 *   npm run sync:encyclopedia-redirects
 * (prebuild runs this automatically.)
 */
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
  if (!fs.existsSync(generatedPath)) {
    console.warn(
      `[next.config] Missing ${generatedPath}. Run: npm run sync:encyclopedia-redirects`,
    );
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(generatedPath, "utf8")) as ExecutableRedirect[];
  } catch (e) {
    console.warn("[next.config] Failed to parse executable encyclopedia redirects JSON", e);
    return [];
  }
}

const nextConfig: NextConfig = {
  async redirects() {
    const encyclopediaRedirects = loadExecutableEncyclopediaRedirectsFromGeneratedFile();
    return encyclopediaRedirects.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: r.permanent,
    }));
  },
};

export default nextConfig;
