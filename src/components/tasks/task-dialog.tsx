"use client";

import { useEffect, useState, useTransition } from "react";
import { Save, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskDTO, TaskPriority, TaskStatus, UserLite } from "@/lib/types";
import { cn, getInitials } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskDTO | null;
  defaultStatus?: TaskStatus;
  users: UserLite[];
  currentUser: UserLite;
  onSaved: (task: TaskDTO) => void;
  onDeleted: (id: string) => void;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "#64748b" },
  { value: "MEDIUM", label: "Medium", color: "#0ea5e9" },
  { value: "HIGH", label: "High", color: "#f59e0b" },
  { value: "URGENT", label: "Urgent", color: "#ef4444" },
];

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "DONE", label: "Done" },
];

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = "TODO",
  users,
  currentUser,
  onSaved,
  onDeleted,
}: Props) {
  const isEdit = !!task;
  const isAdmin = currentUser.role === "ADMIN";
  // Non-admin users can only update status when editing.
  const isReadOnlyToUser = isEdit && !isAdmin && task?.createdBy.id !== currentUser.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assigneeId, setAssigneeId] = useState<string>(currentUser.id);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
      setPriority(task.priority);
      setStatus(task.status);
      setAssigneeId(task.assignee.id);
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("MEDIUM");
      setStatus(defaultStatus);
      setAssigneeId(currentUser.id);
    }
  }, [open, task, defaultStatus, currentUser.id]);

  function submit() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    startTransition(async () => {
      const isStatusOnlyEdit = isEdit && !isAdmin && task?.assignee.id === currentUser.id;
      const url = isEdit ? `/api/tasks/${task!.id}` : "/api/tasks";
      const method = isEdit ? "PATCH" : "POST";
      const payload: Record<string, unknown> = isStatusOnlyEdit
        ? { status }
        : {
            title: title.trim(),
            description: description.trim() || null,
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            priority,
            status,
            assigneeId,
          };

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
      toast.success(isEdit ? "Task saved" : "Task created");
      onSaved(j.task);
      onOpenChange(false);
    });
  }

  async function remove() {
    if (!task) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Task deleted");
    onDeleted(task.id);
    onOpenChange(false);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] gap-0 overflow-hidden rounded-3xl border-border bg-surface p-0 shadow-2xl">
        <DialogHeader className="border-b border-border px-7 py-5">
          <DialogTitle className="font-display text-[20px] font-bold tracking-[-0.02em]">
            {isEdit ? "Edit task" : "New task"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update task details."
              : isAdmin
              ? "Create a task and assign it to a teammate."
              : "Create a task for yourself."}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin max-h-[calc(85vh-180px)] space-y-5 overflow-y-auto px-7 py-6">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to happen?"
              autoFocus
              disabled={isReadOnlyToUser}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add context or steps…"
              disabled={isReadOnlyToUser}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Due date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isReadOnlyToUser}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
                disabled={isReadOnlyToUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Status
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Assignee
            </Label>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const selected = assigneeId === u.id;
                const disabled = isEdit ? !isAdmin : !isAdmin && u.id !== currentUser.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setAssigneeId(u.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition-all",
                      selected
                        ? "border-[hsl(var(--brand)/0.6)] bg-[hsl(var(--brand)/0.1)] text-foreground"
                        : "border-border bg-canvas/40 text-muted-foreground hover:text-foreground",
                      disabled && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                      style={{ backgroundColor: u.avatarColor ?? "#0ea5e9" }}
                    >
                      {getInitials(u.name)}
                    </span>
                    <span className="flex flex-col items-start leading-tight">
                      <span>{u.name}</span>
                      {u.designation && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                          <Briefcase className="h-2.5 w-2.5" />
                          {u.designation}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {!isAdmin && (
              <p className="text-[11px] text-muted-foreground">
                Only admins can assign tasks to other users.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-canvas/40 px-7 py-4">
          <div className="flex items-center gap-2">
            {isEdit && (isAdmin || task?.createdBy.id === currentUser.id) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={isPending} className="dark:glow-ring">
                <Save className="h-3.5 w-3.5" />
                {isPending ? "Saving…" : isEdit ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {task && (
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${task.title}"?`}
        description="This task will be permanently removed. This cannot be undone."
        confirmLabel="Delete task"
        onConfirm={remove}
      />
    )}
  </>
  );
}
