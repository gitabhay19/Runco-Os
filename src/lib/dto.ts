import "server-only";
import type { DealDTO, TaskDTO } from "@/lib/types";

// Loose row type — we accept whatever Prisma include gives us.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any;

export function dealRowToDTO(d: AnyRow): DealDTO {
  return {
    id: d.id,
    companyName: d.companyName,
    contactName: d.contactName,
    designation: d.designation,
    description: d.description,
    website: d.website ?? null,
    followUpDate: d.followUpDate?.toISOString() ?? null,
    value: d.value ?? null,
    currency: d.currency,
    activityStatus: d.activityStatus as DealDTO["activityStatus"],
    position: d.position,
    stageId: d.stageId,
    createdById: d.createdById,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    phones: d.phones.map((p: AnyRow) => ({ id: p.id, number: p.number, label: p.label })),
    emails: d.emails.map((e: AnyRow) => ({ id: e.id, address: e.address, label: e.label })),
    assignees: d.assignees.map((a: AnyRow) => ({
      user: {
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        role: a.user.role as "ADMIN" | "USER",
        designation: a.user.designation,
        avatarColor: a.user.avatarColor,
      },
    })),
    stage: {
      id: d.stage.id,
      name: d.stage.name,
      slug: d.stage.slug,
      description: d.stage.description,
      order: d.stage.order,
      color: d.stage.color,
      isTerminal: d.stage.isTerminal,
    },
    createdBy: {
      id: d.createdBy.id,
      name: d.createdBy.name,
      email: d.createdBy.email,
      role: d.createdBy.role as "ADMIN" | "USER",
      designation: d.createdBy.designation,
      avatarColor: d.createdBy.avatarColor,
    },
    stageNotes: (d.stageNotes ?? []).map((n: AnyRow) => ({
      id: n.id,
      stageId: n.stageId,
      text: n.text,
      stage: {
        id: n.stage.id,
        name: n.stage.name,
        color: n.stage.color,
        order: n.stage.order,
      },
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  };
}

export function taskRowToDTO(t: AnyRow): TaskDTO {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate?.toISOString() ?? null,
    priority: t.priority as TaskDTO["priority"],
    status: t.status as TaskDTO["status"],
    assignee: {
      id: t.assignee.id,
      name: t.assignee.name,
      email: t.assignee.email,
      role: t.assignee.role as "ADMIN" | "USER",
      designation: t.assignee.designation,
      avatarColor: t.assignee.avatarColor,
    },
    createdBy: {
      id: t.createdBy.id,
      name: t.createdBy.name,
      email: t.createdBy.email,
      avatarColor: t.createdBy.avatarColor ?? null,
    },
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
