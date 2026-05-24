"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CheckSquare,
  Users,
  Settings,
  ShieldCheck,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn, getInitials } from "@/lib/utils";
import type { Role } from "@/lib/enums";

interface SidebarProps {
  user: { name: string; email: string; role: Role; avatarColor?: string | null };
}

const NAV = [
  { href: "/pipeline", label: "Pipeline", icon: LayoutGrid },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const ADMIN_NAV = [{ href: "/admin", label: "Admin", icon: ShieldCheck }];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/pipeline" className="flex items-center gap-2.5">
          <Logo size="md" />
          <span className="rounded-md border border-border bg-canvas px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            OS
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        <SidebarSection label="Workspace" />
        {NAV.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname?.startsWith(item.href) ?? false}
          />
        ))}

        {isAdmin && (
          <>
            <SidebarSection label="Administration" className="mt-6" />
            {ADMIN_NAV.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname?.startsWith(item.href) ?? false}
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/profile"
          className={cn(
            "group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all",
            "hover:border-border hover:bg-elevated"
          )}
        >
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${user.avatarColor ?? "#0ea5e9"}, ${
                user.avatarColor ?? "#0ea5e9"
              }cc)`,
            }}
          >
            {getInitials(user.name)}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-success" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
              {user.role === "ADMIN" && (
                <span className="rounded bg-[hsl(var(--brand)/0.12)] px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[hsl(var(--brand))]">
                  A
                </span>
              )}
            </div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>
      </div>
    </aside>
  );
}

function SidebarSection({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("px-2 pb-1.5 pt-2", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[hsl(var(--brand))]" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 transition-colors",
          active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {label}
    </Link>
  );
}
