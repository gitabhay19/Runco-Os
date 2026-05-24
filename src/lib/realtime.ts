import "server-only";
import type { RealtimeEvent } from "@/lib/realtime-events";
import type { DealDTO, TaskDTO } from "@/lib/types";

// Module-level subscriber registry. In dev, hot reloads can wipe the registry,
// so we stash it on globalThis to survive HMR.
type Subscriber = (event: RealtimeEvent) => void;

interface RealtimeBus {
  subs: Map<string, { userId: string; role: "ADMIN" | "USER"; cb: Subscriber }>;
}

const g = globalThis as unknown as { __realtime?: RealtimeBus };
if (!g.__realtime) {
  g.__realtime = { subs: new Map() };
}
const bus = g.__realtime;

let nextId = 0;

export function subscribe(
  userId: string,
  role: "ADMIN" | "USER",
  cb: Subscriber
): () => void {
  const id = `s${++nextId}`;
  bus.subs.set(id, { userId, role, cb });
  return () => {
    bus.subs.delete(id);
  };
}

/**
 * Decide whether a subscriber should receive an event.
 * Admins see everything; users only see deals/tasks they're involved with.
 */
function isVisibleToSubscriber(
  event: RealtimeEvent,
  subUserId: string,
  subRole: "ADMIN" | "USER"
): boolean {
  // Personal events (notifications) target a single user.
  if (event.onlyUserId) {
    return event.onlyUserId === subUserId;
  }

  if (subRole === "ADMIN") return true;

  switch (event.type) {
    case "deal:created":
    case "deal:updated":
    case "deal:moved": {
      const d: DealDTO = event.deal;
      if (d.createdById === subUserId) return true;
      if (d.assignees.some((a) => a.user.id === subUserId)) return true;
      return false;
    }
    case "deal:deleted":
      // Best-effort: deletes are broadcast to everyone, the client will
      // simply ignore the event if the deal isn't in its local state.
      return true;
    case "task:created":
    case "task:updated": {
      const t: TaskDTO = event.task;
      return t.assignee.id === subUserId || t.createdBy.id === subUserId;
    }
    case "task:deleted":
      return true;
    case "notification:new":
      // Without onlyUserId, default to broadcasting to recipient userId only.
      return event.notification.userId === subUserId;
    default:
      return false;
  }
}

export function broadcast(event: RealtimeEvent) {
  for (const { userId, role, cb } of bus.subs.values()) {
    // Skip the originator — they already have the optimistic update.
    if (userId === event.originUserId) continue;
    if (!isVisibleToSubscriber(event, userId, role)) continue;
    try {
      cb(event);
    } catch {
      // ignore subscriber errors
    }
  }
}
