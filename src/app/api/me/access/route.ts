import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getResourceAccess } from "@/lib/permissions";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  const access = await getResourceAccess(user.id, user.role);
  return NextResponse.json({ access });
}
