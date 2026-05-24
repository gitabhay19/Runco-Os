import { Topbar } from "@/components/app-shell/topbar";
import { TasksView } from "@/components/tasks/tasks-view";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { TaskDTO, UserLite, TaskPriority, TaskStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireUser();

  const where =
    user.role === "ADMIN"
      ? {}
      : { OR: [{ assigneeId: user.id }, { createdById: user.id }] };

  const [tasksRaw, usersRaw] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            avatarColor: true,
            role: true,
          },
        },
        createdBy: { select: { id: true, name: true, email: true, avatarColor: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        avatarColor: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const tasks: TaskDTO[] = tasksRaw.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    dueDate: t.dueDate?.toISOString() ?? null,
    priority: t.priority as TaskPriority,
    status: t.status as TaskStatus,
    assignee: {
      id: t.assignee.id,
      name: t.assignee.name,
      email: t.assignee.email,
      role: t.assignee.role as "ADMIN" | "USER",
      designation: t.assignee.designation,
      avatarColor: t.assignee.avatarColor,
    },
    createdBy: {
      id: t.createdBy.id,
      name: t.createdBy.name,
      email: t.createdBy.email,
      avatarColor: t.createdBy.avatarColor ?? null,
    },
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const users: UserLite[] = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as "ADMIN" | "USER",
    designation: u.designation,
    avatarColor: u.avatarColor,
  }));

  const currentUser: UserLite =
    users.find((u) => u.id === user.id) ?? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor ?? null,
    };

  return (
    <>
      <Topbar title="Tasks" subtitle={user.role === "ADMIN" ? "All workspace tasks" : "Your tasks"} />
      <TasksView initialTasks={tasks} users={users} currentUser={currentUser} />
    </>
  );
}
