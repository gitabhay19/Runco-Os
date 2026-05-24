import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { dealInclude, visibilityWhere } from "@/lib/deals";
import { logActivity } from "@/lib/activity";
import { broadcast } from "@/lib/realtime";
import { dealRowToDTO } from "@/lib/dto";
import { notify } from "@/lib/notifications";
import { canViewResource } from "@/lib/permissions";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  if (!(await canViewResource(user.id, user.role, "pipeline"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deals = await prisma.deal.findMany({
    where: visibilityWhere(user),
    include: dealInclude,
    orderBy: [{ stageId: "asc" }, { position: "asc" }],
  });

  return NextResponse.json({ deals });
}

const createSchema = z.object({
  companyName: z.string().min(1).max(120),
  contactName: z.string().min(1).max(120),
  designation: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  followUpDate: z.string().datetime().nullable().optional(),
  value: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).optional(),
  stageId: z.string().min(1),
  phones: z.array(z.object({ number: z.string().min(1).max(40), label: z.string().max(40).optional() })).default([]),
  emails: z.array(z.object({ address: z.string().email().max(160), label: z.string().max(40).optional() })).default([]),
  assigneeIds: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const stage = await prisma.stage.findUnique({ where: { id: data.stageId } });
  if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  // Place at end of column
  const last = await prisma.deal.findFirst({
    where: { stageId: stage.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = (last?.position ?? -1) + 1;

  // Default-assign creator if no assignees provided
  const assigneeIds = data.assigneeIds.length > 0 ? data.assigneeIds : [user.id];

  const deal = await prisma.deal.create({
    data: {
      companyName: data.companyName,
      contactName: data.contactName,
      designation: data.designation,
      description: data.description,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      value: data.value ?? null,
      currency: data.currency ?? "USD",
      stageId: stage.id,
      position,
      createdById: user.id,
      phones: { create: data.phones },
      emails: { create: data.emails },
      assignees: { create: assigneeIds.map((userId) => ({ userId })) },
      stageNotes: { create: { stageId: stage.id } },
    },
    include: dealInclude,
  });

  await logActivity({
    userId: user.id,
    entityType: "deal",
    entityId: deal.id,
    action: "created",
    metadata: { stageId: stage.id, companyName: deal.companyName },
  });

  broadcast({
    type: "deal:created",
    deal: dealRowToDTO(deal),
    originUserId: user.id,
  });

  // Notify any assignees who weren't the creator.
  await notify({
    recipientIds: assigneeIds,
    actorId: user.id,
    title: `Assigned: ${deal.companyName}`,
    body: `${user.name} added a new deal to ${stage.name}.`,
    link: "/pipeline",
    kind: "deal_assigned",
    entityType: "deal",
    entityId: deal.id,
  });

  return NextResponse.json({ deal });
}
