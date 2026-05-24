import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const n = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!n || n.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (n.readAt) return NextResponse.json({ ok: true });

  await prisma.notification.update({
    where: { id: n.id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
