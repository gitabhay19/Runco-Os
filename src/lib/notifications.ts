import "server-only";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";
import type { NotificationDTO } from "@/lib/realtime-events";

export type NotificationKind =
  | "deal_assigned"
  | "deal_moved"
  | "deal_updated"
  | "task_assigned"
  | "task_status_changed"
  | "user_welcome"
  | "info";

interface CreateInput {
  recipientIds: string[];
  actorId?: string | null;
  title: string;
  body?: string;
  link?: string;
  kind?: NotificationKind;
  entityType?: string;
  entityId?: string;
}

/**
 * Create one notification per recipient, skipping the actor.
 * Broadcasts a `notification:new` realtime event to each recipient.
 */
export async function notify({
  recipientIds,
  actorId,
  title,
  body,
  link,
  kind = "info",
  entityType,
  entityId,
}: CreateInput) {
  const targets = Array.from(
    new Set(recipientIds.filter((id) => id && id !== actorId))
  );
  if (targets.length === 0) return;

  const created = await prisma.$transaction(
    targets.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          actorId: actorId ?? null,
          title,
          body: body ?? null,
          link: link ?? null,
          kind,
          entityType: entityType ?? null,
          entityId: entityId ?? null,
        },
        include: {
          actor: {
            select: { id: true, name: true, email: true, avatarColor: true },
          },
        },
      })
    )
  );

  for (const n of created) {
    const dto: NotificationDTO = {
      id: n.id,
      userId: n.userId,
      title: n.title,
      body: n.body,
      link: n.link,
      kind: n.kind,
      entityType: n.entityType,
      entityId: n.entityId,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      actor: n.actor
        ? {
            id: n.actor.id,
            name: n.actor.name,
            email: n.actor.email,
            avatarColor: n.actor.avatarColor,
          }
        : null,
    };
    broadcast({
      type: "notification:new",
      notification: dto,
      originUserId: actorId ?? "__system__",
      onlyUserId: n.userId,
    });
  }
}
