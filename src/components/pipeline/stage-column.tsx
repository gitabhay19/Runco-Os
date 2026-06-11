"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, FileText } from "lucide-react";
import type { DealDTO, StageDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DealCard } from "./deal-card";
import { Button } from "@/components/ui/button";

interface StageColumnProps {
  stage: StageDTO;
  deals: DealDTO[];
  hoverStageId: string | null;
  onCardClick: (deal: DealDTO) => void;
  onCardOpenWithNote?: (deal: DealDTO, focusStageId: string) => void;
  onAdd: (stage: StageDTO) => void;
  onHeaderClick: (stage: StageDTO) => void;
}

export function StageColumn({
  stage,
  deals,
  hoverStageId,
  onCardClick,
  onCardOpenWithNote,
  onAdd,
  onHeaderClick,
}: StageColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `stage-${stage.id}`,
    data: { type: "stage", stageId: stage.id },
  });

  const isHoverTarget = hoverStageId === stage.id;

  return (
    <div
      className={cn(
        "relative flex h-full w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm transition-all",
        isHoverTarget ? "border-[hsl(var(--brand)/0.6)] shadow-lg" : "border-border"
      )}
    >
      {/* Subtle stage-color tint at the top — replaces the solid stripe */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20"
        style={{
          background: `linear-gradient(to bottom, ${stage.color}14, transparent)`,
        }}
        aria-hidden
      />

      {/* Header — clickable, opens stage list dialog */}
      <button
        type="button"
        onClick={() => onHeaderClick(stage)}
        className="relative w-full px-4 pb-3.5 pt-4 text-left transition-colors hover:bg-accent/30 focus:outline-none focus-visible:bg-accent/40"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: stage.color, boxShadow: `0 0 8px ${stage.color}80` }}
              aria-hidden
            />
            {stage.name}
            <span className="opacity-60">· Stage</span>
          </div>
          <span
            className="inline-flex h-[22px] min-w-[28px] items-center justify-center rounded-full border px-2 text-[11px] font-bold tabular-nums"
            style={{
              borderColor: `${stage.color}55`,
              backgroundColor: `${stage.color}1a`,
              color: stage.color,
            }}
          >
            {deals.length}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <h3 className="font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-foreground">
            {stage.name} Stage
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(stage);
            }}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-canvas/60 px-2 text-[11px] font-medium text-muted-foreground transition-all hover:border-[hsl(var(--brand)/0.5)] hover:bg-[hsl(var(--brand)/0.08)] hover:text-foreground"
            aria-label={`Add to ${stage.name}`}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
      </button>

      {/* Description box */}
      <div className="relative px-4 pb-3">
        <div
          className="rounded-xl border bg-canvas/70 p-3"
          style={{ borderColor: `${stage.color}30` }}
        >
          <div
            className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: stage.color }}
          >
            <FileText className="h-2.5 w-2.5" />
            Description
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-foreground/80">
            {stage.description ?? "No description for this stage."}
          </p>
        </div>
      </div>

      <div className="relative h-px w-full bg-border" aria-hidden />

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "scrollbar-thin relative flex flex-1 flex-col gap-2 overflow-y-auto p-2.5 transition-colors",
          isHoverTarget
            ? "bg-[hsl(var(--brand)/0.05)]"
            : "bg-gradient-to-b from-canvas/30 to-canvas/10"
        )}
      >
        <SortableContext id={`stage-${stage.id}`} items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              stageColor={stage.color}
              stageName={stage.name}
              onClick={() => onCardClick(deal)}
              onOpenWithNote={onCardOpenWithNote}
            />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed"
              style={{ borderColor: `${stage.color}55` }}
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">This stage is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
