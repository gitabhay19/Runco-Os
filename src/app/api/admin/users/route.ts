import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { setResourceAccess, RESOURCES, type ResourceAccess } from "@/lib/permissions";

export async function GET() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const users = await prisma.user.findMany({
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
      _count: {
        select: { assignedDeals: true, assignedTasks: true },
      },
      permissions: {
        where: { resource: { in: RESOURCES as readonly string[] as string[] } },
        select: { resource: true, canView: true },
      },
    },
  });

  return NextResponse.json({
    users: users.map((u) => {
      const access = {
        pipeline: true,
        tasks: true,
        contacts: true,
        analytics: true,
      } as ResourceAccess;
      for (const p of u.permissions) {
        if ((RESOURCES as readonly string[]).includes(p.resource)) {
          access[p.resource as keyof ResourceAccess] = p.canView;
        }
      }
      const { permissions: _omit, ...rest } = u;
      return {
        ...rest,
        joiningDate: u.joiningDate?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        access,
      };
    }),
    currentUserId: admin.id,
  });
}

const accessSchema = z
  .object({
    pipeline: z.boolean(),
    tasks: z.boolean(),
    contacts: z.boolean(),
    analytics: z.boolean(),
  })
  .partial();

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(120),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  designation: z.string().max(120).optional(),
  department: z.string().max(120).optional(),
  employeeId: z.string().max(40).optional(),
  employmentType: z.string().max(40).optional(),
  joiningDate: z.string().datetime().nullable().optional(),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#0ea5e9"),
  access: accessSchema.optional(),
});

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      passwordHash,
      role: data.role,
      designation: data.designation ?? null,
      department: data.department ?? null,
      employeeId: data.employeeId ?? null,
      employmentType: data.employmentType ?? null,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
      avatarColor: data.avatarColor,
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
      createdAt: true,
    },
  });

  await logActivity({
    userId: admin.id,
    entityType: "user",
    entityId: user.id,
    action: "user_created",
    metadata: { email: user.email, role: user.role },
  });

  // Apply per-resource permissions for non-admin users.
  if (data.role === "USER" && data.access) {
    await setResourceAccess(user.id, data.access);
  }

  // Welcome email + in-app notification (don't block the response on email failure).
  const loginUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000/login";
  const tpl = welcomeEmail({
    name: user.name,
    email: user.email,
    password: data.password,
    loginUrl: `${loginUrl}/login`,
  });
  void sendEmail({ to: user.email, subject: tpl.subject, text: tpl.text, html: tpl.html });

  await notify({
    recipientIds: [user.id],
    actorId: admin.id,
    title: "Welcome to Runco OS",
    body: "Your account is ready. Check your email for sign-in details.",
    link: "/profile",
    kind: "user_welcome",
    entityType: "user",
    entityId: user.id,
  });

  return NextResponse.json({
    user: {
      ...user,
      joiningDate: user.joiningDate?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    },
  });
}
