"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  AlertCircle,
  GripVertical,
  Building2,
  Plus,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { usePipelineStore } from "@/stores/pipeline-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DealDTO } from "@/lib/types";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

interface DealCardProps {
  deal: DealDTO;
  stageColor: string;
  stageName: string;
  onClick?: () => void;
  onOpenWithNote?: (deal: DealDTO, focusStageId: string) => void;
  isOverlay?: boolean;
}

export function DealCard({
  deal,
  stageColor,
  stageName,
  onClick,
  onOpenWithNote,
  isOverlay = false,
}: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id,
    data: { type: "deal", stageId: deal.stageId, deal },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const overdue =
    deal.followUpDate && new Date(deal.followUpDate).getTime() < Date.now() && !isOverlay;

  const stages = usePipelineStore((s) => s.stages);
  const upsertDeal = usePipelineStore((s) => s.upsertDeal);
  const noteCount = deal.stageNotes.filter((n) => n.text.trim().length > 0).length;

  async function ensureNote(stageId: string): Promise<DealDTO | null> {
    try {
      const res = await fetch(`/api/deals/${deal.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed");
      }
      const j = await res.json();
      upsertDeal(j.deal);
      return j.deal as DealDTO;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create note");
      return null;
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card text-left transition-all",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "hover:-translate-y-px hover:border-[hsl(var(--brand)/0.55)] hover:shadow-md",
        isDragging && "opacity-40",
        isOverlay && "rotate-2 scale-[1.02] border-[hsl(var(--brand)/0.6)] shadow-2xl",
        !isDragging && !isOverlay && "border-border"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        onClick={() => {
          if (!isDragging) onClick?.();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isDragging) {
            e.preventDefault();
            onClick?.();
          }
        }}
        role="button"
        tabIndex={0}
        className={cn(
          "cursor-grab px-3.5 py-3 active:cursor-grabbing",
          isOverlay && "cursor-grabbing"
        )}
      >
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{
              borderColor: `${stageColor}40`,
              backgroundColor: `${stageColor}14`,
              color: stageColor,
            }}
          >
            <Building2 className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold leading-tight text-foreground">
              {deal.companyName}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
              {deal.contactName}
            </div>
          </div>

          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{
              borderColor: `${stageColor}40`,
              backgroundColor: `${stageColor}10`,
              color: stageColor,
            }}
          >
            <span
              className="h-1 w-1 rounded-full"
              style={{ backgroundColor: stageColor, boxShadow: `0 0 6px ${stageColor}80` }}
            />
            {stageName}
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
              {formatShortDate(deal.followUpDate) || "—"}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {deal.assignees.slice(0, 4).map(({ user }) => (
              <span
                key={user.id}
                title={user.name}
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-[9px] font-semibold text-white"
                style={{ backgroundColor: user.avatarColor ?? "#0ea5e9" }}
              >
                {getInitials(user.name)}
              </span>
            ))}
            {deal.assignees.length > 4 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-secondary text-[9px] font-semibold text-secondary-foreground">
                +{deal.assignees.length - 4}
              </span>
            )}
          </div>

          {/* Note count + add-note menu — stops propagation so the card doesn't drag/open */}
          <div
            className="flex items-center gap-1.5"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {noteCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <StickyNote className="h-3 w-3" />
                {noteCount}
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Add stage description"
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-all",
                    "hover:border-[hsl(var(--brand)/0.5)] hover:text-foreground"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[230px]">
                <DropdownMenuLabel>Add description for…</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {stages.map((s) => {
                  const exists = deal.stageNotes.some((n) => n.stageId === s.id);
                  return (
                    <DropdownMenuItem
                      key={s.id}
                      onSelect={async () => {
                        const updated = await ensureNote(s.id);
                        if (updated) onOpenWithNote?.(updated, s.id);
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="flex-1">{s.name} stage description</span>
                      {exists && (
                        <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                          edit
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
