import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canEditDeal, dealInclude, visibilityWhere } from "@/lib/deals";
import { logActivity } from "@/lib/activity";
import { broadcast } from "@/lib/realtime";
import { dealRowToDTO } from "@/lib/dto";
import { notify } from "@/lib/notifications";

const updateSchema = z.object({
  companyName: z.string().min(1).max(120).optional(),
  contactName: z.string().min(1).max(120).optional(),
  designation: z.string().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  followUpDate: z.string().datetime().nullable().optional(),
  value: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).optional(),
  activityStatus: z.enum(["ACTIVE", "IDLE", "STALE"]).optional(),
  phones: z
    .array(
      z.object({
        id: z.string().optional(),
        number: z.string().min(1).max(40),
        label: z.string().max(40).nullable().optional(),
      })
    )
    .optional(),
  emails: z
    .array(
      z.object({
        id: z.string().optional(),
        address: z.string().email().max(160),
        label: z.string().max(40).nullable().optional(),
      })
    )
    .optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const deal = await prisma.deal.findFirst({
    where: { id: params.id, ...visibilityWhere(user) },
    include: dealInclude,
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deal });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const existing = await prisma.deal.findUnique({
    where: { id: params.id },
    include: { assignees: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditDeal(user, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Only admins can change the assignee list to other users
  let nextAssigneeIds: string[] | undefined = data.assigneeIds;
  if (nextAssigneeIds && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can change assignees" }, { status: 403 });
  }

  const deal = await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: existing.id },
      data: {
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.contactName !== undefined && { contactName: data.contactName }),
        ...(data.designation !== undefined && { designation: data.designation ?? null }),
        ...(data.description !== undefined && { description: data.description ?? null }),
        ...(data.website !== undefined && {
          website: data.website && data.website.trim() ? data.website.trim() : null,
        }),
        ...(data.followUpDate !== undefined && {
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.activityStatus !== undefined && { activityStatus: data.activityStatus }),
      },
    });

    if (data.phones) {
      await tx.phone.deleteMany({ where: { dealId: existing.id } });
      if (data.phones.length > 0) {
        await tx.phone.createMany({
          data: data.phones.map((p) => ({
            dealId: existing.id,
            number: p.number,
            label: p.label ?? null,
          })),
        });
      }
    }

    if (data.emails) {
      await tx.email.deleteMany({ where: { dealId: existing.id } });
      if (data.emails.length > 0) {
        await tx.email.createMany({
          data: data.emails.map((e) => ({
            dealId: existing.id,
            address: e.address,
            label: e.label ?? null,
          })),
        });
      }
    }

    if (nextAssigneeIds) {
      await tx.dealAssignee.deleteMany({ where: { dealId: existing.id } });
      if (nextAssigneeIds.length > 0) {
        await tx.dealAssignee.createMany({
          data: nextAssigneeIds.map((userId) => ({ dealId: existing.id, userId })),
        });
      }
    }

    return tx.deal.findUniqueOrThrow({
      where: { id: existing.id },
      include: dealInclude,
    });
  });

  await logActivity({
    userId: user.id,
    entityType: "deal",
    entityId: deal.id,
    action: "updated",
  });

  broadcast({
    type: "deal:updated",
    deal: dealRowToDTO(deal),
    originUserId: user.id,
  });

  // Notify newly added assignees.
  if (nextAssigneeIds) {
    const previousIds = new Set(existing.assignees.map((a) => a.userId));
    const added = nextAssigneeIds.filter((id) => !previousIds.has(id));
    if (added.length > 0) {
      await notify({
        recipientIds: added,
        actorId: user.id,
        title: `Assigned: ${deal.companyName}`,
        body: `${user.name} added you to this deal.`,
        link: "/pipeline",
        kind: "deal_assigned",
        entityType: "deal",
        entityId: deal.id,
      });
    }
  }

  return NextResponse.json({ deal });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const existing = await prisma.deal.findUnique({
    where: { id: params.id },
    include: { assignees: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditDeal(user, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.deal.delete({ where: { id: existing.id } });
  await logActivity({
    userId: user.id,
    entityType: "deal",
    entityId: existing.id,
    action: "deleted",
    metadata: { companyName: existing.companyName },
  });

  broadcast({
    type: "deal:deleted",
    dealId: existing.id,
    originUserId: user.id,
  });

  return NextResponse.json({ ok: true });
}
