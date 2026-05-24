"use client";

import { Mail, ChevronRight, Building2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { DealDTO, StageDTO } from "@/lib/types";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: StageDTO | null;
  deals: DealDTO[];
  onSelect: (deal: DealDTO) => void;
}

export function StageListDialog({ open, onOpenChange, stage, deals, onSelect }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return deals;
    return deals.filter((d) => {
      const hay = [
        d.companyName,
        d.contactName,
        ...d.emails.map((e) => e.address),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [q, deals]);

  if (!stage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px] gap-0 overflow-hidden rounded-3xl border-border bg-surface p-0 shadow-2xl">
        <DialogHeader className="border-b border-border px-7 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl border"
              style={{
                borderColor: `${stage.color}40`,
                backgroundColor: `${stage.color}14`,
                color: stage.color,
              }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-[20px] font-bold tracking-[-0.02em]">
                {stage.name} Stage
              </DialogTitle>
              <DialogDescription>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: stage.color,
                      boxShadow: `0 0 8px ${stage.color}80`,
                    }}
                  />
                  {deals.length} {deals.length === 1 ? "deal" : "deals"} in this stage
                </span>
              </DialogDescription>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by company, contact or email…"
              className="h-9 bg-canvas/60 pl-9 text-[13px]"
            />
          </div>
        </DialogHeader>

        <div className="scrollbar-thin max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-7 py-10 text-center text-sm text-muted-foreground">
              No deals match this filter.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(d)}
                    className={cn(
                      "group flex w-full items-center gap-4 px-7 py-3.5 text-left transition-colors",
                      "hover:bg-accent/50"
                    )}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: `${stage.color}40`,
                        backgroundColor: `${stage.color}14`,
                        color: stage.color,
                      }}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-[14px] font-semibold text-foreground">
                          {d.companyName}
                        </span>
                        <span className="truncate text-[12px] text-muted-foreground">
                          · {d.contactName}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                        {d.emails[0] ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{d.emails[0].address}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">No email</span>
                        )}
                        <span className="text-muted-foreground/60">·</span>
                        <span>Follow-up {formatShortDate(d.followUpDate) || "—"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {d.assignees.slice(0, 3).map(({ user }) => (
                          <span
                            key={user.id}
                            title={user.name}
                            className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface text-[9px] font-semibold text-white"
                            style={{ backgroundColor: user.avatarColor ?? "#0ea5e9" }}
                          >
                            {getInitials(user.name)}
                          </span>
                        ))}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
