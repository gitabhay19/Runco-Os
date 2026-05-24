"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

interface AnalyticsData {
  summary: {
    totalDeals: number;
    totalTasks: number;
    overdueFollowUps: number;
    overdueTasks: number;
  };
  stageDistribution: { id: string; name: string; color: string; count: number }[];
  taskByStatus: { TODO: number; IN_PROGRESS: number; BLOCKED: number; DONE: number };
  taskByPriority: { LOW: number; MEDIUM: number; HIGH: number; URGENT: number };
  userBreakdown: {
    id: string;
    name: string;
    role: string;
    avatarColor: string | null;
    deals: number;
    openTasks: number;
    doneTasks: number;
  }[];
  timeline: { date: string; dealsCreated: number; tasksDone: number }[];
}

const STATUS_COLORS = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#0ea5e9",
  BLOCKED: "#f59e0b",
  DONE: "#10b981",
};

const PRIORITY_COLORS = {
  LOW: "#64748b",
  MEDIUM: "#0ea5e9",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
};

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        <Activity className="mr-2 h-4 w-4 animate-pulse" />
        Loading analytics…
      </div>
    );
  }

  const maxStage = Math.max(1, ...data.stageDistribution.map((s) => s.count));
  const maxTimeline = Math.max(
    1,
    ...data.timeline.map((d) => Math.max(d.dealsCreated, d.tasksDone))
  );

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(var(--brand)/0.06)] to-transparent"
        aria-hidden
      />

      <div className="scrollbar-thin relative h-full overflow-y-auto px-6 py-6 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryTile
              icon={BarChart3}
              label="Total deals"
              value={data.summary.totalDeals}
              color="#0ea5e9"
            />
            <SummaryTile
              icon={ListChecks}
              label="Total tasks"
              value={data.summary.totalTasks}
              color="#6366f1"
            />
            <SummaryTile
              icon={AlertTriangle}
              label="Overdue follow-ups"
              value={data.summary.overdueFollowUps}
              color="#ef4444"
            />
            <SummaryTile
              icon={CheckCircle2}
              label="Tasks done"
              value={data.taskByStatus.DONE}
              color="#10b981"
            />
          </div>

          {/* Stage distribution */}
          <Section title="Pipeline stage distribution" icon={BarChart3}>
            <div className="space-y-3">
              {data.stageDistribution.map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}80` }}
                      />
                      <span className="font-medium text-foreground">{s.name}</span>
                    </div>
                    <span className="font-mono text-foreground">{s.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas/60">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(s.count / maxStage) * 100}%`,
                        backgroundColor: s.color,
                        boxShadow: `0 0 12px ${s.color}80`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Task status */}
            <Section title="Task status breakdown" icon={ListChecks}>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(data.taskByStatus) as Array<keyof typeof data.taskByStatus>).map(
                  (k) => (
                    <StatusTile
                      key={k}
                      label={k.replace("_", " ")}
                      value={data.taskByStatus[k]}
                      color={STATUS_COLORS[k]}
                    />
                  )
                )}
              </div>
            </Section>

            {/* Task priority */}
            <Section title="Task priority spread" icon={TrendingUp}>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(data.taskByPriority) as Array<keyof typeof data.taskByPriority>).map(
                  (k) => (
                    <StatusTile
                      key={k}
                      label={k}
                      value={data.taskByPriority[k]}
                      color={PRIORITY_COLORS[k]}
                    />
                  )
                )}
              </div>
            </Section>
          </div>

          {/* Timeline */}
          <Section title="Last 14 days" icon={TrendingUp}>
            <div className="flex h-[180px] items-end gap-1">
              {data.timeline.map((d) => {
                const dHeight = (d.dealsCreated / maxTimeline) * 100;
                const tHeight = (d.tasksDone / maxTimeline) * 100;
                return (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 items-end gap-0.5"
                    title={`${d.date} · deals: ${d.dealsCreated} · done: ${d.tasksDone}`}
                  >
                    <div
                      className="w-full rounded-t bg-[hsl(var(--brand))] opacity-80 transition-all group-hover:opacity-100"
                      style={{ height: `${Math.max(dHeight, 4)}%` }}
                    />
                    <div
                      className="w-full rounded-t bg-emerald-500/80 transition-all group-hover:opacity-100"
                      style={{ height: `${Math.max(tHeight, 4)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-[hsl(var(--brand))]" />
                Deals created
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                Tasks done
              </span>
            </div>
          </Section>

          {/* Per-user breakdown */}
          {data.userBreakdown.length > 0 && (
            <Section title="By user" icon={Activity}>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-canvas/40 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-right">Deals</th>
                      <th className="px-4 py-3 text-right">Open tasks</th>
                      <th className="px-4 py-3 text-right">Done tasks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.userBreakdown.map((u) => (
                      <tr key={u.id} className="hover:bg-accent/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-semibold text-white"
                              style={{
                                background: `linear-gradient(135deg, ${u.avatarColor ?? "#0ea5e9"}, ${
                                  u.avatarColor ?? "#0ea5e9"
                                }cc)`,
                              }}
                            >
                              {getInitials(u.name)}
                            </span>
                            <div>
                              <div className="font-medium text-foreground">{u.name}</div>
                              <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                                {u.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">
                          {u.deals}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">
                          {u.openTasks}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">
                          {u.doneTasks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg border"
          style={{
            borderColor: `${color}40`,
            backgroundColor: `${color}14`,
            color,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="font-display text-[24px] font-bold leading-none tracking-[-0.02em] text-foreground">
            {value}
          </div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTile({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border bg-canvas/30 px-3 py-2.5"
      )}
      style={{ borderColor: `${color}30` }}
    >
      <span
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
        style={{ color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-display text-[16px] font-bold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}
