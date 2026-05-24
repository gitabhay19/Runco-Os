import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const stages = await prisma.stage.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ stages });
}
