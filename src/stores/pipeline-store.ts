"use client";

import { create } from "zustand";
import type { DealDTO, StageDTO } from "@/lib/types";

export type SortMode = "manual" | "followUp" | "created" | "updated";

interface PipelineState {
  stages: StageDTO[];
  deals: DealDTO[];
  loaded: boolean;

  // filters
  search: string;
  assigneeFilter: string | "all";
  stageFilter: string | "all";
  overdueOnly: boolean;
  sort: SortMode;

  // actions
  setData(payload: { stages: StageDTO[]; deals: DealDTO[] }): void;
  upsertDeal(deal: DealDTO): void;
  removeDeal(id: string): void;
  moveDealLocal(dealId: string, toStageId: string, toIndex: number): void;
  setSearch(v: string): void;
  setAssigneeFilter(v: string | "all"): void;
  setStageFilter(v: string | "all"): void;
  setOverdueOnly(v: boolean): void;
  setSort(v: SortMode): void;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  stages: [],
  deals: [],
  loaded: false,

  search: "",
  assigneeFilter: "all",
  stageFilter: "all",
  overdueOnly: false,
  sort: "manual",

  setData: ({ stages, deals }) => set({ stages, deals, loaded: true }),

  upsertDeal: (deal) =>
    set((s) => {
      const idx = s.deals.findIndex((d) => d.id === deal.id);
      if (idx === -1) return { deals: [...s.deals, deal] };
      const next = [...s.deals];
      next[idx] = deal;
      return { deals: next };
    }),

  removeDeal: (id) =>
    set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),

  moveDealLocal: (dealId, toStageId, toIndex) =>
    set((s) => {
      const moving = s.deals.find((d) => d.id === dealId);
      if (!moving) return s;

      // Remove the moving deal from its column
      const fromStageId = moving.stageId;
      const otherDeals = s.deals.filter((d) => d.id !== dealId);

      // Build target column ordering
      const inTarget = otherDeals
        .filter((d) => d.stageId === toStageId)
        .sort((a, b) => a.position - b.position);

      const inserted: DealDTO[] = [...inTarget];
      const safeIndex = Math.max(0, Math.min(toIndex, inserted.length));
      inserted.splice(safeIndex, 0, { ...moving, stageId: toStageId });

      const updatedTarget = inserted.map((d, i) => ({ ...d, position: i }));

      // Re-pack source column if different
      let updatedSource: DealDTO[] = [];
      if (fromStageId !== toStageId) {
        updatedSource = otherDeals
          .filter((d) => d.stageId === fromStageId)
          .sort((a, b) => a.position - b.position)
          .map((d, i) => ({ ...d, position: i }));
      }

      const untouched = otherDeals.filter(
        (d) => d.stageId !== toStageId && d.stageId !== fromStageId
      );

      return { deals: [...untouched, ...updatedSource, ...updatedTarget] };
    }),

  setSearch: (search) => set({ search }),
  setAssigneeFilter: (assigneeFilter) => set({ assigneeFilter }),
  setStageFilter: (stageFilter) => set({ stageFilter }),
  setOverdueOnly: (overdueOnly) => set({ overdueOnly }),
  setSort: (sort) => set({ sort }),
}));
