"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Mail,
  Phone,
  Plus,
  Trash2,
  X,
  Save,
  History,
  Building2,
  StickyNote,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePipelineStore } from "@/stores/pipeline-store";
import type { DealDTO, StageHistoryDTO, StageNoteDTO, UserLite } from "@/lib/types";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

interface Props {
  deal: DealDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserLite[];
  currentUser: UserLite;
  focusStageId?: string | null;
  onSaved: (deal: DealDTO) => void;
  onDeleted: (id: string) => void;
}

interface DraftPhone {
  id?: string;
  number: string;
}

interface DraftEmail {
  id?: string;
  address: string;
}

export function DealDrawer({
  deal,
  open,
  onOpenChange,
  users,
  currentUser,
  focusStageId,
  onSaved,
  onDeleted,
}: Props) {
  const stages = usePipelineStore((s) => s.stages);
  const upsertDeal = usePipelineStore((s) => s.upsertDeal);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [designation, setDesignation] = useState("");
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [phones, setPhones] = useState<DraftPhone[]>([]);
  const [emails, setEmails] = useState<DraftEmail[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [history, setHistory] = useState<StageHistoryDTO[]>([]);
  const [isPending, startTransition] = useTransition();
  const focusedRef = useRef<HTMLTextAreaElement | null>(null);

  const canEdit =
    !!deal &&
    (currentUser.role === "ADMIN" ||
      deal.createdBy.id === currentUser.id ||
      deal.assignees.some((a) => a.user.id === currentUser.id));

  const canEditAssignees = currentUser.role === "ADMIN";

  useEffect(() => {
    if (!deal) return;
    setCompanyName(deal.companyName);
    setContactName(deal.contactName);
    setDesignation(deal.designation ?? "");
    setFollowUpDate(deal.followUpDate ? deal.followUpDate.slice(0, 10) : "");
    setPhones(deal.phones.map((p) => ({ id: p.id, number: p.number })));
    setEmails(deal.emails.map((e) => ({ id: e.id, address: e.address })));
    setAssigneeIds(deal.assignees.map((a) => a.user.id));
    setHistory([]);
  }, [deal?.id]);

  useEffect(() => {
    if (!open || !deal) return;
    fetch(`/api/deals/${deal.id}/history`)
      .then((r) => (r.ok ? r.json() : { history: [] }))
      .then((d) => setHistory(d.history ?? []))
      .catch(() => {});
  }, [open, deal?.id]);

  // Focus the freshly-added stage note when caller asked us to.
  useEffect(() => {
    if (!open || !focusStageId) return;
    const t = setTimeout(() => focusedRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, focusStageId, deal?.id]);

  function save() {
    if (!deal) return;
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        companyName,
        contactName,
        designation: designation || null,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
        phones: phones.filter((p) => p.number.trim()).map((p) => ({ number: p.number.trim() })),
        emails: emails.filter((e) => e.address.trim()).map((e) => ({ address: e.address.trim() })),
      };
      if (canEditAssignees) payload.assigneeIds = assigneeIds;

      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Failed to save");
        return;
      }
      const j = await res.json();
      toast.success("Deal saved");
      onSaved(j.deal);
    });
  }

  async function remove() {
    if (!deal) return;
    if (!confirm(`Delete "${deal.companyName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Deal deleted");
    onDeleted(deal.id);
  }

  async function addNote(stageId: string) {
    if (!deal) return;
    const res = await fetch(`/api/deals/${deal.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId }),
    });
    if (!res.ok) {
      toast.error("Could not add note");
      return;
    }
    const j = await res.json();
    upsertDeal(j.deal);
    onSaved(j.deal);
  }

  if (!deal) return null;

  const sortedNotes = [...deal.stageNotes].sort((a, b) => a.stage.order - b.stage.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] gap-0 overflow-hidden rounded-3xl border-border bg-surface p-0 shadow-2xl">
        <DialogHeader className="border-b border-border px-7 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl border"
              style={{
                borderColor: `${deal.stage.color}40`,
                backgroundColor: `${deal.stage.color}10`,
                color: deal.stage.color,
              }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate font-display text-[20px] font-bold tracking-[-0.02em]">
                {deal.companyName}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: deal.stage.color,
                      boxShadow: `0 0 8px ${deal.stage.color}80`,
                    }}
                  />
                  <span style={{ color: deal.stage.color }}>{deal.stage.name}</span>
                  <span className="mx-1.5 text-muted-foreground/50">·</span>
                  <span className="text-muted-foreground">
                    Created {formatShortDate(deal.createdAt)}
                  </span>
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="scrollbar-thin max-h-[calc(85vh-200px)] overflow-y-auto px-7 py-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company">
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Contact name">
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Designation">
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Follow-up date">
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Activity">
              <div className="flex h-10 items-center">
                <Badge variant={deal.activityStatus === "ACTIVE" ? "success" : "outline"}>
                  {deal.activityStatus}
                </Badge>
              </div>
            </Field>
            <Field label="Owner">
              <div className="flex h-10 items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ backgroundColor: deal.createdBy.avatarColor ?? "#0ea5e9" }}
                >
                  {getInitials(deal.createdBy.name)}
                </span>
                <span className="text-sm text-foreground">{deal.createdBy.name}</span>
              </div>
            </Field>
          </div>

          {/* Stage descriptions section */}
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5" />
                Stage descriptions
              </div>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[230px]">
                    <DropdownMenuLabel>Add description for…</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {stages.map((s) => {
                      const exists = deal.stageNotes.some((n) => n.stageId === s.id);
                      return (
                        <DropdownMenuItem key={s.id} onSelect={() => addNote(s.id)}>
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
              )}
            </div>

            {sortedNotes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-canvas/30 p-6 text-center">
                <p className="text-[12px] text-muted-foreground">
                  No stage descriptions yet. Click <span className="text-foreground">Add</span> to
                  start one.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedNotes.map((note) => (
                  <StageNoteEditor
                    key={note.id}
                    dealId={deal.id}
                    note={note}
                    autoFocus={note.stageId === focusStageId}
                    inputRef={note.stageId === focusStageId ? focusedRef : undefined}
                    disabled={!canEdit}
                    onUpdated={(d) => onSaved(d)}
                    canDelete={canEdit}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <RepeaterSection
              label="Phone numbers"
              icon={Phone}
              items={phones.map((p, i) => ({
                key: p.id ?? `new-${i}`,
                value: p.number,
                onChange: (v) =>
                  setPhones((arr) => arr.map((pp, j) => (j === i ? { ...pp, number: v } : pp))),
                onRemove: () => setPhones((arr) => arr.filter((_, j) => j !== i)),
                placeholder: "+1 415 555 0123",
              }))}
              onAdd={() => setPhones((arr) => [...arr, { number: "" }])}
              disabled={!canEdit}
            />
            <RepeaterSection
              label="Email addresses"
              icon={Mail}
              items={emails.map((e, i) => ({
                key: e.id ?? `new-${i}`,
                value: e.address,
                onChange: (v) =>
                  setEmails((arr) => arr.map((ee, j) => (j === i ? { ...ee, address: v } : ee))),
                onRemove: () => setEmails((arr) => arr.filter((_, j) => j !== i)),
                placeholder: "name@company.com",
                type: "email",
              }))}
              onAdd={() => setEmails((arr) => [...arr, { address: "" }])}
              disabled={!canEdit}
            />
          </div>

          <div className="mt-6">
            <SectionLabel>Assignees</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const selected = assigneeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={!canEditAssignees}
                    onClick={() =>
                      setAssigneeIds((ids) =>
                        ids.includes(u.id) ? ids.filter((i) => i !== u.id) : [...ids, u.id]
                      )
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition-all",
                      selected
                        ? "border-[hsl(var(--brand)/0.6)] bg-[hsl(var(--brand)/0.1)] text-foreground"
                        : "border-border bg-canvas/40 text-muted-foreground hover:text-foreground",
                      !canEditAssignees && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                      style={{ backgroundColor: u.avatarColor ?? "#0ea5e9" }}
                    >
                      {getInitials(u.name)}
                    </span>
                    {u.name}
                  </button>
                );
              })}
            </div>
            {!canEditAssignees && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Only admins can change assignees.
              </p>
            )}
          </div>

          <div className="mt-7 rounded-xl border border-border bg-canvas/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              Stage history
            </div>
            {history.length === 0 ? (
              <div className="text-xs text-muted-foreground">No stage changes yet.</div>
            ) : (
              <ol className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="flex items-start gap-3">
                    <span
                      className="mt-1 h-2 w-2 rounded-full"
                      style={{ backgroundColor: h.toStage.color }}
                    />
                    <div className="flex-1 text-xs">
                      <div className="text-foreground">
                        {h.fromStage ? `${h.fromStage.name} → ` : ""}
                        <span className="font-semibold">{h.toStage.name}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {h.movedBy.name} · {formatShortDate(h.createdAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-canvas/40 px-7 py-4">
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={remove}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {canEdit && (
                <Button size="sm" onClick={save} disabled={isPending} className="dark:glow-ring">
                  <Save className="h-3.5 w-3.5" />
                  {isPending ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StageNoteEditorProps {
  dealId: string;
  note: StageNoteDTO;
  disabled?: boolean;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  canDelete?: boolean;
  onUpdated?: (deal: DealDTO) => void;
}

type SaveState = "idle" | "saving" | "saved";

function StageNoteEditor({
  dealId,
  note,
  disabled,
  autoFocus,
  inputRef,
  canDelete,
  onUpdated,
}: StageNoteEditorProps) {
  const upsertDeal = usePipelineStore((s) => s.upsertDeal);
  const [text, setText] = useState(note.text);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastSavedRef = useRef(note.text);

  useEffect(() => {
    if (note.text !== lastSavedRef.current) {
      setText(note.text);
      lastSavedRef.current = note.text;
    }
  }, [note.text]);

  async function save() {
    const next = text;
    if (next === lastSavedRef.current) return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/deals/${dealId}/notes/${note.stageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: next }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Save failed");
      const j = await res.json();
      lastSavedRef.current = next;
      upsertDeal(j.deal);
      onUpdated?.(j.deal);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1100);
    } catch (err) {
      setSaveState("idle");
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    }
  }

  async function clearText() {
    if (!canDelete) return;
    if (!confirm(`Delete the ${note.stage.name} stage description? This removes the entire box.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/deals/${dealId}/notes/${note.stageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      const j = await res.json();
      upsertDeal(j.deal);
      onUpdated?.(j.deal);
      toast.success(`${note.stage.name} description removed`);
    } catch {
      toast.error("Could not remove description");
    }
  }

  const color = note.stage.color;

  return (
    <div
      className="rounded-xl border bg-canvas/30 p-3"
      style={{ borderColor: `${color}28` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
          />
          {note.stage.name} stage description
        </span>
        <div className="flex items-center gap-2">
          <SaveIndicator state={saveState} />
          {canDelete && (
            <button
              type="button"
              onClick={clearText}
              className="rounded p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete description"
              title="Delete this description"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        placeholder={`What's the status while in ${note.stage.name.toLowerCase()} stage?`}
        rows={3}
        disabled={disabled}
        autoFocus={autoFocus}
        className="scrollbar-thin w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand)/0.25)]"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Saving
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.16em] text-success">
        <Check className="h-2.5 w-2.5" />
        Saved
      </span>
    );
  }
  return null;
}

function RepeaterSection({
  label,
  icon: Icon,
  items,
  onAdd,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    key: string;
    value: string;
    onChange: (v: string) => void;
    onRemove: () => void;
    placeholder?: string;
    type?: string;
  }[];
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <SectionLabel>
        <span className="inline-flex items-center gap-1.5">
          <Icon className="h-3 w-3" />
          {label}
        </span>
      </SectionLabel>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.key} className="flex items-center gap-2">
            <Input
              type={it.type ?? "text"}
              value={it.value}
              placeholder={it.placeholder}
              onChange={(e) => it.onChange(e.target.value)}
              disabled={disabled}
              className="h-9"
            />
            {!disabled && (
              <button
                type="button"
                onClick={it.onRemove}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={`Remove ${label.toLowerCase()}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <Button variant="outline" size="sm" onClick={onAdd} className="h-8 w-full text-xs">
            <Plus className="h-3 w-3" /> Add
          </Button>
        )}
        {items.length === 0 && disabled && (
          <div className="text-xs text-muted-foreground">None</div>
        )}
      </div>
    </div>
  );
}
