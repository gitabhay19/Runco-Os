"use client";

import { useState, useTransition } from "react";
import {
  Mail,
  Building2,
  IdCard,
  CalendarDays,
  Briefcase,
  ShieldCheck,
  Save,
  Pencil,
  Sparkles,
  CheckCircle2,
  Activity,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getInitials, formatShortDate } from "@/lib/utils";

interface ProfileData {
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
}

interface ProfileStats {
  dealCount: number;
  openTasks: number;
  doneTasks: number;
}

interface Props {
  user: ProfileData;
  stats: ProfileStats;
}

const AVATAR_COLORS = [
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#0f172a",
  "#475569",
];

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contractor", "Intern", "Consultant"];

export function ProfileView({ user: initialUser, stats }: Props) {
  const [user, setUser] = useState<ProfileData>(initialUser);
  const [editing, setEditing] = useState(false);

  // Edit-mode state
  const [name, setName] = useState(user.name);
  const [designation, setDesignation] = useState(user.designation ?? "");
  const [department, setDepartment] = useState(user.department ?? "");
  const [employeeId, setEmployeeId] = useState(user.employeeId ?? "");
  const [employmentType, setEmploymentType] = useState(user.employmentType ?? "Full-time");
  const [joiningDate, setJoiningDate] = useState(user.joiningDate ? user.joiningDate.slice(0, 10) : "");
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setName(user.name);
    setDesignation(user.designation ?? "");
    setDepartment(user.department ?? "");
    setEmployeeId(user.employeeId ?? "");
    setEmploymentType(user.employmentType ?? "Full-time");
    setJoiningDate(user.joiningDate ? user.joiningDate.slice(0, 10) : "");
    setAvatarColor(user.avatarColor);
    setEditing(true);
  }

  function save() {
    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          designation: designation.trim() || null,
          department: department.trim() || null,
          employeeId: employeeId.trim() || null,
          employmentType: employmentType || null,
          joiningDate: joiningDate ? new Date(joiningDate).toISOString() : null,
          avatarColor,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Failed to save");
        return;
      }
      const j = await res.json();
      setUser((u) => ({ ...u, ...j.user }));
      setEditing(false);
      toast.success("Profile updated");
    });
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[hsl(var(--brand)/0.08)] to-transparent"
        aria-hidden
      />

      <div className="scrollbar-thin relative h-full overflow-y-auto px-6 py-6 md:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Hero card */}
          <div className="border-gradient relative overflow-hidden rounded-3xl bg-surface/90 shadow-sm backdrop-blur">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background: `radial-gradient(80% 60% at 0% 0%, ${avatarColor}25 0%, transparent 60%)`,
              }}
              aria-hidden
            />
            <div className="relative flex flex-col gap-6 p-7 md:flex-row md:items-center">
              <div className="flex items-center gap-5">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg ring-1 ring-white/10"
                  style={{
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
                    boxShadow: `0 8px 24px -8px ${avatarColor}80`,
                  }}
                >
                  {getInitials(user.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                      {user.name}
                    </h1>
                    {user.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand)/0.1)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--brand))]">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[14px] text-muted-foreground">
                    {user.designation ?? "—"}
                    {user.department && (
                      <>
                        <span className="mx-2 text-muted-foreground/50">·</span>
                        {user.department}
                      </>
                    )}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex flex-wrap gap-2">
                {!editing ? (
                  <Button onClick={startEdit} size="sm" className="dark:glow-ring">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(false)}
                      disabled={isPending}
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={save} disabled={isPending} className="dark:glow-ring">
                      <Save className="h-3.5 w-3.5" />
                      {isPending ? "Saving…" : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="relative grid grid-cols-3 border-t border-border">
              <Stat
                icon={Sparkles}
                label="Assigned deals"
                value={stats.dealCount}
                accent="#0ea5e9"
              />
              <Stat
                icon={Activity}
                label="Open tasks"
                value={stats.openTasks}
                accent="#f59e0b"
                divider
              />
              <Stat
                icon={CheckCircle2}
                label="Tasks completed"
                value={stats.doneTasks}
                accent="#10b981"
                divider
              />
            </div>
          </div>

          {/* Content grid */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Identity */}
            <Section title="Identity" className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FieldRow icon={null} label="Full name">
                  {editing ? (
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  ) : (
                    <ReadValue>{user.name}</ReadValue>
                  )}
                </FieldRow>

                <FieldRow icon={Mail} label="Email">
                  <ReadValue>{user.email}</ReadValue>
                </FieldRow>

                <FieldRow icon={Briefcase} label="Designation">
                  {editing ? (
                    <Input
                      value={designation}
                      placeholder="e.g. Sales Manager"
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  ) : (
                    <ReadValue>{user.designation ?? "—"}</ReadValue>
                  )}
                </FieldRow>

                <FieldRow icon={Building2} label="Department">
                  {editing ? (
                    <Input
                      value={department}
                      placeholder="e.g. Sales"
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  ) : (
                    <ReadValue>{user.department ?? "—"}</ReadValue>
                  )}
                </FieldRow>
              </div>
            </Section>

            {/* Avatar color picker */}
            <Section title="Avatar">
              <div className="flex flex-col items-center gap-4">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-3xl text-3xl font-bold text-white shadow-lg ring-1 ring-white/10"
                  style={{
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
                    boxShadow: `0 12px 32px -10px ${avatarColor}90`,
                  }}
                >
                  {getInitials(user.name)}
                </div>
                {editing && (
                  <div className="grid grid-cols-5 gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        aria-label={`Pick color ${c}`}
                        className={cn(
                          "h-7 w-7 rounded-full ring-2 transition-all",
                          avatarColor === c ? "ring-foreground" : "ring-transparent hover:ring-border"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
                {!editing && (
                  <p className="text-[11px] text-muted-foreground">
                    Click <span className="text-foreground">Edit profile</span> to customise.
                  </p>
                )}
              </div>
            </Section>

            {/* Employment */}
            <Section title="Employment" className="lg:col-span-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <FieldRow icon={IdCard} label="Employee ID">
                  {editing ? (
                    <Input
                      value={employeeId}
                      placeholder="RC-0001"
                      onChange={(e) => setEmployeeId(e.target.value)}
                    />
                  ) : (
                    <ReadValue>{user.employeeId ?? "—"}</ReadValue>
                  )}
                </FieldRow>

                <FieldRow icon={Briefcase} label="Employment type">
                  {editing ? (
                    <Select value={employmentType} onValueChange={setEmploymentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <ReadValue>{user.employmentType ?? "—"}</ReadValue>
                  )}
                </FieldRow>

                <FieldRow icon={CalendarDays} label="Joining date">
                  {editing ? (
                    <Input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                    />
                  ) : (
                    <ReadValue>{formatShortDate(user.joiningDate) || "—"}</ReadValue>
                  )}
                </FieldRow>

                <FieldRow icon={ShieldCheck} label="Role">
                  <div className="flex h-10 items-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                        user.role === "ADMIN"
                          ? "border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand)/0.1)] text-[hsl(var(--brand))]"
                          : "border-border bg-secondary text-secondary-foreground"
                      )}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {user.role}
                    </span>
                  </div>
                </FieldRow>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface/80 p-5 shadow-sm backdrop-blur",
        className
      )}
    >
      <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }> | null;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

function ReadValue({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-10 items-center rounded-md border border-border bg-canvas/40 px-3 text-sm text-foreground">
      {children}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
  divider,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
  divider?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-6 py-4", divider && "border-l border-border")}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: `${accent}40`,
          backgroundColor: `${accent}14`,
          color: accent,
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-display text-[20px] font-bold leading-none tracking-[-0.02em] text-foreground">
          {value}
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}
