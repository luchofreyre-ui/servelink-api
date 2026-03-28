"use client";

import type { SystemTestArtifactRef } from "@/types/systemTests";

function hrefForPath(path: string): string | undefined {
  const t = path.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return undefined;
}

type Props = {
  refs: SystemTestArtifactRef[];
  /** If true, show every ref; otherwise primary + up to `compactLimit` others. */
  expanded?: boolean;
  compactLimit?: number;
  className?: string;
};

const TYPE_LABEL: Record<SystemTestArtifactRef["type"], string> = {
  trace: "Trace",
  screenshot: "Screenshot",
  video: "Video",
  stdout_log: "Stdout",
  stderr_log: "Stderr",
  attachment: "Attachment",
  html_report_ref: "HTML report",
};

export function SystemTestsArtifactLinks(props: Props) {
  const { refs, expanded = false, compactLimit = 4, className = "" } = props;
  if (!refs.length) return null;

  const primary = refs.find((r) => r.isPrimary);
  const rest = refs.filter((r) => !r.isPrimary);
  const shown =
    expanded ?
      refs
    : [
        ...(primary ? [primary] : []),
        ...rest.slice(0, primary ? Math.max(0, compactLimit - 1) : compactLimit),
      ];

  if (!shown.length) return null;

  return (
    <ul className={`mt-2 space-y-1 text-xs ${className}`}>
      {shown.map((r) => {
        const href = hrefForPath(r.path);
        const label = TYPE_LABEL[r.type] ?? r.type;
        return (
          <li key={`${r.type}-${r.path}`} className="flex flex-wrap items-baseline gap-x-2 text-white/70">
            <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-white/55">
              {label}
            </span>
            {href ?
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 break-all font-mono text-sky-300/90 underline decoration-sky-500/40 hover:text-sky-200"
              >
                {r.displayName || r.path}
              </a>
            : <span className="min-w-0 break-all font-mono text-white/80">{r.displayName || r.path}</span>}
            {r.sizeBytes != null && r.sizeBytes > 0 ?
              <span className="text-white/40">({r.sizeBytes} B)</span>
            : null}
          </li>
        );
      })}
    </ul>
  );
}
