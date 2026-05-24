"use client";

import { Calendar, AlertCircle, Briefcase, MoreVertical, Trash2, Edit3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskDTO, TaskPriority, TaskStatus } from "@/lib/types";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

interface TaskCardProps {
  task: TaskDTO;
  canEdit: boolean;
  canDelete: boolean;
  onClick: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onDelete: () => void;
}

const PRIORITY_STYLES: Record<TaskPriority, { color: string; bg: string; label: string }> = {
  LOW: { color: "#64748b", bg: "#64748b15", label: "Low" },
  MEDIUM: { color: "#0ea5e9", bg: "#0ea5e915", label: "Medium" },
  HIGH: { color: "#f59e0b", bg: "#f59e0b15", label: "High" },
  URGENT: { color: "#ef4444", bg: "#ef444415", label: "Urgent" },
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  DONE: "Done",
};

export function TaskCard({
  task,
  canEdit,
  canDelete,
  onClick,
  onStatusChange,
  onDelete,
}: TaskCardProps) {
  const overdue =
    task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== "DONE";
  const p = PRIORITY_STYLES[task.priority];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left transition-all",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "hover:-translate-y-px hover:border-[hsl(var(--brand)/0.5)] hover:shadow-md"
      )}
    >
      <div className="px-3.5 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-foreground">
              {task.title}
            </div>
            {task.description && (
              <div className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                {task.description}
              </div>
            )}
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Task menu"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[170px]">
                {canEdit && (
                  <DropdownMenuItem onSelect={onClick}>
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as TaskStatus[]).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onSelect={() => onStatusChange(s)}
                    disabled={task.status === s}
                  >
                    Mark as {STATUS_LABEL[s].toLowerCase()}
                  </DropdownMenuItem>
                ))}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={onDelete}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 text-[10.5px]">
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold uppercase tracking-[0.14em]"
            style={{
              borderColor: `${p.color}40`,
              backgroundColor: p.bg,
              color: p.color,
            }}
          >
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}
          </span>

          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5",
              overdue
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border bg-secondary/60 text-muted-foreground"
            )}
          >
            {overdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            <span className="font-medium tabular-nums">
              {formatShortDate(task.dueDate) || "—"}
            </span>
          </div>
        </div>

        {/* Assignee row */}
        <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
            style={{ backgroundColor: task.assignee.avatarColor ?? "#0ea5e9" }}
          >
            {getInitials(task.assignee.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11.5px] font-medium text-foreground">
              {task.assignee.name}
            </div>
            {task.assignee.designation && (
              <div className="truncate text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-2.5 w-2.5" />
                  {task.assignee.designation}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
