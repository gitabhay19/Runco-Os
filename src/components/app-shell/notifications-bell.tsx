"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, Building2, CheckSquare, UserCog, Bell as BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotificationsStore } from "@/stores/notifications-store";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  deal_assigned: Building2,
  deal_moved: Building2,
  deal_updated: Building2,
  task_assigned: CheckSquare,
  task_status_changed: CheckSquare,
  user_welcome: UserCog,
  info: BellIcon,
};

export function NotificationsBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotificationsStore();
  const [open, setOpen] = useState(false);

  async function handleMarkAll() {
    await fetch("/api/notifications", { method: "POST" });
    markAllRead();
  }

  async function handleClickItem(id: string) {
    if (!notifications.find((n) => n.id === id)?.readAt) {
      markRead(id);
      void fetch(`/api/notifications/${id}`, { method: "PATCH" });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[hsl(var(--brand))] px-1 text-[9px] font-bold text-[hsl(var(--brand-foreground))]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="font-display text-sm font-semibold text-foreground">Notifications</div>
            <div className="text-[11px] text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        <div className="scrollbar-thin max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = KIND_ICON[n.kind] ?? Bell;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "transition-colors hover:bg-accent/40",
                      !n.readAt && "bg-[hsl(var(--brand)/0.04)]"
                    )}
                  >
                    <Link
                      href={n.link ?? "#"}
                      onClick={() => {
                        handleClickItem(n.id);
                        setOpen(false);
                      }}
                      className="flex items-start gap-3 px-4 py-3 text-left"
                    >
                      {n.actor ? (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${n.actor.avatarColor ?? "#0ea5e9"}, ${
                              n.actor.avatarColor ?? "#0ea5e9"
                            }cc)`,
                          }}
                        >
                          {getInitials(n.actor.name)}
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-canvas text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-[13px] font-medium text-foreground">
                            {n.title}
                          </span>
                          {!n.readAt && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--brand))]" />
                          )}
                        </div>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                        <div className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
                          {formatShortDate(n.createdAt)}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
