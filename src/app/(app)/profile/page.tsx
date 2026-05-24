import { Topbar } from "@/components/app-shell/topbar";
import { ProfileView } from "@/components/profile/profile-view";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireUser();

  const userRow = await prisma.user.findUnique({
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
    },
  });
  if (!userRow) {
    return null;
  }

  const [dealCount, openTasks, doneTasks] = await Promise.all([
    prisma.dealAssignee.count({ where: { userId: session.id } }),
    prisma.task.count({ where: { assigneeId: session.id, NOT: { status: "DONE" } } }),
    prisma.task.count({ where: { assigneeId: session.id, status: "DONE" } }),
  ]);

  const user = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role as "ADMIN" | "USER",
    designation: userRow.designation,
    department: userRow.department,
    employeeId: userRow.employeeId,
    employmentType: userRow.employmentType,
    joiningDate: userRow.joiningDate?.toISOString() ?? null,
    avatarColor: userRow.avatarColor,
  };

  return (
    <>
      <Topbar title="Profile" subtitle="Personal & employment details" />
      <ProfileView
        user={user}
        stats={{ dealCount, openTasks, doneTasks }}
      />
    </>
  );
}
