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
    },
  });

  const initialUsers = usersRaw.map((u) => ({
    ...u,
    role: u.role as "ADMIN" | "USER",
    joiningDate: u.joiningDate?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <>
      <Topbar title="Admin" subtitle="Workspace administration" />
      <AdminShell initialUsers={initialUsers} currentUserId={user.id} />
    </>
  );
}
