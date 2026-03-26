export function formatPercent(rate: number | null | undefined): string {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  return `${m}m ${rem < 10 ? rem.toFixed(1) : Math.round(rem)}s`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function truncateSha(sha: string | null | undefined, len = 7): string {
  if (!sha) return "—";
  return sha.length <= len ? sha : `${sha.slice(0, len)}…`;
}

export function statusPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "passed") return "bg-emerald-500/20 text-emerald-200 ring-emerald-500/30";
  if (s === "failed") return "bg-red-500/20 text-red-200 ring-red-500/30";
  if (s === "partial" || s === "flaky") return "bg-amber-500/20 text-amber-100 ring-amber-500/30";
  return "bg-white/10 text-white/80 ring-white/20";
}
