import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { visibilityWhere } from "@/lib/deals";

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
    select: { id: true },
  });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const history = await prisma.stageHistory.findMany({
    where: { dealId: deal.id },
    orderBy: { createdAt: "desc" },
    include: {
      fromStage: true,
      toStage: true,
      movedBy: { select: { id: true, name: true, email: true, avatarColor: true } },
    },
  });

  return NextResponse.json({ history });
}
