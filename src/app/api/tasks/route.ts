import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { broadcast } from "@/lib/realtime";
import { taskRowToDTO } from "@/lib/dto";
import { notify } from "@/lib/notifications";

const taskInclude = {
  assignee: {
    select: { id: true, name: true, email: true, designation: true, avatarColor: true, role: true },
  },
  createdBy: {
    select: { id: true, name: true, email: true, avatarColor: true },
  },
} as const;

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  // Admins see all tasks. Users only see tasks assigned to them or created by them.
  const where =
    user.role === "ADMIN"
      ? {}
      : { OR: [{ assigneeId: user.id }, { createdById: user.id }] };

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

const createSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(4000).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).default("TODO"),
  assigneeId: z.string().min(1),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Only admins can assign tasks to other users.
  if (user.role !== "ADMIN" && data.assigneeId !== user.id) {
    return NextResponse.json({ error: "Only admins can assign tasks to other users" }, { status: 403 });
  }

  const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
  if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 404 });

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority,
      status: data.status,
      assigneeId: data.assigneeId,
      createdById: user.id,
    },
    include: taskInclude,
  });

  await logActivity({
    userId: user.id,
    entityType: "task",
    entityId: task.id,
    action: "created",
    metadata: { title: task.title, assigneeId: task.assigneeId },
  });

  broadcast({
    type: "task:created",
    task: taskRowToDTO(task),
    originUserId: user.id,
  });

  await notify({
    recipientIds: [task.assigneeId],
    actorId: user.id,
    title: `New task: ${task.title}`,
    body: `${user.name} assigned a task to you.`,
    link: "/tasks",
    kind: "task_assigned",
    entityType: "task",
    entityId: task.id,
  });

  return NextResponse.json({ task });
}
