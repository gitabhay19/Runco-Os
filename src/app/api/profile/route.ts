import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  designation: z.string().max(120).nullable().optional(),
  department: z.string().max(120).nullable().optional(),
  employeeId: z.string().max(40).nullable().optional(),
  employmentType: z.string().max(40).nullable().optional(),
  joiningDate: z.string().datetime().nullable().optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function GET() {
  let session;
  try {
    session = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      designation: true,
      department: true,
      employeeId: true,
      employmentType: true,
      joiningDate: true,
      avatarColor: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [dealCount, openTasks, doneTasks] = await Promise.all([
    prisma.dealAssignee.count({ where: { userId: user.id } }),
    prisma.task.count({ where: { assigneeId: user.id, NOT: { status: "DONE" } } }),
    prisma.task.count({ where: { assigneeId: user.id, status: "DONE" } }),
  ]);

  return NextResponse.json({
    user: {
      ...user,
      joiningDate: user.joiningDate?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    stats: { dealCount, openTasks, doneTasks },
  });
}

export async function PATCH(req: Request) {
  let session;
  try {
    session = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const user = await prisma.user.update({
    where: { id: session.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.designation !== undefined && { designation: data.designation ?? null }),
      ...(data.department !== undefined && { department: data.department ?? null }),
      ...(data.employeeId !== undefined && { employeeId: data.employeeId ?? null }),
      ...(data.employmentType !== undefined && { employmentType: data.employmentType ?? null }),
      ...(data.joiningDate !== undefined && {
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
      }),
      ...(data.avatarColor !== undefined && { avatarColor: data.avatarColor }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      designation: true,
      department: true,
      employeeId: true,
      employmentType: true,
      joiningDate: true,
      avatarColor: true,
    },
  });

  await logActivity({
    userId: session.id,
    entityType: "user",
    entityId: session.id,
    action: "profile_updated",
  });

  return NextResponse.json({
    user: { ...user, joiningDate: user.joiningDate?.toISOString() ?? null },
  });
}
