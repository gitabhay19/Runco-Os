// Shared event payload types used by both server and client.
import type { DealDTO, TaskDTO } from "@/lib/types";

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  link: string | null;
  kind: string;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatarColor: string | null;
  } | null;
}

interface BaseEvent {
  originUserId: string;
  /** When set, only this user should receive the event (used for personal notifications). */
  onlyUserId?: string;
}

export type RealtimeEvent =
  | (BaseEvent & { type: "deal:created"; deal: DealDTO })
  | (BaseEvent & { type: "deal:updated"; deal: DealDTO })
  | (BaseEvent & { type: "deal:moved"; deal: DealDTO })
  | (BaseEvent & { type: "deal:deleted"; dealId: string })
  | (BaseEvent & { type: "task:created"; task: TaskDTO })
  | (BaseEvent & { type: "task:updated"; task: TaskDTO })
  | (BaseEvent & { type: "task:deleted"; taskId: string })
  | (BaseEvent & { type: "notification:new"; notification: NotificationDTO });
