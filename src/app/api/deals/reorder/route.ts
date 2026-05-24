import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canEditDeal, dealInclude } from "@/lib/deals";
import { logActivity } from "@/lib/activity";
import { broadcast } from "@/lib/realtime";
import { dealRowToDTO } from "@/lib/dto";
import { notify } from "@/lib/notifications";

const reorderSchema = z.object({
  dealId: z.string().min(1),
  toStageId: z.string().min(1),
  toIndex: z.number().int().min(0),
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
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { dealId, toStageId, toIndex } = parsed.data;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { assignees: true },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditDeal(user, deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const toStage = await prisma.stage.findUnique({ where: { id: toStageId } });
  if (!toStage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  const fromStageId = deal.stageId;
  const stageChanged = fromStageId !== toStageId;

  await prisma.$transaction(async (tx) => {
    // Pull the moving deal out of its current column by shifting siblings up
    if (stageChanged) {
      await tx.deal.updateMany({
        where: { stageId: fromStageId, position: { gt: deal.position } },
        data: { position: { decrement: 1 } },
      });

      // Make room in destination column
      await tx.deal.updateMany({
        where: { stageId: toStageId, position: { gte: toIndex } },
        data: { position: { increment: 1 } },
      });
    } else {
      // Same column reorder
      if (toIndex < deal.position) {
        await tx.deal.updateMany({
          where: {
            stageId: toStageId,
            position: { gte: toIndex, lt: deal.position },
          },
          data: { position: { increment: 1 } },
        });
      } else if (toIndex > deal.position) {
        await tx.deal.updateMany({
          where: {
            stageId: toStageId,
            position: { gt: deal.position, lte: toIndex },
          },
          data: { position: { decrement: 1 } },
        });
      }
    }

    await tx.deal.update({
      where: { id: deal.id },
      data: { stageId: toStageId, position: toIndex },
    });

    if (stageChanged) {
      await tx.stageHistory.create({
        data: {
          dealId: deal.id,
          fromStageId,
          toStageId,
          movedById: user.id,
        },
      });

      // Ensure a stage note exists for the destination stage so the user
      // can record stage-specific context. Existing notes are kept.
      await tx.stageNote.upsert({
        where: { dealId_stageId: { dealId: deal.id, stageId: toStageId } },
        update: {},
        create: { dealId: deal.id, stageId: toStageId },
      });
    }
  });

  if (stageChanged) {
    await logActivity({
      userId: user.id,
      entityType: "deal",
      entityId: deal.id,
      action: "stage_changed",
      metadata: { fromStageId, toStageId },
    });
  }

  // Re-fetch the deal with full include so subscribers receive a fresh DTO.
  const fresh = await prisma.deal.findUniqueOrThrow({
    where: { id: deal.id },
    include: dealInclude,
  });

  broadcast({
    type: "deal:moved",
    deal: dealRowToDTO(fresh),
    originUserId: user.id,
  });

  if (stageChanged) {
    const recipientIds = fresh.assignees.map((a) => a.user.id);
    if (recipientIds.length > 0) {
      await notify({
        recipientIds,
        actorId: user.id,
        title: `${fresh.companyName} moved`,
        body: `Now in ${fresh.stage.name}.`,
        link: "/pipeline",
        kind: "deal_moved",
        entityType: "deal",
        entityId: fresh.id,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
