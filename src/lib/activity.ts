import { prisma } from "@/lib/prisma";

export async function logActivity(params: {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
