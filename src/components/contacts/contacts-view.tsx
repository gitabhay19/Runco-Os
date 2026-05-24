"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Mail,
  Phone,
  Building2,
  ChevronRight,
  Users,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DealDTO } from "@/lib/types";
import { cn, formatShortDate, getInitials } from "@/lib/utils";

interface Contact {
  key: string;
  companyName: string;
  contactName: string;
  designation: string | null;
  emails: string[];
  phones: string[];
  lastUpdatedAt: string;
  latestStage: { id: string; name: string; color: string };
  dealIds: string[];
}

export function ContactsView() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<DealDTO[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Contact | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => {
        setContacts(d.contacts ?? []);
        setDeals(d.deals ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Build the unique stage list from current contacts (sorted by stage order
  // by deriving from the deals array which preserves stage info per contact).
  const stages = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; order: number }>();
    for (const d of deals) {
      if (!map.has(d.stage.id)) {
        map.set(d.stage.id, {
          id: d.stage.id,
          name: d.stage.name,
          color: d.stage.color,
          order: d.stage.order,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.order - b.order);
  }, [deals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (stageFilter !== "all" && c.latestStage.id !== stageFilter) return false;
      if (!q) return true;
      const hay = [
        c.companyName,
        c.contactName,
        c.designation ?? "",
        ...c.emails,
        ...c.phones,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, search, stageFilter]);

  const dealsForSelected = useMemo(() => {
    if (!selected) return [];
    const ids = new Set(selected.dealIds);
    return deals.filter((d) => ids.has(d.id));
  }, [deals, selected]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(var(--brand)/0.06)] to-transparent"
        aria-hidden
      />

      <div className="scrollbar-thin relative h-full overflow-y-auto px-6 py-6 md:px-10">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts by name, company, email, phone…"
                className="h-10 bg-surface pl-9 text-[14px]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Stage
            </div>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-10 w-[200px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {stageFilter !== "all" && (
              <button
                type="button"
                onClick={() => setStageFilter("all")}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}

            <div className="ml-auto rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-muted-foreground">
              <span className="text-foreground">{filtered.length}</span>
              {filtered.length !== contacts.length && (
                <span className="text-muted-foreground/60"> / {contacts.length}</span>
              )}{" "}
              contact{filtered.length === 1 ? "" : "s"}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground">
              <Users className="mr-2 h-4 w-4 animate-pulse" />
              Loading contacts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-10 py-16 text-center">
              <Users className="mx-auto h-6 w-6 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No contacts match this filter.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <ul className="divide-y divide-border">
                {filtered.map((c) => (
                  <li key={c.key}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-accent/40"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold"
                        style={{
                          borderColor: `${c.latestStage.color}40`,
                          backgroundColor: `${c.latestStage.color}14`,
                          color: c.latestStage.color,
                        }}
                      >
                        {getInitials(c.companyName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-[14px] font-semibold text-foreground">
                            {c.companyName}
                          </span>
                          <span className="truncate text-[12.5px] text-muted-foreground">
                            · {c.contactName}
                          </span>
                          {c.designation && (
                            <span className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                              · {c.designation}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
                          {c.emails[0] && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{c.emails[0]}</span>
                            </span>
                          )}
                          {c.phones[0] && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span className="tabular-nums">{c.phones[0]}</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {c.dealIds.length} deal{c.dealIds.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                          style={{
                            borderColor: `${c.latestStage.color}40`,
                            backgroundColor: `${c.latestStage.color}10`,
                            color: c.latestStage.color,
                          }}
                        >
                          <span
                            className="h-1 w-1 rounded-full"
                            style={{ backgroundColor: c.latestStage.color }}
                          />
                          {c.latestStage.name}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <ContactDetailDialog
        contact={selected}
        deals={dealsForSelected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function ContactDetailDialog({
  contact,
  deals,
  onOpenChange,
}: {
  contact: Contact | null;
  deals: DealDTO[];
  onOpenChange: (open: boolean) => void;
}) {
  if (!contact) return null;

  return (
    <Dialog open={!!contact} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px] gap-0 overflow-hidden rounded-3xl border-border bg-surface p-0 shadow-2xl">
        <DialogHeader className="border-b border-border px-7 py-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border text-base font-bold"
              style={{
                borderColor: `${contact.latestStage.color}40`,
                backgroundColor: `${contact.latestStage.color}14`,
                color: contact.latestStage.color,
              }}
            >
              {getInitials(contact.companyName)}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-display text-[20px] font-bold tracking-[-0.02em]">
                {contact.contactName}
              </DialogTitle>
              <DialogDescription>
                <span className="truncate">
                  {contact.designation ? `${contact.designation} · ` : ""}
                  {contact.companyName}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="scrollbar-thin max-h-[68vh] space-y-5 overflow-y-auto px-7 py-6">
          {/* Contact methods */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Section title="Email addresses" icon={Mail}>
              {contact.emails.length === 0 ? (
                <Empty>No email on file</Empty>
              ) : (
                <ul className="space-y-1.5">
                  {contact.emails.map((e) => (
                    <li key={e} className="flex items-center justify-between gap-2 text-[13px]">
                      <a
                        href={`mailto:${e}`}
                        className="truncate text-foreground hover:underline"
                      >
                        {e}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Phone numbers" icon={Phone}>
              {contact.phones.length === 0 ? (
                <Empty>No phone on file</Empty>
              ) : (
                <ul className="space-y-1.5">
                  {contact.phones.map((p) => (
                    <li key={p} className="flex items-center justify-between gap-2 text-[13px]">
                      <a
                        href={`tel:${p.replace(/\s+/g, "")}`}
                        className="truncate tabular-nums text-foreground hover:underline"
                      >
                        {p}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {/* Related deals */}
          <Section title={`Related deals (${deals.length})`} icon={Building2}>
            {deals.length === 0 ? (
              <Empty>No deals linked.</Empty>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {deals.map((d) => (
                  <li
                    key={d.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40"
                    )}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: `${d.stage.color}40`,
                        backgroundColor: `${d.stage.color}14`,
                        color: d.stage.color,
                      }}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-foreground">
                        {d.companyName}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {d.contactName}
                        {d.followUpDate && (
                          <>
                            <span className="mx-1.5 text-muted-foreground/50">·</span>
                            Follow-up {formatShortDate(d.followUpDate)}
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        borderColor: `${d.stage.color}40`,
                        backgroundColor: `${d.stage.color}10`,
                        color: d.stage.color,
                      }}
                    >
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: d.stage.color }}
                      />
                      {d.stage.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-canvas/30 p-4">
      <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-muted-foreground">{children}</div>;
}
