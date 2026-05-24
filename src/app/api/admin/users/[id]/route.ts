import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  designation: z.string().max(120).nullable().optional(),
  department: z.string().max(120).nullable().optional(),
  employeeId: z.string().max(40).nullable().optional(),
  employmentType: z.string().max(40).nullable().optional(),
  joiningDate: z.string().datetime().nullable().optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  password: z.string().min(8).max(120).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Don't allow demoting the last admin (including yourself).
  if (data.role === "USER" && target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "At least one admin must remain in the workspace." },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, unknown> = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.role !== undefined && { role: data.role }),
    ...(data.designation !== undefined && { designation: data.designation ?? null }),
    ...(data.department !== undefined && { department: data.department ?? null }),
    ...(data.employeeId !== undefined && { employeeId: data.employeeId ?? null }),
    ...(data.employmentType !== undefined && { employmentType: data.employmentType ?? null }),
    ...(data.joiningDate !== undefined && {
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
    }),
    ...(data.avatarColor !== undefined && { avatarColor: data.avatarColor }),
  };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data: updateData,
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

  await logActivity({
    userId: admin.id,
    entityType: "user",
    entityId: user.id,
    action: data.password ? "user_password_reset" : "user_updated",
    metadata: { keys: Object.keys(data) },
  });

  if (data.password) {
    const loginUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const tpl = passwordResetEmail({
      name: user.name,
      email: user.email,
      password: data.password,
      loginUrl: `${loginUrl}/login`,
    });
    void sendEmail({ to: user.email, subject: tpl.subject, text: tpl.text, html: tpl.html });

    await notify({
      recipientIds: [user.id],
      actorId: admin.id,
      title: "Password reset",
      body: "An admin reset your password. Check your email for the new credentials.",
      link: "/profile",
      kind: "info",
      entityType: "user",
      entityId: user.id,
    });
  }

  return NextResponse.json({
    user: {
      ...user,
      joiningDate: user.joiningDate?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Don't let admins delete themselves or the last admin.
  if (target.id === admin.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }
  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "At least one admin must remain in the workspace." },
        { status: 400 }
      );
    }
  }

  // Cascade-safety: detach owned deals/tasks rather than failing.
  await prisma.$transaction(async (tx) => {
    await tx.dealAssignee.deleteMany({ where: { userId: target.id } });
    await tx.task.updateMany({
      where: { createdById: target.id },
      data: { createdById: admin.id },
    });
    await tx.task.deleteMany({ where: { assigneeId: target.id } });
    await tx.deal.updateMany({
      where: { createdById: target.id },
      data: { createdById: admin.id },
    });
    await tx.user.delete({ where: { id: target.id } });
  });

  await logActivity({
    userId: admin.id,
    entityType: "user",
    entityId: target.id,
    action: "user_deleted",
    metadata: { email: target.email },
  });

  return NextResponse.json({ ok: true });
}
