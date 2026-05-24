import { redirect } from "next/navigation";
import { Topbar } from "@/components/app-shell/topbar";
import { AdminShell } from "@/components/admin/admin-shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/pipeline");

  const usersRaw = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
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
      _count: { select: { assignedDeals: true, assignedTasks: true } },
      permissions: {
        where: { resource: { in: ["pipeline", "tasks", "contacts", "analytics"] } },
        select: { resource: true, canView: true },
      },
    },
  });

  const initialUsers = usersRaw.map((u) => {
    const access = { pipeline: true, tasks: true, contacts: true, analytics: true };
    for (const p of u.permissions) {
      if (p.resource in access) {
        access[p.resource as keyof typeof access] = p.canView;
      }
    }
    const { permissions: _omit, ...rest } = u;
    return {
      ...rest,
      role: u.role as "ADMIN" | "USER",
      joiningDate: u.joiningDate?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      access,
    };
  });

  return (
    <>
      <Topbar title="Admin" subtitle="Workspace administration" />
      <AdminShell initialUsers={initialUsers} currentUserId={user.id} />
    </>
  );
}
