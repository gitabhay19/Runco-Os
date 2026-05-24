"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Building2,
  CheckSquare,
  UserCog,
  StickyNote,
  Tag,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

interface LogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarColor: string | null;
    role: string;
  };
}

const ACTION_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  stage_changed: Tag,
  stage_note_added: StickyNote,
  stage_note_updated: StickyNote,
  user_created: UserCog,
  user_updated: UserCog,
  user_deleted: UserCog,
  user_password_reset: UserCog,
  profile_updated: UserCog,
};

const ENTITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  deal: Building2,
  task: CheckSquare,
  user: UserCog,
};

export function ActivityTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (entityType !== "all") params.set("entityType", entityType);
    params.set("limit", "100");
    fetch(`/api/admin/activity?${params}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .finally(() => setLoading(false));
  }, [entityType]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {(["all", "deal", "task", "user"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setEntityType(t)}
            className={cn(
              "h-8 rounded-md border px-3 text-xs font-medium transition-colors",
              entityType === t
                ? "border-[hsl(var(--brand)/0.4)] bg-[hsl(var(--brand)/0.1)] text-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "all" ? "All activity" : `${t.charAt(0).toUpperCase()}${t.slice(1)}s`}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground">
            <Activity className="mr-2 h-4 w-4 animate-pulse" />
            Loading activity…
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            No activity yet.
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {logs.map((log) => {
              const ActionIcon = ACTION_ICON[log.action] ?? Activity;
              const EntityIcon = ENTITY_ICON[log.entityType] ?? Activity;
              return (
                <li key={log.id} className="flex items-start gap-4 px-5 py-3.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${log.user.avatarColor ?? "#0ea5e9"}, ${log.user.avatarColor ?? "#0ea5e9"}cc)`,
                    }}
                  >
                    {getInitials(log.user.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold text-foreground">{log.user.name}</span>
                      <span className="text-muted-foreground">{humanAction(log.action)}</span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-canvas/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <EntityIcon className="h-2.5 w-2.5" />
                        {log.entityType}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <ActionIcon className="h-3 w-3" />
                      <span>{formatMeta(log.metadata)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatShortDate(log.createdAt)}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function humanAction(action: string): string {
  const map: Record<string, string> = {
    created: "created a",
    updated: "updated a",
    deleted: "deleted a",
    stage_changed: "moved a",
    stage_note_added: "added a note on a",
    stage_note_updated: "updated a note on a",
    user_created: "created",
    user_updated: "updated",
    user_deleted: "removed",
    user_password_reset: "reset password for",
    profile_updated: "updated their profile",
  };
  return map[action] ?? action.replace(/_/g, " ");
}

function formatMeta(metadata: string | null): string {
  if (!metadata) return "—";
  try {
    const obj = JSON.parse(metadata) as Record<string, unknown>;
    if ("companyName" in obj) return String(obj.companyName);
    if ("title" in obj) return String(obj.title);
    if ("email" in obj) return String(obj.email);
    if ("stageId" in obj) return "Stage updated";
    if ("keys" in obj && Array.isArray(obj.keys)) return `Updated: ${obj.keys.join(", ")}`;
    return Object.keys(obj).join(", ") || "—";
  } catch {
    return metadata.slice(0, 80);
  }
}
