"use client";

import { Plus } from "lucide-react";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import type { TaskDTO, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskBoardProps {
  tasks: TaskDTO[];
  currentUserId: string;
  isAdmin: boolean;
  onSelect: (task: TaskDTO) => void;
  onStatusChange: (task: TaskDTO, next: TaskStatus) => void;
  onDelete: (task: TaskDTO) => void;
  onAdd: (status: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; name: string; color: string; description: string }[] = [
  { id: "TODO", name: "To do", color: "#94a3b8", description: "Up next." },
  { id: "IN_PROGRESS", name: "In progress", color: "#0ea5e9", description: "Active work in flight." },
  { id: "BLOCKED", name: "Blocked", color: "#f59e0b", description: "Waiting on someone or something." },
  { id: "DONE", name: "Done", color: "#10b981", description: "Wrapped up." },
];

export function TaskBoard({
  tasks,
  currentUserId,
  isAdmin,
  onSelect,
  onStatusChange,
  onDelete,
  onAdd,
}: TaskBoardProps) {
  const byStatus = new Map<TaskStatus, TaskDTO[]>();
  for (const c of COLUMNS) byStatus.set(c.id, []);
  for (const t of tasks) byStatus.get(t.status)?.push(t);

  return (
    <div className="scrollbar-thin relative flex h-full gap-4 overflow-x-auto px-6 pb-6 pt-5">
      {COLUMNS.map((col) => {
        const list = byStatus.get(col.id) ?? [];
        return (
          <div
            key={col.id}
            className={cn(
              "relative flex h-full w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-20"
              style={{ background: `linear-gradient(to bottom, ${col.color}14, transparent)` }}
              aria-hidden
            />

            <div className="relative px-4 pb-3.5 pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: col.color, boxShadow: `0 0 8px ${col.color}80` }}
                  />
                  {col.name}
                </div>
                <span
                  className="inline-flex h-[22px] min-w-[28px] items-center justify-center rounded-full border px-2 text-[11px] font-bold tabular-nums"
                  style={{
                    borderColor: `${col.color}55`,
                    backgroundColor: `${col.color}1a`,
                    color: col.color,
                  }}
                >
                  {list.length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <h3 className="font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-foreground">
                  {col.name}
                </h3>
                <button
                  type="button"
                  onClick={() => onAdd(col.id)}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-canvas/60 px-2 text-[11px] font-medium text-muted-foreground transition-all hover:border-[hsl(var(--brand)/0.5)] hover:bg-[hsl(var(--brand)/0.08)] hover:text-foreground"
                  aria-label={`Add ${col.name} task`}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{col.description}</p>
            </div>

            <div className="relative h-px w-full bg-border" />

            <div className="scrollbar-thin relative flex flex-1 flex-col gap-2 overflow-y-auto bg-gradient-to-b from-canvas/30 to-canvas/10 p-2.5">
              {list.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed"
                    style={{ borderColor: `${col.color}55` }}
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">No tasks here</p>
                </div>
              ) : (
                list.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canEdit={isAdmin || task.assignee.id === currentUserId}
                    canDelete={isAdmin || task.createdBy.id === currentUserId}
                    onClick={() => onSelect(task)}
                    onStatusChange={(s) => onStatusChange(task, s)}
                    onDelete={() => onDelete(task)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
