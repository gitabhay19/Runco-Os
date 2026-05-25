"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Key, ShieldCheck, Search } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

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

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contractor", "Intern", "Consultant"];
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

export function UsersTab({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorUser, setEditorUser] = useState<AdminUser | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.name, u.email, u.designation ?? "", u.department ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  function upsert(user: AdminUser) {
    setUsers((prev) => {
      const idx = prev.findIndex((p) => p.id === user.id);
      if (idx === -1) return [...prev, user];
      const next = [...prev];
      next[idx] = user;
      return next;
    });
  }

  async function handleDelete(user: AdminUser) {
    if (user.id === currentUserId) {
      toast.error("You cannot delete your own account.");
      return;
    }
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "Failed to delete user");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    toast.success("User deleted");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[280px] rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.25)]"
          />
        </div>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => {
              setEditorUser(null);
              setEditorOpen(true);
            }}
            className="dark:glow-ring"
          >
            <Plus className="h-3.5 w-3.5" />
            New user
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-canvas/40 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Access</th>
              <th className="px-4 py-3 text-right">Workload</th>
              <th className="px-4 py-3 text-right">{""}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-accent/30">
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}cc)`,
                      }}
                    >
                      {getInitials(u.name)}
                    </span>
                    <div>
                      <div className="font-medium text-foreground">
                        {u.name}
                        {u.id === currentUserId && (
                          <span className="ml-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                      u.role === "ADMIN"
                        ? "border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand)/0.1)] text-[hsl(var(--brand))]"
                        : "border-border bg-secondary text-secondary-foreground"
                    )}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle text-foreground">
                  {u.department ?? <span className="text-muted-foreground">—</span>}
                  {u.designation && (
                    <div className="text-xs text-muted-foreground">{u.designation}</div>
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  {u.employeeId ?? <span className="text-muted-foreground">—</span>}
                  {u.employmentType && (
                    <div className="text-xs text-muted-foreground">{u.employmentType}</div>
                  )}
                </td>
                <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                  {formatShortDate(u.joiningDate ?? u.createdAt)}
                </td>
                <td className="px-4 py-3 align-middle">
                  {u.role === "ADMIN" ? (
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Full
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(
                        [
                          { key: "pipeline", short: "Pipe" },
                          { key: "tasks", short: "Task" },
                          { key: "contacts", short: "Cont" },
                          { key: "analytics", short: "Anal" },
                        ] as const
                      ).map((p) => {
                        const on = u.access?.[p.key] ?? true;
                        return (
                          <span
                            key={p.key}
                            title={`${p.key}: ${on ? "allowed" : "blocked"}`}
                            className={cn(
                              "inline-flex h-5 items-center rounded px-1.5 text-[9px] font-bold uppercase tracking-[0.12em]",
                              on
                                ? "bg-success/15 text-success"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {p.short}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right align-middle">
                  <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
                    <span title="Assigned deals">{u._count.assignedDeals}d</span>
                    <span title="Assigned tasks">{u._count.assignedTasks}t</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right align-middle">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditorUser(u);
                        setEditorOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        if (u.id === currentUserId) {
                          toast.error("You cannot delete your own account.");
                          return;
                        }
                        setConfirmUser(u);
                      }}
                      disabled={u.id === currentUserId}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No users match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UserEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        user={editorUser}
        onSaved={(u) => upsert(u)}
      />

      <ConfirmDialog
        open={!!confirmUser}
        onOpenChange={(open) => !open && setConfirmUser(null)}
        title={`Delete ${confirmUser?.name}?`}
        description={`This will permanently remove ${confirmUser?.email} and all their data. This cannot be undone.`}
        confirmLabel="Delete user"
        onConfirm={() => confirmUser && handleDelete(confirmUser)}
      />
    </div>
  );
}

function UserEditor({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onSaved: (u: AdminUser) => void;
}) {
  const isEdit = !!user;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [joiningDate, setJoiningDate] = useState("");
  const [avatarColor, setAvatarColor] = useState("#0ea5e9");
  const [access, setAccess] = useState<{
    pipeline: boolean;
    tasks: boolean;
    contacts: boolean;
    analytics: boolean;
  }>({ pipeline: true, tasks: true, contacts: true, analytics: true });
  const [isPending, startTransition] = useTransition();

  function reset(u: AdminUser | null) {
    setPassword("");
    if (u) {
      setName(u.name);
      setEmail(u.email);
      setRole(u.role);
      setDesignation(u.designation ?? "");
      setDepartment(u.department ?? "");
      setEmployeeId(u.employeeId ?? "");
      setEmploymentType(u.employmentType ?? "Full-time");
      setJoiningDate(u.joiningDate ? u.joiningDate.slice(0, 10) : "");
      setAvatarColor(u.avatarColor);
      setAccess(u.access ?? { pipeline: true, tasks: true, contacts: true, analytics: true });
    } else {
      setName("");
      setEmail("");
      setRole("USER");
      setDesignation("");
      setDepartment("");
      setEmployeeId("");
      setEmploymentType("Full-time");
      setJoiningDate("");
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setAccess({ pipeline: true, tasks: true, contacts: true, analytics: true });
    }
  }

  useEffect(() => {
    if (open) reset(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  function submit() {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!isEdit && (!email.trim() || password.length < 8)) {
      toast.error("Email and a password (min 8 chars) are required.");
      return;
    }
    startTransition(async () => {
      const url = isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users";
      const method = isEdit ? "PATCH" : "POST";
      const payload: Record<string, unknown> = {
        name: name.trim(),
        role,
        designation: designation.trim() || null,
        department: department.trim() || null,
        employeeId: employeeId.trim() || null,
        employmentType: employmentType || null,
        joiningDate: joiningDate ? new Date(joiningDate).toISOString() : null,
        avatarColor,
        access,
      };
      if (!isEdit) {
        payload.email = email.trim();
        payload.password = password;
      } else if (password.length > 0) {
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters.");
          return;
        }
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Failed to save");
        return;
      }
      const j = await res.json();
      const merged: AdminUser = {
        ...j.user,
        _count: user?._count ?? { assignedDeals: 0, assignedTasks: 0 },
        access: j.user.access ?? access,
      };
      onSaved(merged);
      toast.success(isEdit ? "User saved" : "User created");
      onOpenChange(false);
    });
  }

  return (    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] overflow-hidden rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update profile and permissions." : "Add a new teammate to the workspace."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Full name *
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Email *
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEdit}
            />
          </div>

          {!isEdit && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Initial password * (min 8 chars)
              </Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Share with the new user securely"
              />
            </div>
          )}
          {isEdit && (
            <div className="col-span-2 space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <Key className="h-3 w-3" />
                Reset password (leave blank to keep current)
              </Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••• new password"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Role
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "USER")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Employment type
            </Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Designation
            </Label>
            <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Department
            </Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Employee ID
            </Label>
            <Input
              value={employeeId}
              placeholder="RC-0001"
              onChange={(e) => setEmployeeId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Joining date
            </Label>
            <Input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Page access
            </Label>
            {role === "ADMIN" ? (
              <div className="rounded-lg border border-dashed border-border bg-canvas/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                Admins always have full access to every page.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: "pipeline", label: "Pipeline" },
                    { key: "tasks", label: "Tasks" },
                    { key: "contacts", label: "Contacts" },
                    { key: "analytics", label: "Analytics" },
                  ] as const
                ).map((p) => {
                  const enabled = access[p.key];
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setAccess({ ...access, [p.key]: !enabled })}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                        enabled
                          ? "border-[hsl(var(--brand)/0.5)] bg-[hsl(var(--brand)/0.08)] text-foreground"
                          : "border-border bg-canvas/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="font-medium">{p.label}</span>
                      <span
                        className={cn(
                          "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
                          enabled ? "bg-[hsl(var(--brand))]" : "bg-border"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform",
                            enabled ? "translate-x-3.5" : "translate-x-0.5"
                          )}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Avatar color
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  aria-label={c}
                  className={cn(
                    "h-7 w-7 rounded-full ring-2 transition-all",
                    avatarColor === c ? "ring-foreground" : "ring-transparent hover:ring-border"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending} className="dark:glow-ring">
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
