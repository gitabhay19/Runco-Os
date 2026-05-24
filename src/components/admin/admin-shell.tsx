"use client";

import { useState } from "react";
import { Users, Activity, BarChart3 } from "lucide-react";
import { UsersTab } from "./users-tab";
import { ActivityTab } from "./activity-tab";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  designation: string | null;
  department: string | null;
  employeeId: string | null;
  employmentType: string | null;
  joiningDate: string | null;
  avatarColor: string;
  createdAt: string;
  _count: { assignedDeals: number; assignedTasks: number };
  access: { pipeline: boolean; tasks: boolean; contacts: boolean; analytics: boolean };
}

interface Props {
  initialUsers: AdminUser[];
  currentUserId: string;
}

type Tab = "users" | "activity" | "analytics";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "activity", label: "Activity", icon: Activity },
];

export function AdminShell({ initialUsers, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border bg-background/60 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "users" && (
        <div className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden />
          <div className="scrollbar-thin relative h-full overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-6xl">
              <UsersTab initialUsers={initialUsers} currentUserId={currentUserId} />
            </div>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden />
          <div className="scrollbar-thin relative h-full overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-5xl">
              <ActivityTab />
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && <AnalyticsView />}
    </div>
  );
}
