"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DealDTO, StageDTO, UserLite } from "@/lib/types";
import { cn, getInitials } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStageId: string;
  stages: StageDTO[];
  users: UserLite[];
  currentUserId: string;
  onCreated: (deal: DealDTO) => void;
}

export function CreateDealDialog({
  open,
  onOpenChange,
  defaultStageId,
  stages,
  users,
  currentUserId,
  onCreated,
}: Props) {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [designation, setDesignation] = useState("");
  const [description, setDescription] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [stageId, setStageId] = useState(defaultStageId);
  const [phones, setPhones] = useState<string[]>([""]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([currentUserId]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setCompanyName("");
      setContactName("");
      setDesignation("");
      setDescription("");
      setFollowUpDate("");
      setStageId(defaultStageId);
      setPhones([""]);
      setEmails([""]);
      setAssigneeIds([currentUserId]);
    }
  }, [open, defaultStageId, currentUserId]);

  function submit() {
    if (!companyName.trim() || !contactName.trim()) {
      toast.error("Company and contact name are required.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          designation: designation.trim() || undefined,
          description: description.trim() || undefined,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
          stageId,
          phones: phones
            .map((p) => p.trim())
            .filter(Boolean)
            .map((number) => ({ number })),
          emails: emails
            .map((e) => e.trim())
            .filter(Boolean)
            .map((address) => ({ address })),
          assigneeIds,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Failed to create deal");
        return;
      }
      const j = await res.json();
      toast.success(`Created ${j.deal.companyName}`);
      onCreated(j.deal);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] overflow-hidden rounded-3xl">
        <DialogHeader>
          <DialogTitle>New deal</DialogTitle>
          <DialogDescription>Add a deal to the pipeline.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Company *
            </Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Contact name *
            </Label>
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Designation
            </Label>
            <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Stage
            </Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Follow-up date
            </Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Description
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What's this deal about?"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <RepeaterField
            label="Phone numbers"
            items={phones}
            onChange={setPhones}
            placeholder="+1 415 555 0123"
          />
          <RepeaterField
            label="Email addresses"
            items={emails}
            onChange={setEmails}
            placeholder="name@company.com"
            type="email"
          />
        </div>

        <div>
          <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Assignees
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {users.map((u) => {
              const selected = assigneeIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() =>
                    setAssigneeIds((ids) =>
                      ids.includes(u.id) ? ids.filter((i) => i !== u.id) : [...ids, u.id]
                    )
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition-all",
                    selected
                      ? "border-[hsl(var(--brand)/0.6)] bg-[hsl(var(--brand)/0.1)] text-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending} className="dark:glow-ring">
            {isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RepeaterField({
  label,
  items,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type={type}
              value={v}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="h-9"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full text-xs"
          onClick={() => onChange([...items, ""])}
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
    </div>
  );
}
