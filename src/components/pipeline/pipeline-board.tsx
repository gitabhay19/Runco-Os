"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { usePipelineStore } from "@/stores/pipeline-store";
import { StageColumn } from "./stage-column";
import { DealCard } from "./deal-card";
import { PipelineToolbar } from "./pipeline-toolbar";
import { DealDrawer } from "./deal-drawer";
import { CreateDealDialog } from "./create-deal-dialog";
import { StageListDialog } from "./stage-list-dialog";
import type { DealDTO, StageDTO, UserLite } from "@/lib/types";

interface PipelineBoardProps {
  initialStages: StageDTO[];
  initialDeals: DealDTO[];
  users: UserLite[];
  currentUser: UserLite;
}

export function PipelineBoard({
  initialStages,
  initialDeals,
  users,
  currentUser,
}: PipelineBoardProps) {
  const {
    stages,
    deals,
    setData,
    moveDealLocal,
    upsertDeal,
    removeDeal,
    search,
    assigneeFilter,
    stageFilter,
    overdueOnly,
    sort,
  } = usePipelineStore();

  const [activeDeal, setActiveDeal] = useState<DealDTO | null>(null);
  const [hoverStageId, setHoverStageId] = useState<string | null>(null);

  const [drawerDeal, setDrawerDeal] = useState<DealDTO | null>(null);
  const [drawerFocusStageId, setDrawerFocusStageId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStage, setCreateStage] = useState<StageDTO | null>(null);

  const [listStage, setListStage] = useState<StageDTO | null>(null);

  const initRef = useRef(false);
  useEffect(() => {
    // Only initialise on first mount. After that, the store is the source of
    // truth so realtime events don't get overwritten on re-render.
    if (initRef.current) return;
    initRef.current = true;
    setData({ stages: initialStages, deals: initialDeals });
  }, [initialStages, initialDeals, setData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Custom collision detection: prioritise stage containers for cross-column
  // moves, then fall back to closestCenter for within-column card ordering.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // 1. Check if the pointer is within any stage droppable
    const pointerCollisions = pointerWithin({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) =>
        String(c.id).startsWith("stage-")
      ),
    });

    if (pointerCollisions.length > 0) {
      // We know which stage the pointer is in. Now find the closest card
      // within that stage so we can resolve the insertion index.
      const stageId = String(pointerCollisions[0].id).replace("stage-", "");
      const cardsInStage = args.droppableContainers.filter(
        (c) => !String(c.id).startsWith("stage-") && c.data?.current?.sortable?.containerId === `stage-${stageId}`
      );

      if (cardsInStage.length > 0) {
        const cardCollisions = closestCenter({
          ...args,
          droppableContainers: cardsInStage,
        });
        if (cardCollisions.length > 0) return cardCollisions;
      }

      // No cards in the stage (empty column) — return the stage itself
      return pointerCollisions;
    }

    // 2. Fallback: use rectIntersection on stages, then closestCenter on cards
    const rectCollisions = rectIntersection({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) =>
        String(c.id).startsWith("stage-")
      ),
    });

    if (rectCollisions.length > 0) {
      const stageId = String(rectCollisions[0].id).replace("stage-", "");
      const cardsInStage = args.droppableContainers.filter(
        (c) => !String(c.id).startsWith("stage-") && c.data?.current?.sortable?.containerId === `stage-${stageId}`
      );

      if (cardsInStage.length > 0) {
        const cardCollisions = closestCenter({
          ...args,
          droppableContainers: cardsInStage,
        });
        if (cardCollisions.length > 0) return cardCollisions;
      }

      return rectCollisions;
    }

    // 3. Last resort
    return closestCenter(args);
  }, []);

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((d) => {
      if (q) {
        const hay = `${d.companyName} ${d.contactName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (assigneeFilter !== "all") {
        if (!d.assignees.some((a) => a.user.id === assigneeFilter)) return false;
      }
      if (stageFilter !== "all" && d.stageId !== stageFilter) return false;
      if (overdueOnly) {
        if (!d.followUpDate) return false;
        if (new Date(d.followUpDate).getTime() >= Date.now()) return false;
      }
      return true;
    });
  }, [deals, search, assigneeFilter, stageFilter, overdueOnly]);

  const dealsByStage = useMemo(() => {
    const map = new Map<string, DealDTO[]>();
    for (const stage of stages) map.set(stage.id, []);

    const sortFn = getSortFn(sort);

    for (const deal of filteredDeals) {
      const arr = map.get(deal.stageId);
      if (arr) arr.push(deal);
    }
    for (const [k, arr] of map) {
      arr.sort(sortFn);
      map.set(k, arr);
    }
    return map;
  }, [filteredDeals, stages, sort]);

  function findDealById(id: string): DealDTO | undefined {
    return deals.find((d) => d.id === id);
  }

  function findStageById(id: string): StageDTO | undefined {
    return stages.find((s) => s.id === id);
  }

  function resolveStageFromOverId(overId: string): string | null {
    if (overId.startsWith("stage-")) return overId.replace("stage-", "");
    const overDeal = findDealById(overId);
    return overDeal?.stageId ?? null;
  }

  function onDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const deal = findDealById(id);
    if (deal) {
      setActiveDeal(deal);
      setHoverStageId(deal.stageId);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined;
    if (!overId) return;
    const stageId = resolveStageFromOverId(overId);
    if (stageId && stageId !== hoverStageId) setHoverStageId(stageId);
  }

  async function onDragEnd(event: DragEndEvent) {
    const moving = activeDeal;
    setActiveDeal(null);
    setHoverStageId(null);
    const { active, over } = event;
    if (!over || !moving) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let toStageId: string | null = null;
    let toIndex = 0;

    if (overId.startsWith("stage-")) {
      toStageId = overId.replace("stage-", "");
      toIndex = (dealsByStage.get(toStageId)?.length ?? 0);
      const same = moving.stageId === toStageId;
      if (same) toIndex = Math.max(0, toIndex - 1);
    } else {
      const overDeal = findDealById(overId);
      if (!overDeal) return;
      toStageId = overDeal.stageId;
      const stageList = dealsByStage.get(toStageId) ?? [];
      toIndex = stageList.findIndex((d) => d.id === overId);
      if (toIndex < 0) toIndex = stageList.length;
    }

    if (!toStageId) return;
    if (moving.stageId === toStageId && moving.position === toIndex) return;

    const before = deals;
    moveDealLocal(activeId, toStageId, toIndex);

    try {
      const res = await fetch("/api/deals/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: activeId, toStageId, toIndex }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      // After reorder, re-fetch this deal to get the fresh stageNotes (server may have created one).
      const fresh = await fetch(`/api/deals/${activeId}`).then((r) => (r.ok ? r.json() : null));
      if (fresh?.deal) upsertDeal(fresh.deal);

      if (moving.stageId !== toStageId) {
        const targetStage = stages.find((s) => s.id === toStageId);
        if (targetStage) toast.success(`Moved to ${targetStage.name}`);
      }
    } catch (err) {
      usePipelineStore.setState({ deals: before });
      toast.error(err instanceof Error ? err.message : "Failed to move deal");
    }
  }

  function handleCardClick(deal: DealDTO) {
    setDrawerFocusStageId(null);
    setDrawerDeal(deal);
  }

  function handleOpenWithNote(deal: DealDTO, focusStageId: string) {
    setDrawerFocusStageId(focusStageId);
    setDrawerDeal(deal);
  }

  function handleAdd(stage: StageDTO) {
    setCreateStage(stage);
    setCreateOpen(true);
  }

  function handleHeaderClick(stage: StageDTO) {
    setListStage(stage);
  }

  const overlayStage = activeDeal
    ? findStageById(hoverStageId ?? activeDeal.stageId) ?? null
    : null;

  return (
    <>
      <PipelineToolbar
        users={users}
        onCreate={() => {
          setCreateStage(null);
          setCreateOpen(true);
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(var(--brand)/0.06)] to-transparent"
            aria-hidden
          />
          <div className="scrollbar-thin relative flex h-full gap-4 overflow-x-auto px-6 pb-6 pt-5">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage.get(stage.id) ?? []}
                hoverStageId={activeDeal ? hoverStageId : null}
                onCardClick={handleCardClick}
                onCardOpenWithNote={handleOpenWithNote}
                onAdd={handleAdd}
                onHeaderClick={handleHeaderClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal && overlayStage ? (
            <DealCard
              deal={activeDeal}
              stageColor={overlayStage.color}
              stageName={overlayStage.name}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <DealDrawer
        deal={drawerDeal}
        open={!!drawerDeal}
        onOpenChange={(open) => {
          if (!open) {
            setDrawerDeal(null);
            setDrawerFocusStageId(null);
          }
        }}
        users={users}
        currentUser={currentUser}
        focusStageId={drawerFocusStageId}
        onSaved={(deal) => {
          upsertDeal(deal);
          setDrawerDeal(deal);
        }}
        onDeleted={(id) => {
          removeDeal(id);
          setDrawerDeal(null);
        }}
      />

      <CreateDealDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStageId={createStage?.id ?? stages[0]?.id ?? ""}
        stages={stages}
        users={users}
        currentUserId={currentUser.id}
        onCreated={(deal) => upsertDeal(deal)}
      />

      <StageListDialog
        open={!!listStage}
        onOpenChange={(open) => !open && setListStage(null)}
        stage={listStage}
        deals={listStage ? dealsByStage.get(listStage.id) ?? [] : []}
        onSelect={(deal) => {
          setListStage(null);
          // Slight delay so the close animation finishes before the next dialog opens.
          setTimeout(() => handleCardClick(deal), 150);
        }}
      />
    </>
  );
}

function getSortFn(mode: ReturnType<typeof usePipelineStore.getState>["sort"]) {
  switch (mode) {
    case "followUp":
      return (a: DealDTO, b: DealDTO) => {
        const av = a.followUpDate ? new Date(a.followUpDate).getTime() : Infinity;
        const bv = b.followUpDate ? new Date(b.followUpDate).getTime() : Infinity;
        return av - bv;
      };
    case "created":
      return (a: DealDTO, b: DealDTO) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case "updated":
      return (a: DealDTO, b: DealDTO) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    case "manual":
    default:
      return (a: DealDTO, b: DealDTO) => a.position - b.position;
  }
}
