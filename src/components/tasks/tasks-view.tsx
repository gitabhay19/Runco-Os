"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Filter, AlertTriangle, LayoutGrid, List as ListIcon } from "lucide-react";
import { toast } from "sonner";
import { TaskBoard } from "./task-board";
import { TaskDialog } from "./task-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTasksStore } from "@/stores/tasks-store";
import type { TaskDTO, TaskPriority, TaskStatus, UserLite } from "@/lib/types";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

interface TasksViewProps {
  initialTasks: TaskDTO[];
  users: UserLite[];
  currentUser: UserLite;
}

type ViewMode = "board" | "list";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#0ea5e9",
  BLOCKED: "#f59e0b",
  DONE: "#10b981",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  LOW: "#64748b",
  MEDIUM: "#0ea5e9",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
};

export function TasksView({ initialTasks, users, currentUser }: TasksViewProps) {
  const tasks = useTasksStore((s) => s.tasks);
  const setTasks = useTasksStore((s) => s.setTasks);
  const upsertTask = useTasksStore((s) => s.upsertTask);
  const removeTaskFromStore = useTasksStore((s) => s.removeTask);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    setTasks(initialTasks);
  }, [initialTasks, setTasks]);

  const [view, setView] = useState<ViewMode>("board");
  const initRef = useRef(false);
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTask, setEditorTask] = useState<TaskDTO | null>(null);
  const [editorStatus, setEditorStatus] = useState<TaskStatus>("TODO");
  const [confirmTask, setConfirmTask] = useState<TaskDTO | null>(null);

  const isAdmin = currentUser.role === "ADMIN";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q) {
        const hay = `${t.title} ${t.description ?? ""} ${t.assignee.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (assigneeFilter !== "all" && t.assignee.id !== assigneeFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (overdueOnly) {
        if (!t.dueDate) return false;
        if (t.status === "DONE") return false;
        if (new Date(t.dueDate).getTime() >= Date.now()) return false;
      }
      return true;
    });
  }, [tasks, search, assigneeFilter, priorityFilter, overdueOnly]);

  function upsertTaskLocal(task: TaskDTO) {
    upsertTask(task);
  }

  function removeTaskLocal(id: string) {
    removeTaskFromStore(id);
  }

  async function changeStatus(task: TaskDTO, next: TaskStatus) {
    if (task.status === next) return;
    const before = tasks;
    upsertTaskLocal({ ...task, status: next });
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("status update failed");
      const j = await res.json();
      upsertTaskLocal(j.task);
    } catch {
      setTasks(before);
      toast.error("Could not update status");
    }
  }

  async function deleteTask(task: TaskDTO) {
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete task");
      return;
    }
    removeTaskLocal(task.id);
    toast.success("Task deleted");
  }

  function openEditor(task: TaskDTO) {
    setEditorTask(task);
    setEditorOpen(true);
  }

  function openCreate(status: TaskStatus = "TODO") {
    setEditorTask(null);
    setEditorStatus(status);
    setEditorOpen(true);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/60 px-6 py-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[260px] rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.25)]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </div>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="h-9 w-[170px] text-xs">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant={overdueOnly ? "default" : "outline"}
          onClick={() => setOverdueOnly(!overdueOnly)}
          className={cn(
            "h-9 text-xs",
            overdueOnly && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Overdue
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {/* View switch */}
          <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
                view === "board"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
                view === "list"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListIcon className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <Button size="sm" onClick={() => openCreate("TODO")} className="h-9 text-xs dark:glow-ring">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(var(--brand)/0.06)] to-transparent"
          aria-hidden
        />

        <div className="relative h-full">
          {view === "board" ? (
            <TaskBoard
              tasks={filtered}
              currentUserId={currentUser.id}
              isAdmin={isAdmin}
              onSelect={openEditor}
              onStatusChange={changeStatus}
              onDelete={(t) => setConfirmTask(t)}
              onAdd={(status) => openCreate(status)}
            />
          ) : (
            <TaskListView
              tasks={filtered}
              currentUser={currentUser}
              onSelect={openEditor}
              onStatusChange={changeStatus}
              onDelete={(t) => setConfirmTask(t)}
            />
          )}
        </div>
      </div>

      <TaskDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        task={editorTask}
        defaultStatus={editorStatus}
        users={users}
        currentUser={currentUser}
        onSaved={(t) => upsertTaskLocal(t)}
        onDeleted={(id) => removeTaskLocal(id)}
      />

      <ConfirmDialog
        open={!!confirmTask}
        onOpenChange={(open) => !open && setConfirmTask(null)}
        title={`Delete "${confirmTask?.title}"?`}
        description="This task will be permanently removed. This cannot be undone."
        confirmLabel="Delete task"
        onConfirm={() => confirmTask && deleteTask(confirmTask)}
      />
    </>
  );
}

function TaskListView({
  tasks,
  currentUser,
  onSelect,
  onStatusChange,
  onDelete,
}: {
  tasks: TaskDTO[];
  currentUser: UserLite;
  onSelect: (t: TaskDTO) => void;
  onStatusChange: (t: TaskDTO, s: TaskStatus) => void;
  onDelete: (t: TaskDTO) => void;
}) {
  const isAdmin = currentUser.role === "ADMIN";

  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-10 py-16 text-center">
          <p className="text-sm text-muted-foreground">No tasks match your filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto px-6 py-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-canvas/40 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Task</th>
              <th className="px-4 py-3 text-left">Assignee</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Due</th>
              <th className="px-4 py-3 text-right">{""}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((t) => {
              const overdue =
                t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "DONE";
              return (
                <tr
                  key={t.id}
                  className="cursor-pointer transition-colors hover:bg-accent/40"
                  onClick={() => onSelect(t)}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-foreground">{t.title}</div>
                    {t.description && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                        style={{ backgroundColor: t.assignee.avatarColor ?? "#0ea5e9" }}
                      >
                        {getInitials(t.assignee.name)}
                      </span>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[12.5px] text-foreground">{t.assignee.name}</span>
                        {t.assignee.designation && (
                          <span className="text-[10px] text-muted-foreground">
                            {t.assignee.designation}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        borderColor: `${STATUS_COLOR[t.status]}40`,
                        backgroundColor: `${STATUS_COLOR[t.status]}15`,
                        color: STATUS_COLOR[t.status],
                      }}
                    >
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: STATUS_COLOR[t.status] }}
                      />
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        borderColor: `${PRIORITY_COLOR[t.priority]}40`,
                        backgroundColor: `${PRIORITY_COLOR[t.priority]}15`,
                        color: PRIORITY_COLOR[t.priority],
                      }}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    <span className={overdue ? "text-destructive" : "text-muted-foreground"}>
                      {formatShortDate(t.dueDate) || "—"}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 align-top text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(isAdmin || t.assignee.id === currentUser.id) && t.status !== "DONE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => onStatusChange(t, "DONE")}
                      >
                        Mark done
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-1 h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(t)}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
