"use client";

import type { ReactNode } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SystemTestsTrendPoint } from "@/types/systemTests";
import { formatDurationMs } from "./systemTestsFormatting";

function shortWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type ChartCardProps = {
  title: string;
  empty: boolean;
  children: ReactNode;
};

function ChartCard(props: ChartCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/50">{props.title}</p>
      {props.empty ? (
        <p className="mt-8 text-center text-sm text-white/45">Need at least 2 runs for a trend.</p>
      ) : (
        <div className="mt-3 h-[200px] w-full">{props.children}</div>
      )}
    </div>
  );
}

type Props = {
  points: SystemTestsTrendPoint[];
};

export function SystemTestsTrendCharts(props: Props) {
  const { points } = props;
  const chartData = points.map((p) => ({
    ...p,
    label: shortWhen(p.createdAt),
    passRatePct: p.passRate * 100,
  }));

  const empty = points.length < 2;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Pass rate" empty={empty}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              width={36}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, "Pass rate"]}
            />
            <Line type="monotone" dataKey="passRatePct" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Failures" empty={empty}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={28} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              formatter={(v: number) => [v, "Failed"]}
            />
            <Line type="monotone" dataKey="failedCount" stroke="#f87171" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Flaky" empty={empty}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={28} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              formatter={(v: number) => [v, "Flaky"]}
            />
            <Line type="monotone" dataKey="flakyCount" stroke="#fbbf24" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Duration" empty={empty}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              width={44}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}`)}
            />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              formatter={(v: unknown) => {
                const ms =
                  typeof v === "number"
                    ? v
                    : typeof v === "string" && v.trim() !== ""
                      ? Number(v)
                      : null;
                return [formatDurationMs(ms != null && Number.isFinite(ms) ? ms : null), "Duration"];
              }}
            />
            <Line type="monotone" dataKey="durationMs" stroke="#38bdf8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
