/**
 * Writes Next-ready encyclopedia redirects to generated JSON for next.config.
 * The list is produced by buildExecutableEncyclopediaRedirects() (manifest-derived).
 *
 * Run: npm run sync:encyclopedia-redirects
 * (Also runs automatically via prebuild.)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildExecutableEncyclopediaRedirects } from "../../src/lib/encyclopedia/redirectExecution";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(__dirname, "../../src/lib/encyclopedia/generated");
const outExecutable = path.join(generatedDir, "executableEncyclopediaRedirects.json");
const outLive = path.join(generatedDir, "liveEncyclopediaRedirects.json");

const redirects = buildExecutableEncyclopediaRedirects();
fs.mkdirSync(generatedDir, { recursive: true });
const body = `${JSON.stringify(redirects, null, 2)}\n`;
fs.writeFileSync(outExecutable, body, "utf8");
fs.writeFileSync(outLive, body, "utf8");
console.log(`Wrote ${redirects.length} encyclopedia redirects to ${outExecutable}`);
console.log(`Wrote live rollout mirror to ${outLive}`);
