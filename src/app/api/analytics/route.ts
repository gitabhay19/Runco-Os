import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { visibilityWhere } from "@/lib/deals";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const dealVisibility = visibilityWhere(user);
  const taskVisibility =
    user.role === "ADMIN" ? {} : { OR: [{ assigneeId: user.id }, { createdById: user.id }] };

  const [stages, deals, tasks, users] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: "asc" } }),
    prisma.deal.findMany({
      where: dealVisibility,
      select: {
        id: true,
        stageId: true,
        followUpDate: true,
        createdAt: true,
        assignees: { select: { userId: true } },
      },
    }),
    prisma.task.findMany({
      where: taskVisibility,
      select: {
        id: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, role: true, avatarColor: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Stage distribution
  const stageDistribution = stages.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    count: deals.filter((d) => d.stageId === s.id).length,
  }));

  // Task status distribution
  const taskByStatus = {
    TODO: tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    BLOCKED: tasks.filter((t) => t.status === "BLOCKED").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };

  const taskByPriority = {
    LOW: tasks.filter((t) => t.priority === "LOW").length,
    MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
    HIGH: tasks.filter((t) => t.priority === "HIGH").length,
    URGENT: tasks.filter((t) => t.priority === "URGENT").length,
  };

  // Per-user breakdown (admin sees everyone; non-admin sees only themselves)
  const visibleUsers = user.role === "ADMIN" ? users : users.filter((u) => u.id === user.id);
  const userBreakdown = visibleUsers.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    avatarColor: u.avatarColor,
    deals: deals.filter((d) => d.assignees.some((a) => a.userId === u.id)).length,
    openTasks: tasks.filter((t) => t.assigneeId === u.id && t.status !== "DONE").length,
    doneTasks: tasks.filter((t) => t.assigneeId === u.id && t.status === "DONE").length,
  }));

  // Counters
  const overdueFollowUps = deals.filter(
    (d) => d.followUpDate && new Date(d.followUpDate).getTime() < Date.now()
  ).length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.status !== "DONE" && new Date(t.dueDate).getTime() < Date.now()
  ).length;

  // Last 14 days, deals created and tasks completed
  const days: { date: string; dealsCreated: number; tasksDone: number }[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const dealsCreated = deals.filter(
      (d) => new Date(d.createdAt) >= start && new Date(d.createdAt) < end
    ).length;
    // Use task.createdAt as a proxy for "completed" (approx). Better: a separate completedAt field.
    const tasksDone = tasks.filter(
      (t) =>
        t.status === "DONE" && new Date(t.createdAt) >= start && new Date(t.createdAt) < end
    ).length;
    days.push({
      date: start.toISOString().slice(0, 10),
      dealsCreated,
      tasksDone,
    });
  }

  return NextResponse.json({
    summary: {
      totalDeals: deals.length,
      totalTasks: tasks.length,
      overdueFollowUps,
      overdueTasks,
    },
    stageDistribution,
    taskByStatus,
    taskByPriority,
    userBreakdown,
    timeline: days,
  });
}
