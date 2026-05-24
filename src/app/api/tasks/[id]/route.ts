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

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(4000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  assigneeId: z.string().min(1).optional(),
});

function canAccessTask(
  user: { id: string; role: "ADMIN" | "USER" },
  task: { assigneeId: string; createdById: string }
): boolean {
  if (user.role === "ADMIN") return true;
  return task.assigneeId === user.id || task.createdById === user.id;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const task = await prisma.task.findUnique({ where: { id: params.id }, include: taskInclude });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessTask(user, task)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ task });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const existing = await prisma.task.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessTask(user, existing)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Non-admins can only change `status` — they can't reassign or rename tasks.
  if (user.role !== "ADMIN") {
    const allowedKeys: (keyof typeof data)[] = ["status"];
    const incoming = Object.keys(data) as (keyof typeof data)[];
    const offending = incoming.filter((k) => !allowedKeys.includes(k));
    if (offending.length > 0) {
      return NextResponse.json({ error: "Users can only update status" }, { status: 403 });
    }
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
    },
    include: taskInclude,
  });

  await logActivity({
    userId: user.id,
    entityType: "task",
    entityId: task.id,
    action: "updated",
    metadata: data as Record<string, unknown>,
  });

  broadcast({
    type: "task:updated",
    task: taskRowToDTO(task),
    originUserId: user.id,
  });

  // Notify reassignment.
  if (data.assigneeId && data.assigneeId !== existing.assigneeId) {
    await notify({
      recipientIds: [data.assigneeId],
      actorId: user.id,
      title: `Reassigned: ${task.title}`,
      body: `${user.name} assigned this task to you.`,
      link: "/tasks",
      kind: "task_assigned",
      entityType: "task",
      entityId: task.id,
    });
  }

  // Notify creator (and assignee if different from actor) when status changes.
  if (data.status && data.status !== existing.status) {
    const recipients = [existing.createdById, existing.assigneeId];
    await notify({
      recipientIds: recipients,
      actorId: user.id,
      title: `${task.title} → ${data.status.replace("_", " ").toLowerCase()}`,
      body: `${user.name} updated the status.`,
      link: "/tasks",
      kind: "task_status_changed",
      entityType: "task",
      entityId: task.id,
    });
  }

  return NextResponse.json({ task });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const existing = await prisma.task.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only admins or the creator can delete.
  if (user.role !== "ADMIN" && existing.createdById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.task.delete({ where: { id: existing.id } });
  await logActivity({
    userId: user.id,
    entityType: "task",
    entityId: existing.id,
    action: "deleted",
    metadata: { title: existing.title },
  });

  broadcast({
    type: "task:deleted",
    taskId: existing.id,
    originUserId: user.id,
  });

  return NextResponse.json({ ok: true });
}
