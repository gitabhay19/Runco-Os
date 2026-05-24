"use client";

import { Filter, Search, AlertTriangle, ArrowUpDown, Plus } from "lucide-react";
import { usePipelineStore, type SortMode } from "@/stores/pipeline-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserLite } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PipelineToolbarProps {
  users: UserLite[];
  onCreate: () => void;
}

const SORT_LABELS: Record<SortMode, string> = {
  manual: "Manual order",
  followUp: "Follow-up date",
  created: "Created date",
  updated: "Latest activity",
};

export function PipelineToolbar({ users, onCreate }: PipelineToolbarProps) {
  const {
    search,
    setSearch,
    assigneeFilter,
    setAssigneeFilter,
    stageFilter,
    setStageFilter,
    overdueOnly,
    setOverdueOnly,
    sort,
    setSort,
    stages,
  } = usePipelineStore();

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/60 px-6 py-3 backdrop-blur">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by company or contact…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-[280px] rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-[hsl(var(--brand))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.25)]"
        />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        Filter
      </div>

      <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v as string)}>
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

      <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as string)}>
        <SelectTrigger className="h-9 w-[150px] text-xs">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {stages.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant={overdueOnly ? "default" : "outline"}
        onClick={() => setOverdueOnly(!overdueOnly)}
        className={cn("h-9 text-xs", overdueOnly && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Overdue
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
          <SelectTrigger className="h-9 w-[180px] text-xs">
            <ArrowUpDown className="mr-1 h-3.5 w-3.5 opacity-60" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortMode[]).map((k) => (
              <SelectItem key={k} value={k}>
                {SORT_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={onCreate} className="h-9 text-xs dark:glow-ring">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>
    </div>
  );
}
