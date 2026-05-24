import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canEditDeal, dealInclude } from "@/lib/deals";
import { logActivity } from "@/lib/activity";
import { broadcast } from "@/lib/realtime";
import { dealRowToDTO } from "@/lib/dto";

const bodySchema = z.object({
  text: z.string().max(4000),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string; stageId: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: { assignees: true },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditDeal(user, deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stage = await prisma.stage.findUnique({ where: { id: params.stageId } });
  if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.stageNote.upsert({
    where: { dealId_stageId: { dealId: deal.id, stageId: stage.id } },
    update: { text: parsed.data.text },
    create: { dealId: deal.id, stageId: stage.id, text: parsed.data.text },
  });

  const updated = await prisma.deal.findUniqueOrThrow({
    where: { id: deal.id },
    include: dealInclude,
  });

  await logActivity({
    userId: user.id,
    entityType: "deal",
    entityId: deal.id,
    action: "stage_note_updated",
    metadata: { stageId: stage.id },
  });

  broadcast({
    type: "deal:updated",
    deal: dealRowToDTO(updated),
    originUserId: user.id,
  });

  return NextResponse.json({ deal: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; stageId: string } }
) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: { assignees: true },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditDeal(user, deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stage = await prisma.stage.findUnique({ where: { id: params.stageId } });
  if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  await prisma.stageNote.deleteMany({
    where: { dealId: deal.id, stageId: stage.id },
  });

  const updated = await prisma.deal.findUniqueOrThrow({
    where: { id: deal.id },
    include: dealInclude,
  });

  await logActivity({
    userId: user.id,
    entityType: "deal",
    entityId: deal.id,
    action: "stage_note_deleted",
    metadata: { stageId: stage.id },
  });

  broadcast({
    type: "deal:updated",
    deal: dealRowToDTO(updated),
    originUserId: user.id,
  });

  return NextResponse.json({ deal: updated });
}
