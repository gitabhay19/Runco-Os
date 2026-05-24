import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canEditDeal, dealInclude } from "@/lib/deals";
import { logActivity } from "@/lib/activity";
import { broadcast } from "@/lib/realtime";
import { dealRowToDTO } from "@/lib/dto";

const bodySchema = z.object({
  stageId: z.string().min(1),
});

/**
 * Create (or no-op if exists) a stage note for the given deal+stage.
 * Returns the updated deal so the client can refresh its state.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
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

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const stage = await prisma.stage.findUnique({ where: { id: parsed.data.stageId } });
  if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  await prisma.stageNote.upsert({
    where: { dealId_stageId: { dealId: deal.id, stageId: stage.id } },
    update: {},
    create: { dealId: deal.id, stageId: stage.id },
  });

  const updated = await prisma.deal.findUniqueOrThrow({
    where: { id: deal.id },
    include: dealInclude,
  });

  await logActivity({
    userId: user.id,
    entityType: "deal",
    entityId: deal.id,
    action: "stage_note_added",
    metadata: { stageId: stage.id },
  });

  broadcast({
    type: "deal:updated",
    deal: dealRowToDTO(updated),
    originUserId: user.id,
  });

  return NextResponse.json({ deal: updated });
}
