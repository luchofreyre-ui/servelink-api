import { loadCanonicalSnapshotsForApiIntake } from "../../src/lib/encyclopedia/reviewIntakeBridge";

function getArg(name: string) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function getPositionalSource(): string | null {
  const arg = process.argv[2];
  if (!arg || arg.startsWith("--")) return null;
  return arg;
}

async function run() {
  const source = getArg("source") || getPositionalSource();
  const apiBase =
    getArg("api-base") ||
    process.env.API_BASE_URL ||
    "http://localhost:3001/api/v1";

  if (!source) {
    throw new Error("Missing required --source=...");
  }

  const snapshots = loadCanonicalSnapshotsForApiIntake(source);

  const token =
    getArg("token")?.trim() || process.env.SERVELINK_ACCESS_TOKEN?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const records = snapshots;

  const response = await fetch(
    `${apiBase.replace(/\/$/, "")}/admin/encyclopedia/review/intake-generated`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ records }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `API intake failed: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();

  console.log("GENERATION INTAKE RESULT");
  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
